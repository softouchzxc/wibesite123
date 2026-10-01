import { CABIN_CLASSES, MAX_PASSENGERS, type CabinClass } from "./constants";
import { isDateKey } from "./datetime";
import type { PassengerCounts } from "./pricing";

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function intParam(value: string | string[] | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(first(value) ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Пасажири та клас обслуговування з параметрів адреси, з безпечними межами. */
export function parsePassengers(params: RawParams): PassengerCounts & { cabinClass: CabinClass } {
  const adults = intParam(params.adults, 1, 1, MAX_PASSENGERS);
  const children = intParam(params.children, 0, 0, MAX_PASSENGERS - adults);
  const infants = intParam(params.infants, 0, 0, Math.min(adults, MAX_PASSENGERS - adults - children));
  const cabin = first(params.cabin);
  const cabinClass = CABIN_CLASSES.includes(cabin as CabinClass) ? (cabin as CabinClass) : "ECONOMY";
  return { adults, children, infants, cabinClass };
}

export type SearchParams = ReturnType<typeof parsePassengers> & { origin: string; destination: string; date: string };

/** Повний пошуковий запит або null, якщо в адресі бракує напрямку чи дати. */
export function parseSearch(params: RawParams): SearchParams | null {
  const origin = (first(params.from) ?? "").toUpperCase();
  const destination = (first(params.to) ?? "").toUpperCase();
  const date = first(params.date);
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) return null;
  if (!isDateKey(date)) return null;
  return { origin, destination, date, ...parsePassengers(params) };
}

export function passengerQuery(pax: PassengerCounts & { cabinClass: CabinClass }): string {
  return new URLSearchParams({
    adults: String(pax.adults),
    children: String(pax.children),
    infants: String(pax.infants),
    cabin: pax.cabinClass,
  }).toString();
}

export function searchQuery(search: SearchParams): string {
  return `from=${search.origin}&to=${search.destination}&date=${search.date}&${passengerQuery(search)}`;
}
