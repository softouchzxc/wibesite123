import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isDateKey } from "./datetime";
import { parseMoney } from "./format";

// Схеми для полів адмін-форм. Значення приходять рядками з FormData.

function toNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export const text = (label: string, min = 1, max = 120) =>
  z.string().min(min, `${label}: обов'язкове поле.`).max(max, `${label}: не більше ${max} символів.`);

export const optionalText = (max = 300) =>
  z
    .string()
    .max(max, `Не більше ${max} символів.`)
    .transform((value) => value || null);

export const number = (label: string, min: number, max: number) =>
  z
    .string()
    .refine((value) => {
      const n = toNumber(value);
      return n !== null && n >= min && n <= max;
    }, `${label}: число від ${min} до ${max}.`)
    .transform((value) => toNumber(value)!);

export const integer = (label: string, min: number, max: number) =>
  z
    .string()
    .refine((value) => {
      const n = toNumber(value);
      return n !== null && Number.isInteger(n) && n >= min && n <= max;
    }, `${label}: ціле число від ${min} до ${max}.`)
    .transform((value) => toNumber(value)!);

/** Сума в гривнях → копійки. */
export const money = (label: string, min = 0) =>
  z
    .string()
    .refine((value) => {
      const kopecks = parseMoney(value);
      return kopecks !== null && kopecks >= min;
    }, `${label}: вкажіть суму в гривнях, наприклад 1250 або 1250,50.`)
    .transform((value) => parseMoney(value)!);

export const code = (label: string, pattern: RegExp, hint: string) =>
  z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => pattern.test(value), `${label}: ${hint}`);

/** Необов'язкова дата YYYY-MM-DD; endOfDay — кінець доби за UTC. */
export const optionalDate = (label: string, endOfDay = false) =>
  z
    .string()
    .refine((value) => value === "" || isDateKey(value), `${label}: некоректна дата.`)
    .transform((value) => (value ? new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`) : null));

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
