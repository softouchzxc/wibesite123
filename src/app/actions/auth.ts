"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { STAFF_ROLES, type Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { field, zodFormState, type FormState } from "@/lib/form";
import { createSession, deleteSession } from "@/lib/session";

const passwordSchema = z
  .string()
  .min(8, "Пароль має містити щонайменше 8 символів.")
  .max(72, "Пароль задовгий.")
  .regex(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/, "Пароль має містити хоча б одну літеру.")
  .regex(/\d/, "Пароль має містити хоча б одну цифру.");

const nameSchema = (label: string) =>
  z.string().min(2, `${label}: щонайменше 2 символи.`).max(60, `${label}: забагато символів.`);

const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s()-]{10,20}$/, "Вкажіть номер телефону у форматі +380 XX XXX XX XX.");

const registerSchema = z.object({
  firstName: nameSchema("Ім'я"),
  lastName: nameSchema("Прізвище"),
  email: z.email("Вкажіть коректну електронну адресу."),
  phone: phoneSchema.or(z.literal("")),
  password: passwordSchema,
});

export async function register(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    email: field(formData, "email").toLowerCase(),
    phone: field(formData, "phone"),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  if (formData.get("password") !== formData.get("passwordConfirm")) {
    return { error: "Паролі не збігаються." };
  }

  const { password, phone, ...data } = parsed.data;
  const exists = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) return { error: "Користувач із такою електронною адресою вже зареєстрований." };

  const user = await db.user.create({
    data: { ...data, phone: phone || null, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true },
  });
  await createSession(user.id);
  redirect(safeNextPath(formData.get("next"), "/cabinet"));
}

async function verifyCredentials(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return null;
  const user = await db.user.findUnique({ where: { email } });
  // Хеш порівнюємо навіть для неіснуючого користувача, щоб час відповіді не видавав, чи є такий акаунт.
  const hash = user?.passwordHash ?? "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6C0oH8mFh5b0l1r3mF6m5vJ1bQeK";
  const valid = await bcrypt.compare(password, hash);
  return user && valid ? user : null;
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await verifyCredentials(formData);
  if (!user) return { error: "Невірна електронна адреса або пароль." };
  if (user.isBlocked) return { error: "Обліковий запис заблоковано. Зверніться до служби підтримки." };
  await createSession(user.id);
  redirect(safeNextPath(formData.get("next"), "/cabinet"));
}

export async function adminLogin(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await verifyCredentials(formData);
  if (!user || user.isBlocked || !STAFF_ROLES.includes(user.role as Role)) {
    return { error: "Невірні дані для входу або недостатньо прав доступу." };
  }
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  await deleteSession();
  redirect(user && STAFF_ROLES.includes(user.role) ? "/admin/login" : "/");
}

const profileSchema = z.object({
  firstName: nameSchema("Ім'я"),
  lastName: nameSchema("Прізвище"),
  phone: phoneSchema.or(z.literal("")),
});

export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Сесія завершилася. Увійдіть ще раз." };
  const parsed = profileSchema.safeParse({
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    phone: field(formData, "phone"),
  });
  if (!parsed.success) return zodFormState(parsed.error);
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, phone: parsed.data.phone || null } });
  return { success: "Профіль оновлено." };
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Сесія завершилася. Увійдіть ще раз." };
  const current = String(formData.get("currentPassword") ?? "");
  const next = passwordSchema.safeParse(String(formData.get("newPassword") ?? ""));
  if (!next.success) return zodFormState(next.error);
  if (formData.get("newPassword") !== formData.get("newPasswordConfirm")) {
    return { error: "Нові паролі не збігаються." };
  }
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) {
    return { error: "Поточний пароль введено невірно." };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next.data, 10) } });
  return { success: "Пароль змінено." };
}
