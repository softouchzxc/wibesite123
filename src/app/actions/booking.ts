"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import type { PassengerType } from "@/lib/constants";
import { isDateKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { field, zodFormState, type FormState } from "@/lib/form";
import {
  OrderError,
  cancelOrder,
  createOrder,
  customerRefundAmount,
  customerRefundBlocker,
  findActivePromo,
  orderInclude,
  payOrder,
} from "@/lib/orders";
import { getPaymentProvider } from "@/lib/providers/payments";
import { parsePassengers } from "@/lib/search-params";

const dateField = (message: string) =>
  z
    .string()
    .refine(isDateKey, message)
    .transform((value) => new Date(`${value}T00:00:00Z`));

const latinName = (label: string) =>
  z
    .string()
    .min(2, `${label}: щонайменше 2 літери.`)
    .max(40, `${label}: забагато символів.`)
    .regex(/^[A-Za-z][A-Za-z' -]*$/, `${label}: вкажіть латиницею, як у паспорті.`)
    .transform((value) => value.toUpperCase());

const passengerSchema = z.object({
  firstName: latinName("Ім'я"),
  lastName: latinName("Прізвище"),
  gender: z.enum(["M", "F"], "Оберіть стать."),
  birthDate: dateField("Вкажіть дату народження."),
  citizenship: z.string().min(2, "Вкажіть громадянство.").max(60),
  documentNumber: z
    .string()
    .regex(/^[A-Za-z0-9]{5,15}$/, "Номер документа: 5–15 латинських літер і цифр без пробілів.")
    .transform((value) => value.toUpperCase()),
  documentExpiry: dateField("Вкажіть коректний термін дії документа.").nullable(),
});

const contactSchema = z.object({
  contactEmail: z.email("Вкажіть коректну електронну адресу."),
  contactPhone: z.string().regex(/^\+?[\d\s()-]{10,20}$/, "Вкажіть номер телефону у форматі +380 XX XXX XX XX."),
});

export async function submitBooking(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Сесія завершилася. Увійдіть до кабінету та повторіть бронювання." };

  const pax = parsePassengers({
    adults: field(formData, "adults"),
    children: field(formData, "children"),
    infants: field(formData, "infants"),
    cabin: field(formData, "cabin"),
  });
  const types: PassengerType[] = [
    ...Array<PassengerType>(pax.adults).fill("ADULT"),
    ...Array<PassengerType>(pax.children).fill("CHILD"),
    ...Array<PassengerType>(pax.infants).fill("INFANT"),
  ];

  const passengers = [];
  for (const [i, type] of types.entries()) {
    const parsed = passengerSchema.safeParse({
      firstName: field(formData, `p${i}_firstName`),
      lastName: field(formData, `p${i}_lastName`),
      gender: field(formData, `p${i}_gender`),
      birthDate: field(formData, `p${i}_birthDate`),
      citizenship: field(formData, `p${i}_citizenship`),
      documentNumber: field(formData, `p${i}_documentNumber`),
      documentExpiry: field(formData, `p${i}_documentExpiry`) || null,
    });
    if (!parsed.success) {
      const state = zodFormState(parsed.error);
      return { ...state, error: `Пасажир ${i + 1}: перевірте правильність даних.` };
    }
    passengers.push({ type, ...parsed.data });
  }

  const contacts = contactSchema.safeParse({
    contactEmail: field(formData, "contactEmail").toLowerCase(),
    contactPhone: field(formData, "contactPhone"),
  });
  if (!contacts.success) return zodFormState(contacts.error);
  if (formData.get("terms") !== "on") return { error: "Підтвердьте згоду з умовами бронювання." };

  let orderId: string;
  try {
    const order = await createOrder({
      userId: user.id,
      flightId: field(formData, "flightId"),
      tariffId: field(formData, "tariffId"),
      cabinClass: pax.cabinClass,
      passengers,
      extraServiceIds: formData.getAll("extras").filter((v): v is string => typeof v === "string"),
      promoCode: field(formData, "promoCode") || null,
      ...contacts.data,
    });
    orderId = order.id;
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error("Не вдалося створити замовлення", error);
    return { error: "Не вдалося створити бронювання. Спробуйте ще раз." };
  }
  redirect(`/checkout/${orderId}`);
}

export type PromoCheck =
  | { ok: true; code: string; discountType: string; discountValue: number; minOrderAmount: number }
  | { ok: false; error: string };

export async function checkPromo(code: string): Promise<PromoCheck> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Увійдіть до кабінету, щоб застосувати промокод." };
  if (typeof code !== "string" || !code.trim() || code.length > 40) {
    return { ok: false, error: "Введіть промокод." };
  }
  const promo = await findActivePromo(code);
  if (!promo) return { ok: false, error: "Промокод недійсний або термін його дії завершився." };
  return {
    ok: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    minOrderAmount: promo.minOrderAmount,
  };
}

/** Замовлення, яке належить поточному користувачу, або null. */
async function ownOrderId(formData: FormData): Promise<string | null> {
  const user = await getCurrentUser();
  const orderId = field(formData, "orderId");
  if (!user || !orderId) return null;
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, select: { id: true } });
  return order?.id ?? null;
}

export async function payForOrder(_state: FormState, formData: FormData): Promise<FormState> {
  const orderId = await ownOrderId(formData);
  if (!orderId) return { error: "Замовлення не знайдено." };

  // Результат платежу можна обирати лише в тестовому режимі.
  const outcome = getPaymentProvider().isDemo && formData.get("outcome") === "failure" ? "failure" : "success";
  const result = await payOrder(orderId, outcome);
  if (!result.ok) return { error: result.error };
  redirect(`/confirmation/${orderId}`);
}

export async function cancelOwnOrder(_state: FormState, formData: FormData): Promise<FormState> {
  const orderId = await ownOrderId(formData);
  if (!orderId) return { error: "Замовлення не знайдено." };

  const order = await db.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) return { error: "Замовлення не знайдено." };
  if (order.status !== "PENDING_PAYMENT") {
    const blocker = customerRefundBlocker(order);
    if (blocker) return { error: blocker };
  }
  const result = await cancelOrder(orderId, customerRefundAmount);
  if (!result.ok) return { error: result.error };
  redirect(`/cabinet/bookings/${orderId}`);
}
