"use server";

// Серверні дії адмін-панелі: замовлення, клієнти, співробітники, налаштування.

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { integer, isUniqueViolation, money, number, text } from "@/lib/admin-form";
import { requireStaff } from "@/lib/auth";
import { STAFF_ROLES, type Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { field, zodFormState, type FormState } from "@/lib/form";
import { cancelOrder } from "@/lib/orders";
import { saveSettings } from "@/lib/settings";

// ── Замовлення ──────────────────────────────────────────────────────────────

/** Скасування замовлення співробітником. Оплачене замовлення повертається повністю. */
export async function adminCancelOrder(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("orders.manage");
  const orderId = field(formData, "orderId");
  const result = await cancelOrder(orderId, (order) => order.total);
  if (!result.ok) return { error: result.error };
  redirect(`/admin/orders/${orderId}?saved=1`);
}

// ── Клієнти ─────────────────────────────────────────────────────────────────

export async function setCustomerBlocked(formData: FormData) {
  await requireStaff("customers.manage");
  const id = field(formData, "id");
  // Цією дією керують лише клієнтами: співробітників змінює головний адміністратор.
  await db.user.updateMany({
    where: { id, role: "CUSTOMER" },
    data: { isBlocked: formData.get("blocked") === "true" },
  });
  redirect(`/admin/customers/${id}?saved=1`);
}

// ── Співробітники ───────────────────────────────────────────────────────────

const staffSchema = z.object({
  firstName: text("Ім'я", 2, 60),
  lastName: text("Прізвище", 2, 60),
  email: z.email("Вкажіть коректну електронну адресу."),
  role: z.enum(STAFF_ROLES as [Role, ...Role[]], "Оберіть роль."),
});

const staffPassword = z
  .string()
  .min(10, "Пароль співробітника має містити щонайменше 10 символів.")
  .max(72, "Пароль задовгий.")
  .regex(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/, "Пароль має містити хоча б одну літеру.")
  .regex(/\d/, "Пароль має містити хоча б одну цифру.");

export async function saveStaff(_state: FormState, formData: FormData): Promise<FormState> {
  const current = await requireStaff("admins.manage");
  const parsed = staffSchema.safeParse({
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    email: field(formData, "email").toLowerCase(),
    role: field(formData, "role"),
  });
  if (!parsed.success) return zodFormState(parsed.error);

  const id = field(formData, "id");
  const isBlocked = formData.get("isBlocked") === "on";
  const passwordRaw = String(formData.get("password") ?? "");
  if (!id && !passwordRaw) return { error: "Задайте пароль для нового співробітника." };
  const password = passwordRaw ? staffPassword.safeParse(passwordRaw) : null;
  if (password && !password.success) return zodFormState(password.error);

  if (id) {
    const target = await db.user.findUnique({ where: { id } });
    if (!target || !STAFF_ROLES.includes(target.role as Role)) return { error: "Співробітника не знайдено." };
    const losesAdmin = target.role === "ADMIN" && (parsed.data.role !== "ADMIN" || isBlocked);
    if (losesAdmin) {
      if (target.id === current.id) return { error: "Не можна понизити або заблокувати власний обліковий запис." };
      const otherAdmins = await db.user.count({ where: { role: "ADMIN", isBlocked: false, id: { not: id } } });
      if (otherAdmins === 0) return { error: "У системі має залишатися хоча б один головний адміністратор." };
    }
  }

  const data = {
    ...parsed.data,
    isBlocked,
    ...(password ? { passwordHash: await bcrypt.hash(password.data, 10) } : {}),
  };
  try {
    if (id) await db.user.update({ where: { id }, data });
    else await db.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Користувач із такою електронною адресою вже існує." };
    throw error;
  }
  redirect("/admin/admins?saved=1");
}

// ── Налаштування ────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  siteName: text("Назва сайту", 1, 40),
  supportEmail: z.email("Вкажіть коректну електронну адресу підтримки."),
  supportPhone: text("Телефон підтримки", 5, 30),
  serviceFeePercent: number("Сервісний збір, %", 0, 50),
  serviceFeeFixed: money("Фіксований збір"),
  childDiscountPercent: integer("Знижка для дітей", 0, 100),
  infantDiscountPercent: integer("Знижка для немовлят", 0, 100),
});

export async function updateSettings(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff("settings.manage");
  const parsed = settingsSchema.safeParse({
    siteName: field(formData, "siteName"),
    supportEmail: field(formData, "supportEmail"),
    supportPhone: field(formData, "supportPhone"),
    serviceFeePercent: field(formData, "serviceFeePercent"),
    serviceFeeFixed: field(formData, "serviceFeeFixed"),
    childDiscountPercent: field(formData, "childDiscountPercent"),
    infantDiscountPercent: field(formData, "infantDiscountPercent"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  await saveSettings({ ...parsed.data, demoBanner: formData.get("demoBanner") === "on" });
  redirect("/admin/settings?saved=1");
}
