import type { Role } from "./constants";

// Права доступу адмін-панелі. «view» — перегляд розділу, «manage» — зміни в ньому.
export const PERMISSIONS = {
  "dashboard.view": ["SUPPORT", "MANAGER", "ADMIN"],
  "orders.view": ["SUPPORT", "MANAGER", "ADMIN"],
  "orders.manage": ["MANAGER", "ADMIN"],
  "bookings.view": ["SUPPORT", "MANAGER", "ADMIN"],
  "customers.view": ["SUPPORT", "MANAGER", "ADMIN"],
  "customers.manage": ["MANAGER", "ADMIN"],
  "payments.view": ["MANAGER", "ADMIN"],
  "flights.view": ["SUPPORT", "MANAGER", "ADMIN"],
  "flights.manage": ["MANAGER", "ADMIN"],
  "airlines.view": ["MANAGER", "ADMIN"],
  "airlines.manage": ["MANAGER", "ADMIN"],
  "airports.view": ["MANAGER", "ADMIN"],
  "airports.manage": ["MANAGER", "ADMIN"],
  "tariffs.view": ["MANAGER", "ADMIN"],
  "tariffs.manage": ["MANAGER", "ADMIN"],
  "promocodes.view": ["MANAGER", "ADMIN"],
  "promocodes.manage": ["MANAGER", "ADMIN"],
  "settings.manage": ["ADMIN"],
  "admins.manage": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
