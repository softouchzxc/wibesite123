const moneyFormat = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
const moneyFormatExact = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Сума в копійках → "12 345 ₴". Копійки показуються лише якщо вони є. */
export function formatMoney(kopecks: number): string {
  const formatter = kopecks % 100 === 0 ? moneyFormat : moneyFormatExact;
  return `${formatter.format(kopecks / 100)} ₴`;
}

/** Гривні з форми ("1250" або "1250,50") → копійки. Повертає null для некоректного значення. */
export function parseMoney(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Українська множина: plural(3, ["пасажир", "пасажири", "пасажирів"]) → "пасажири". */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

export function countLabel(n: number, forms: [string, string, string]): string {
  return `${n} ${plural(n, forms)}`;
}

export const PASSENGER_FORMS: [string, string, string] = ["пасажир", "пасажири", "пасажирів"];

export function stopsLabel(stops: number): string {
  return stops === 0 ? "Прямий" : countLabel(stops, ["пересадка", "пересадки", "пересадок"]);
}

export function baggageLabel(kg: number): string {
  return kg > 0 ? `Багаж ${kg} кг` : "Без зареєстрованого багажу";
}
