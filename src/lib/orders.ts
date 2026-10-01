import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  PAYMENT_WINDOW_MINUTES,
  REFUND_CLOSE_HOURS,
  type CabinClass,
  type PassengerType,
} from "./constants";
import { ageOn } from "./datetime";
import { orderTotals, passengerPrice, type PromoRule } from "./pricing";
import { getFlightProvider } from "./providers/flights";
import { getPaymentProvider } from "./providers/payments";
import { getSettings } from "./settings";

export const orderInclude = {
  bookings: {
    include: {
      flight: { include: { airline: true, origin: true, destination: true } },
      passengers: true,
    },
  },
  extras: true,
  payments: { orderBy: { createdAt: "desc" } },
  promoCode: true,
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/** Помилка з текстом, який можна показати користувачу. */
export class OrderError extends Error {}

const PNR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePnr() {
  return Array.from(randomBytes(6), (b) => PNR_ALPHABET[b % PNR_ALPHABET.length]).join("");
}

function generateOrderNumber() {
  return `KR-${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
}

// Префікс 000 не належить жодній авіакомпанії: номери квитків демонстраційні.
function generateTicketNumber() {
  return `000-${String(randomInt(0, 10_000_000_000)).padStart(10, "0")}`;
}

/** Чинний промокод або null. Мінімальну суму замовлення перевіряє розрахунок знижки. */
export async function findActivePromo(code: string) {
  const promo = await db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo || !promo.isActive) return null;
  const now = new Date();
  if (promo.validFrom && promo.validFrom > now) return null;
  if (promo.validTo && promo.validTo < now) return null;
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return null;
  return promo;
}

/** Скасовує замовлення, які не оплатили вчасно. */
export async function expireStaleOrders() {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    select: { id: true },
  });
  if (stale.length === 0) return;
  const ids = stale.map((o) => o.id);
  const now = new Date();
  await db.$transaction([
    db.booking.updateMany({ where: { orderId: { in: ids } }, data: { status: "CANCELLED", cancelledAt: now } }),
    db.order.updateMany({
      where: { id: { in: ids }, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED", cancelledAt: now },
    }),
  ]);
}

export type PassengerInput = {
  type: PassengerType;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: Date;
  citizenship: string;
  documentNumber: string;
  documentExpiry: Date | null;
};

export type CreateOrderInput = {
  userId: string;
  flightId: string;
  tariffId: string;
  cabinClass: CabinClass;
  passengers: PassengerInput[];
  extraServiceIds: string[];
  promoCode: string | null;
  contactEmail: string;
  contactPhone: string;
};

export async function createOrder(input: CreateOrderInput): Promise<{ id: string }> {
  const count = (type: PassengerType) => input.passengers.filter((p) => p.type === type).length;
  const pax = { adults: count("ADULT"), children: count("CHILD"), infants: count("INFANT") };
  if (pax.adults < 1) throw new OrderError("У бронюванні має бути принаймні один дорослий пасажир.");
  if (pax.infants > pax.adults) throw new OrderError("Немовлят не може бути більше, ніж дорослих.");

  const offer = await getFlightProvider().getOffer(input.flightId, input.cabinClass, pax);
  if (!offer) throw new OrderError("На жаль, цей рейс уже недоступний або на ньому не залишилося місць.");
  const fare = offer.fares.find((f) => f.tariffId === input.tariffId);
  if (!fare) throw new OrderError("Обраний тариф більше не доступний. Поверніться до вибору тарифу.");

  // Вік визначається на дату вильоту.
  const departure = new Date(offer.departureAt);
  input.passengers.forEach((p, i) => {
    const age = ageOn(p.birthDate, departure);
    const ok = p.type === "ADULT" ? age >= 12 : p.type === "CHILD" ? age >= 2 && age < 12 : age >= 0 && age < 2;
    if (!ok || p.birthDate > new Date()) {
      throw new OrderError(`Пасажир ${i + 1}: дата народження не відповідає віковій категорії на день вильоту.`);
    }
    if (p.documentExpiry && p.documentExpiry < departure) {
      throw new OrderError(`Пасажир ${i + 1}: термін дії документа спливає до дати вильоту.`);
    }
  });

  const rules = await getSettings();
  const services = input.extraServiceIds.length
    ? await db.extraService.findMany({ where: { id: { in: input.extraServiceIds }, isActive: true } })
    : [];
  const seated = pax.adults + pax.children;
  const extraRows = services.map((s) => {
    const quantity = s.perPassenger ? seated : 1;
    return { serviceId: s.id, name: s.name, quantity, unitPrice: s.price, total: s.price * quantity };
  });
  const extrasTotal = extraRows.reduce((sum, e) => sum + e.total, 0);

  let promo: (PromoRule & { id: string }) | null = null;
  if (input.promoCode) {
    promo = await findActivePromo(input.promoCode);
    if (!promo) throw new OrderError("Промокод недійсний або термін його дії завершився.");
  }
  const totals = orderTotals(fare.totalPrice, extrasTotal, rules, promo);
  if (promo && totals.discount === 0) {
    throw new OrderError("Сума замовлення менша за мінімальну для цього промокоду.");
  }

  const order = await db.order.create({
    data: {
      number: generateOrderNumber(),
      userId: input.userId,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      ...totals,
      promoCodeId: totals.discount > 0 ? promo!.id : null,
      extras: { create: extraRows },
      bookings: {
        create: {
          pnr: generatePnr(),
          flightId: offer.id,
          tariffId: fare.tariffId,
          tariffName: fare.name,
          cabinClass: input.cabinClass,
          fareTotal: fare.totalPrice,
          carryOnKg: fare.carryOnKg,
          checkedBaggageKg: fare.checkedBaggageKg,
          isRefundable: fare.isRefundable,
          refundFeePercent: fare.refundFeePercent,
          isChangeable: fare.isChangeable,
          passengers: {
            create: input.passengers.map((p) => ({
              ...p,
              price: passengerPrice(offer.basePrice, fare.priceMultiplier, p.type, rules),
            })),
          },
        },
      },
    },
    select: { id: true },
  });
  return order;
}

function seatField(cabinClass: string) {
  return cabinClass === "BUSINESS" ? "seatsBusiness" : "seatsEconomy";
}

function seatsOf(booking: { passengers: { type: string }[] }) {
  return booking.passengers.filter((p) => p.type !== "INFANT").length;
}

async function releaseSeats(tx: Prisma.TransactionClient, bookings: OrderWithDetails["bookings"]) {
  for (const b of bookings) {
    await tx.flight.update({
      where: { id: b.flightId },
      data: { [seatField(b.cabinClass)]: { increment: seatsOf(b) } },
    });
  }
}

export type PayResult = { ok: true } | { ok: false; error: string };

/**
 * Оплата замовлення: резервує місця, підтверджує платіж у постачальника й фіксує результат.
 * Якщо платіж не пройшов, місця повертаються, а замовлення можна оплатити ще раз.
 */
export async function payOrder(orderId: string, demoOutcome?: "success" | "failure"): Promise<PayResult> {
  await expireStaleOrders();
  const order = await db.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) return { ok: false, error: "Замовлення не знайдено." };
  if (order.status === "PAID") return { ok: true };
  if (order.status !== "PENDING_PAYMENT") {
    return { ok: false, error: "Час на оплату минув або замовлення скасовано. Оформіть бронювання ще раз." };
  }

  // 1. Резервуємо місця. Умова в запиті не дає продати більше місць, ніж є.
  const held = await db.$transaction(async (tx) => {
    for (const b of order.bookings) {
      const field = seatField(b.cabinClass);
      const updated = await tx.flight.updateMany({
        where: { id: b.flightId, status: "SCHEDULED", [field]: { gte: seatsOf(b) } },
        data: { [field]: { decrement: seatsOf(b) } },
      });
      if (updated.count === 0) throw new OrderError("SOLD_OUT");
    }
    return true;
  }).catch((error) => {
    if (error instanceof OrderError) return false;
    throw error;
  });
  if (!held) return { ok: false, error: "На жаль, місця на цьому рейсі щойно закінчилися." };

  // 2. Платіж у постачальника.
  const provider = getPaymentProvider();
  let payment: { id: string } | null = null;
  let result: Awaited<ReturnType<typeof provider.confirmPayment>>;
  try {
    const intent = await provider.createPayment({
      orderNumber: order.number,
      amount: order.total,
      currency: order.currency,
      description: `Оплата замовлення ${order.number}`,
      returnUrl: `/confirmation/${order.id}`,
    });
    payment = await db.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerRef: intent.providerRef,
        amount: order.total,
        currency: order.currency,
      },
      select: { id: true },
    });
    result = await provider.confirmPayment(intent.providerRef, provider.isDemo ? demoOutcome : undefined);
  } catch (error) {
    console.error("Помилка платіжного сервісу", error);
    result = { success: false, reason: "Платіжний сервіс тимчасово недоступний. Спробуйте пізніше." };
  }

  // 3. Фіксуємо результат.
  if (!result.success) {
    await db.$transaction(async (tx) => {
      await releaseSeats(tx, order.bookings);
      if (payment) await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    });
    return { ok: false, error: result.reason };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: now },
    });
    if (claimed.count === 0) {
      // Замовлення вже завершив паралельний запит: повертаємо зарезервовані вдруге місця.
      await releaseSeats(tx, order.bookings);
      if (payment) await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return;
    }
    await tx.payment.update({ where: { id: payment!.id }, data: { status: "SUCCEEDED", paidAt: now } });
    await tx.booking.updateMany({ where: { orderId: order.id }, data: { status: "CONFIRMED" } });
    for (const b of order.bookings) {
      for (const p of b.passengers) {
        await tx.passenger.update({ where: { id: p.id }, data: { ticketNumber: generateTicketNumber() } });
      }
    }
    if (order.promoCodeId) {
      await tx.promoCode.update({ where: { id: order.promoCodeId }, data: { usedCount: { increment: 1 } } });
    }
  });
  return { ok: true };
}

/** Сума до повернення клієнту за умовами тарифу: сервісний збір і утримання за тарифом не повертаються. */
export function customerRefundAmount(order: OrderWithDetails): number {
  const penalty = order.bookings.reduce(
    (sum, b) => sum + Math.round((b.fareTotal * b.refundFeePercent) / 100 / 100) * 100,
    0,
  );
  return Math.max(0, order.total - order.serviceFee - penalty);
}

/** Чи може клієнт самостійно повернути квитки; якщо ні — причина. */
export function customerRefundBlocker(order: OrderWithDetails): string | null {
  if (order.status !== "PAID") return "Повернення доступне лише для оплачених замовлень.";
  if (order.bookings.some((b) => !b.isRefundable)) return "Обраний тариф не передбачає повернення коштів.";
  const closesAt = Date.now() + REFUND_CLOSE_HOURS * 60 * 60 * 1000;
  if (order.bookings.some((b) => b.flight.departureAt.getTime() < closesAt)) {
    return `Повернення онлайн закривається за ${REFUND_CLOSE_HOURS} години до вильоту. Зверніться до підтримки.`;
  }
  return null;
}

/**
 * Скасування замовлення. Неоплачене просто скасовується; оплачене повертається
 * через платіжний сервіс на суму refundAmount, а місця повертаються в продаж.
 */
export async function cancelOrder(orderId: string, refundAmount: (order: OrderWithDetails) => number): Promise<PayResult> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) return { ok: false, error: "Замовлення не знайдено." };
  const now = new Date();

  if (order.status === "PENDING_PAYMENT") {
    await db.$transaction([
      db.booking.updateMany({ where: { orderId }, data: { status: "CANCELLED", cancelledAt: now } }),
      db.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED", cancelledAt: now },
      }),
    ]);
    return { ok: true };
  }
  if (order.status !== "PAID") return { ok: false, error: "Це замовлення вже скасовано." };

  // Спершу змінюємо статус: з двох одночасних запитів повернення виконає лише один.
  const claimed = await db.order.updateMany({
    where: { id: orderId, status: "PAID" },
    data: { status: "REFUNDED", cancelledAt: now },
  });
  if (claimed.count === 0) return { ok: false, error: "Це замовлення вже скасовано." };

  const payment = order.payments.find((p) => p.status === "SUCCEEDED");
  const amount = Math.min(refundAmount(order), order.total);
  if (payment?.providerRef && amount > 0) {
    const provider = getPaymentProvider();
    const refund = await provider.refund(payment.providerRef, amount).catch((error) => {
      console.error("Помилка повернення коштів", error);
      return { success: false as const, reason: "Платіжний сервіс тимчасово недоступний. Спробуйте пізніше." };
    });
    if (!refund.success) {
      await db.order.update({ where: { id: orderId }, data: { status: "PAID", cancelledAt: null } });
      return { ok: false, error: refund.reason };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.booking.updateMany({ where: { orderId }, data: { status: "CANCELLED", cancelledAt: now } });
    if (payment) {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAmount: amount } });
    }
    await releaseSeats(
      tx,
      order.bookings.filter((b) => b.flight.departureAt > now),
    );
  });
  return { ok: true };
}
