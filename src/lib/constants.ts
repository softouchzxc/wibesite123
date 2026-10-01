// Допустимі значення рядкових полів бази даних та їхні українські назви.

export const ROLES = ["CUSTOMER", "SUPPORT", "MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: Role[] = ["SUPPORT", "MANAGER", "ADMIN"];

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Клієнт",
  SUPPORT: "Підтримка",
  MANAGER: "Менеджер",
  ADMIN: "Головний адміністратор",
};

export const CABIN_CLASSES = ["ECONOMY", "BUSINESS"] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];
export const CABIN_LABELS: Record<CabinClass, string> = {
  ECONOMY: "Економ",
  BUSINESS: "Бізнес",
};

export const PASSENGER_TYPES = ["ADULT", "CHILD", "INFANT"] as const;
export type PassengerType = (typeof PASSENGER_TYPES)[number];
export const PASSENGER_TYPE_LABELS: Record<PassengerType, string> = {
  ADULT: "Дорослий",
  CHILD: "Дитина (2–11 років)",
  INFANT: "Немовля (до 2 років)",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Очікує оплати",
  PAID: "Оплачено",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернено",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує оплати",
  CONFIRMED: "Підтверджено",
  CANCELLED: "Скасовано",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує",
  SUCCEEDED: "Успішний",
  FAILED: "Відхилено",
  REFUNDED: "Повернено",
};

export const FLIGHT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "За розкладом",
  CANCELLED: "Скасовано",
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENT: "Відсоток",
  FIXED: "Фіксована сума",
};

export type BadgeTone = "gray" | "green" | "amber" | "red" | "blue";

export const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING_PAYMENT: "amber",
  PENDING: "amber",
  PAID: "green",
  CONFIRMED: "green",
  SUCCEEDED: "green",
  SCHEDULED: "blue",
  CANCELLED: "red",
  FAILED: "red",
  REFUNDED: "gray",
};

// Країна, міста якої показуються на головній у списку «Вилітаємо з».
export const HOME_COUNTRY = "Україна";

export const MAX_PASSENGERS = 9;
// Неоплачене замовлення скасовується через цей час.
export const PAYMENT_WINDOW_MINUTES = 30;
// Продаж і повернення закриваються за цей час до вильоту.
export const SALES_CLOSE_HOURS = 2;
export const REFUND_CLOSE_HOURS = 3;

export const SESSION_COOKIE = "kryla_session";
