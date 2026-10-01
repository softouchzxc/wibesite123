// Час рейсів зберігається в UTC, а показується за місцевим часом аеропорту.

const LOCALE = "uk-UA";

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Перетворює місцевий час у заданому часовому поясі на момент UTC. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  let guess = wanted;
  // Дві ітерації потрібні для дат біля переходу на літній/зимовий час.
  for (let i = 0; i < 2; i++) {
    const p = partsInZone(new Date(guess), timeZone);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wanted - shown;
  }
  return new Date(guess);
}

/** "2026-10-15T08:30" (місцевий час) → UTC. Повертає null для некоректного рядка. */
export function parseLocalDateTime(value: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const date = zonedTimeToUtc(y, mo, d, h, mi, timeZone);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Дата у форматі YYYY-MM-DD за місцевим часом пояса. */
export function localDateKey(date: Date | string, timeZone: string): string {
  const p = partsInZone(new Date(date), timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Значення для <input type="datetime-local"> за місцевим часом пояса. */
export function toLocalInputValue(date: Date | string, timeZone: string): string {
  const p = partsInZone(new Date(date), timeZone);
  return `${localDateKey(date, timeZone)}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Година доби (0–23) за місцевим часом пояса. */
export function localHour(date: Date | string, timeZone: string): number {
  return partsInZone(new Date(date), timeZone).hour;
}

export function formatTime(date: Date | string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(date),
  );
}

export function formatDate(date: Date | string, timeZone = "Europe/Kyiv"): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, day: "numeric", month: "long", year: "numeric" }).format(
    new Date(date),
  );
}

export function formatDateShort(date: Date | string, timeZone = "Europe/Kyiv"): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, day: "numeric", month: "short", weekday: "short" }).format(
    new Date(date),
  );
}

export function formatDateTime(date: Date | string, timeZone = "Europe/Kyiv"): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(date));
}

/** Дата без часу для полів на кшталт дати народження (зберігаються як північ UTC). */
export function formatPlainDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(date),
  );
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} хв`;
  return m === 0 ? `${h} год` : `${h} год ${m} хв`;
}

/** Момент через вказану кількість днів від поточного (від'ємне значення — у минулому). */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Сьогоднішня дата за київським часом, YYYY-MM-DD. */
export function todayKey(): string {
  return localDateKey(new Date(), "Europe/Kyiv");
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Повних років на вказану дату. */
export function ageOn(birthDate: Date, on: Date): number {
  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < birthDate.getUTCMonth() ||
    (on.getUTCMonth() === birthDate.getUTCMonth() && on.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}
