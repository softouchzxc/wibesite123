"use server";

// Серверні дії довідників адмін-панелі: авіакомпанії, аеропорти, рейси, тарифи,
// додаткові послуги, промокоди. Кожна дія сама перевіряє права доступу.

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  code,
  integer,
  isUniqueViolation,
  isValidTimeZone,
  money,
  number,
  optionalDate,
  optionalText,
  text,
} from "@/lib/admin-form";
import { requireStaff } from "@/lib/auth";
import { CABIN_CLASSES } from "@/lib/constants";
import { parseLocalDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { field, zodFormState, type FormState } from "@/lib/form";

const checked = (formData: FormData, name: string) => formData.get(name) === "on";
const failed = (path: string, message: string) => redirect(`${path}?error=${encodeURIComponent(message)}`);

// ── Авіакомпанії ────────────────────────────────────────────────────────────

const airlineSchema = z.object({
  code: code("Код", /^[A-Z0-9]{2,3}$/, "2–3 латинські літери або цифри."),
  name: text("Назва"),
  country: optionalText(60),
  commissionPercent: number("Комісія", 0, 100),
});

export async function saveAirline(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("airlines.manage");
  const parsed = airlineSchema.safeParse({
    code: field(formData, "code"),
    name: field(formData, "name"),
    country: field(formData, "country"),
    commissionPercent: field(formData, "commissionPercent"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  const data = { ...parsed.data, isActive: checked(formData, "isActive") };
  const id = field(formData, "id");
  try {
    if (id) await db.airline.update({ where: { id }, data });
    else await db.airline.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Авіакомпанія з таким кодом уже існує." };
    throw error;
  }
  redirect("/admin/airlines?saved=1");
}

export async function deleteAirline(formData: FormData) {
  await requireStaff("airlines.manage");
  const id = field(formData, "id");
  if ((await db.flight.count({ where: { airlineId: id } })) > 0) {
    failed("/admin/airlines", "Авіакомпанію не можна видалити: у неї є рейси. Вимкніть її замість видалення.");
  }
  await db.airline.delete({ where: { id } });
  redirect("/admin/airlines?saved=1");
}

// ── Аеропорти ───────────────────────────────────────────────────────────────

const airportSchema = z.object({
  code: code("Код IATA", /^[A-Z]{3}$/, "рівно 3 латинські літери."),
  name: text("Назва"),
  city: text("Місто", 1, 60),
  country: text("Країна", 1, 60),
  timezone: z.string().refine(isValidTimeZone, "Часовий пояс: вкажіть назву IANA, наприклад Europe/Kyiv."),
});

export async function saveAirport(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("airports.manage");
  const parsed = airportSchema.safeParse({
    code: field(formData, "code"),
    name: field(formData, "name"),
    city: field(formData, "city"),
    country: field(formData, "country"),
    timezone: field(formData, "timezone"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  const data = { ...parsed.data, isActive: checked(formData, "isActive") };
  const id = field(formData, "id");
  try {
    if (id) await db.airport.update({ where: { id }, data });
    else await db.airport.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Аеропорт із таким кодом уже існує." };
    throw error;
  }
  redirect("/admin/airports?saved=1");
}

export async function deleteAirport(formData: FormData) {
  await requireStaff("airports.manage");
  const id = field(formData, "id");
  const flights = await db.flight.count({ where: { OR: [{ originId: id }, { destinationId: id }] } });
  if (flights > 0) {
    failed("/admin/airports", "Аеропорт не можна видалити: з ним пов'язані рейси. Вимкніть його замість видалення.");
  }
  await db.airport.delete({ where: { id } });
  redirect("/admin/airports?saved=1");
}

// ── Рейси ───────────────────────────────────────────────────────────────────

const flightSchema = z.object({
  flightNumber: text("Номер рейсу", 2, 10),
  airlineId: text("Авіакомпанія"),
  originId: text("Аеропорт вильоту"),
  destinationId: text("Аеропорт прибуття"),
  stops: integer("Пересадки", 0, 3),
  stopCity: optionalText(60),
  aircraft: optionalText(60),
  basePrice: money("Базова ціна", 100),
  seatsEconomy: integer("Місця економ", 0, 900),
  seatsBusiness: integer("Місця бізнес", 0, 200),
  status: z.enum(["SCHEDULED", "CANCELLED"], "Оберіть статус рейсу."),
});

export async function saveFlight(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("flights.manage");
  const parsed = flightSchema.safeParse({
    flightNumber: field(formData, "flightNumber").toUpperCase(),
    airlineId: field(formData, "airlineId"),
    originId: field(formData, "originId"),
    destinationId: field(formData, "destinationId"),
    stops: field(formData, "stops"),
    stopCity: field(formData, "stopCity"),
    aircraft: field(formData, "aircraft"),
    basePrice: field(formData, "basePrice"),
    seatsEconomy: field(formData, "seatsEconomy"),
    seatsBusiness: field(formData, "seatsBusiness"),
    status: field(formData, "status"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  const data = parsed.data;
  if (data.originId === data.destinationId) return { error: "Аеропорти вильоту та прибуття мають відрізнятися." };

  const [origin, destination] = await Promise.all([
    db.airport.findUnique({ where: { id: data.originId } }),
    db.airport.findUnique({ where: { id: data.destinationId } }),
  ]);
  if (!origin || !destination) return { error: "Оберіть аеропорти зі списку." };

  // Час у формі — місцевий для відповідного аеропорту.
  const departureAt = parseLocalDateTime(field(formData, "departureLocal"), origin.timezone);
  const arrivalAt = parseLocalDateTime(field(formData, "arrivalLocal"), destination.timezone);
  if (!departureAt || !arrivalAt) return { error: "Вкажіть дату й час вильоту та прибуття." };
  const durationMinutes = Math.round((arrivalAt.getTime() - departureAt.getTime()) / 60000);
  if (durationMinutes <= 0) return { error: "Прибуття має бути пізніше за виліт (з урахуванням часових поясів)." };
  if (durationMinutes > 48 * 60) return { error: "Тривалість рейсу не може перевищувати 48 годин." };

  const row = { ...data, stopCity: data.stops > 0 ? data.stopCity : null, departureAt, arrivalAt, durationMinutes };
  const id = field(formData, "id");
  if (id) await db.flight.update({ where: { id }, data: row });
  else await db.flight.create({ data: row });
  redirect("/admin/flights?saved=1");
}

export async function deleteFlight(formData: FormData) {
  await requireStaff("flights.manage");
  const id = field(formData, "id");
  if ((await db.booking.count({ where: { flightId: id } })) > 0) {
    failed("/admin/flights", "Рейс не можна видалити: на нього є бронювання. Змініть статус на «Скасовано».");
  }
  await db.flight.delete({ where: { id } });
  redirect("/admin/flights?saved=1");
}

// ── Тарифи ──────────────────────────────────────────────────────────────────

const tariffSchema = z.object({
  code: code("Код", /^[A-Z0-9_]{2,30}$/, "латинські літери, цифри та підкреслення."),
  name: text("Назва", 1, 60),
  cabinClass: z.enum(CABIN_CLASSES, "Оберіть клас обслуговування."),
  priceMultiplier: number("Множник ціни", 0.1, 20),
  carryOnKg: integer("Ручна поклажа", 0, 40),
  checkedBaggageKg: integer("Багаж", 0, 100),
  refundFeePercent: integer("Утримання при поверненні", 0, 100),
  description: optionalText(300),
  sortOrder: integer("Порядок", 0, 1000),
});

export async function saveTariff(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("tariffs.manage");
  const parsed = tariffSchema.safeParse({
    code: field(formData, "code"),
    name: field(formData, "name"),
    cabinClass: field(formData, "cabinClass"),
    priceMultiplier: field(formData, "priceMultiplier"),
    carryOnKg: field(formData, "carryOnKg"),
    checkedBaggageKg: field(formData, "checkedBaggageKg"),
    refundFeePercent: field(formData, "refundFeePercent"),
    description: field(formData, "description"),
    sortOrder: field(formData, "sortOrder"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  const isRefundable = checked(formData, "isRefundable");
  const data = {
    ...parsed.data,
    isRefundable,
    refundFeePercent: isRefundable ? parsed.data.refundFeePercent : 0,
    isChangeable: checked(formData, "isChangeable"),
    seatSelection: checked(formData, "seatSelection"),
    isActive: checked(formData, "isActive"),
  };
  const id = field(formData, "id");
  try {
    if (id) await db.tariff.update({ where: { id }, data });
    else await db.tariff.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Тариф із таким кодом уже існує." };
    throw error;
  }
  redirect("/admin/tariffs?saved=1");
}

export async function deleteTariff(formData: FormData) {
  await requireStaff("tariffs.manage");
  const id = field(formData, "id");
  if ((await db.booking.count({ where: { tariffId: id } })) > 0) {
    failed("/admin/tariffs", "Тариф не можна видалити: за ним є бронювання. Вимкніть його замість видалення.");
  }
  await db.tariff.delete({ where: { id } });
  redirect("/admin/tariffs?saved=1");
}

// ── Додаткові послуги ───────────────────────────────────────────────────────

const extraSchema = z.object({
  code: code("Код", /^[A-Z0-9_]{2,30}$/, "латинські літери, цифри та підкреслення."),
  name: text("Назва", 1, 80),
  description: optionalText(300),
  price: money("Ціна"),
  sortOrder: integer("Порядок", 0, 1000),
});

export async function saveExtra(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("tariffs.manage");
  const parsed = extraSchema.safeParse({
    code: field(formData, "code"),
    name: field(formData, "name"),
    description: field(formData, "description"),
    price: field(formData, "price"),
    sortOrder: field(formData, "sortOrder"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  const data = {
    ...parsed.data,
    perPassenger: checked(formData, "perPassenger"),
    isActive: checked(formData, "isActive"),
  };
  const id = field(formData, "id");
  try {
    if (id) await db.extraService.update({ where: { id }, data });
    else await db.extraService.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Послуга з таким кодом уже існує." };
    throw error;
  }
  redirect("/admin/tariffs?saved=1");
}

export async function deleteExtra(formData: FormData) {
  await requireStaff("tariffs.manage");
  // Продані послуги зберігають назву й ціну в замовленні, тому видалення безпечне.
  await db.extraService.delete({ where: { id: field(formData, "id") } });
  redirect("/admin/tariffs?saved=1");
}

// ── Промокоди ───────────────────────────────────────────────────────────────

const promoSchema = z.object({
  code: code("Код", /^[A-Z0-9_-]{3,30}$/, "3–30 латинських літер, цифр, дефісів або підкреслень."),
  description: optionalText(200),
  discountType: z.enum(["PERCENT", "FIXED"], "Оберіть тип знижки."),
  minOrderAmount: money("Мінімальна сума замовлення"),
  validFrom: optionalDate("Діє з"),
  validTo: optionalDate("Діє до", true),
});

export async function savePromoCode(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("promocodes.manage");
  const parsed = promoSchema.safeParse({
    code: field(formData, "code"),
    description: field(formData, "description"),
    discountType: field(formData, "discountType"),
    minOrderAmount: field(formData, "minOrderAmount") || "0",
    validFrom: field(formData, "validFrom"),
    validTo: field(formData, "validTo"),
  });
  if (!parsed.success) return zodFormState(parsed.error);

  // Значення знижки: відсотки (1–100) або сума в гривнях.
  const valueSchema =
    parsed.data.discountType === "PERCENT" ? integer("Знижка, %", 1, 100) : money("Знижка, ₴", 100);
  const value = valueSchema.safeParse(field(formData, "discountValue"));
  if (!value.success) return zodFormState(value.error);

  const maxUsesRaw = field(formData, "maxUses");
  const maxUses = maxUsesRaw ? integer("Ліміт використань", 1, 1_000_000).safeParse(maxUsesRaw) : null;
  if (maxUses && !maxUses.success) return zodFormState(maxUses.error);
  if (parsed.data.validFrom && parsed.data.validTo && parsed.data.validFrom > parsed.data.validTo) {
    return { error: "Дата початку дії не може бути пізнішою за дату завершення." };
  }

  const data = {
    ...parsed.data,
    discountValue: value.data,
    maxUses: maxUses ? maxUses.data : null,
    isActive: checked(formData, "isActive"),
  };
  const id = field(formData, "id");
  try {
    if (id) await db.promoCode.update({ where: { id }, data });
    else await db.promoCode.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Такий промокод уже існує." };
    throw error;
  }
  redirect("/admin/promocodes?saved=1");
}

export async function deletePromoCode(formData: FormData) {
  await requireStaff("promocodes.manage");
  const id = field(formData, "id");
  if ((await db.order.count({ where: { promoCodeId: id } })) > 0) {
    failed("/admin/promocodes", "Промокод уже використано в замовленнях. Вимкніть його замість видалення.");
  }
  await db.promoCode.delete({ where: { id } });
  redirect("/admin/promocodes?saved=1");
}
