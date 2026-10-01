import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSessionUserId } from "./session";
import { STAFF_ROLES, type Role } from "./constants";
import { can, type Permission } from "./permissions";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
};

/**
 * Поточний користувач. Роль і блокування щоразу перевіряються в базі, тому зміна
 * ролі чи блокування діє одразу, а не після завершення сесії.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await readSessionUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isBlocked: true },
  });
  if (!user || user.isBlocked) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role as Role,
  };
});

export function isStaff(user: CurrentUser | null): boolean {
  return !!user && STAFF_ROLES.includes(user.role);
}

/** Шлях для повернення після входу. Приймаються лише внутрішні адреси сайту. */
export function safeNextPath(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return user;
}

/** Доступ до адмін-панелі. Викликається на кожній сторінці та в кожній серверній дії. */
export async function requireStaff(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user)) redirect("/admin/login");
  if (!can(user.role, permission)) redirect("/admin/forbidden");
  return user;
}
