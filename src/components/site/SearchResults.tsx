"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Luggage, SlidersHorizontal, X } from "lucide-react";
import { localHour } from "@/lib/datetime";
import { baggageLabel, countLabel, formatMoney } from "@/lib/format";
import type { FlightOffer } from "@/lib/providers/flights/types";
import { FlightRoute } from "./FlightRoute";

const TIME_SLOTS = [
  { id: "night", label: "Ніч", hint: "00–06", from: 0, to: 6 },
  { id: "morning", label: "Ранок", hint: "06–12", from: 6, to: 12 },
  { id: "day", label: "День", hint: "12–18", from: 12, to: 18 },
  { id: "evening", label: "Вечір", hint: "18–24", from: 18, to: 24 },
];

const STOP_OPTIONS = [
  { id: 0, label: "Без пересадок" },
  { id: 1, label: "1 пересадка" },
  { id: 2, label: "2 і більше" },
];

const SORTS = {
  price: "Спочатку дешевші",
  duration: "Спочатку швидші",
  departure: "За часом вильоту",
} as const;
type Sort = keyof typeof SORTS;

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

function inSlots(hour: number, slots: Set<string>) {
  if (slots.size === 0) return true;
  return TIME_SLOTS.some((s) => slots.has(s.id) && hour >= s.from && hour < s.to);
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-bold text-slate-900">{title}</legend>
      {children}
    </fieldset>
  );
}

function SlotChips({ value, onChange }: { value: Set<string>; onChange: (value: Set<string>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TIME_SLOTS.map((slot) => (
        <button
          key={slot.id}
          type="button"
          aria-pressed={value.has(slot.id)}
          className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
            value.has(slot.id)
              ? "border-brand-600 bg-brand-50 text-brand-800"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => onChange(toggle(value, slot.id))}
        >
          {slot.label} <span className="font-normal text-slate-500">{slot.hint}</span>
        </button>
      ))}
    </div>
  );
}

// Тарифи в пропозиції відсортовані за ціною, тому перший — найдешевший.
const priceOf = (o: FlightOffer) => o.fares[0].totalPrice;

export function SearchResults({ offers, paxQuery, paxTotal }: { offers: FlightOffer[]; paxQuery: string; paxTotal: number }) {
  const bounds = useMemo(() => {
    const prices = offers.map(priceOf);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [offers]);
  const airlines = useMemo(() => {
    const map = new Map<string, string>();
    offers.forEach((o) => map.set(o.airline.code, o.airline.name));
    return [...map].sort((a, b) => a[1].localeCompare(b[1], "uk"));
  }, [offers]);

  const [maxPrice, setMaxPrice] = useState(bounds.max);
  const [stops, setStops] = useState<Set<number>>(new Set());
  const [airlineCodes, setAirlineCodes] = useState<Set<string>>(new Set());
  const [departSlots, setDepartSlots] = useState<Set<string>>(new Set());
  const [arriveSlots, setArriveSlots] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("price");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const list = offers.filter(
      (o) =>
        priceOf(o) <= maxPrice &&
        (stops.size === 0 || stops.has(Math.min(o.stops, 2))) &&
        (airlineCodes.size === 0 || airlineCodes.has(o.airline.code)) &&
        inSlots(localHour(o.departureAt, o.origin.timezone), departSlots) &&
        inSlots(localHour(o.arrivalAt, o.destination.timezone), arriveSlots),
    );
    return list.sort((a, b) =>
      sort === "price"
        ? priceOf(a) - priceOf(b)
        : sort === "duration"
          ? a.durationMinutes - b.durationMinutes
          : a.departureAt.localeCompare(b.departureAt),
    );
  }, [offers, maxPrice, stops, airlineCodes, departSlots, arriveSlots, sort]);

  const activeFilters =
    (maxPrice < bounds.max ? 1 : 0) + stops.size + airlineCodes.size + departSlots.size + arriveSlots.size;

  function reset() {
    setMaxPrice(bounds.max);
    setStops(new Set());
    setAirlineCodes(new Set());
    setDepartSlots(new Set());
    setArriveSlots(new Set());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
        <div className="card p-5 lg:sticky lg:top-20">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-extrabold text-slate-900">Фільтри</p>
            {activeFilters > 0 && (
              <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={reset}>
                Скинути
              </button>
            )}
          </div>

          {bounds.max > bounds.min && (
            <FilterGroup title="Ціна">
              <input
                type="range"
                className="w-full accent-brand-600"
                min={bounds.min}
                max={bounds.max}
                step={100}
                value={maxPrice}
                aria-label="Максимальна ціна"
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
              <p className="mt-1 text-sm text-slate-600">
                до <span className="font-bold text-slate-900">{formatMoney(maxPrice)}</span>
              </p>
            </FilterGroup>
          )}

          <FilterGroup title="Пересадки">
            <div className="space-y-2">
              {STOP_OPTIONS.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 rounded accent-brand-600"
                    checked={stops.has(option.id)}
                    onChange={() => setStops(toggle(stops, option.id))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Авіакомпанії">
            <div className="space-y-2">
              {airlines.map(([code, name]) => (
                <label key={code} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 rounded accent-brand-600"
                    checked={airlineCodes.has(code)}
                    onChange={() => setAirlineCodes(toggle(airlineCodes, code))}
                  />
                  {name}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Час вильоту">
            <SlotChips value={departSlots} onChange={setDepartSlots} />
          </FilterGroup>
          <FilterGroup title="Час прибуття">
            <SlotChips value={arriveSlots} onChange={setArriveSlots} />
          </FilterGroup>

          <button type="button" className="btn btn-primary mt-2 w-full lg:hidden" onClick={() => setFiltersOpen(false)}>
            Показати {countLabel(visible.length, ["рейс", "рейси", "рейсів"])}
          </button>
        </div>
      </aside>

      <div className={filtersOpen ? "hidden lg:block" : ""}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Знайдено: <span className="font-bold text-slate-900">{countLabel(visible.length, ["рейс", "рейси", "рейсів"])}</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" aria-hidden />
              Фільтри{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </button>
            <label className="sr-only" htmlFor="sort">
              Сортування
            </label>
            <select
              id="sort"
              className="input w-auto py-1.5 text-xs font-semibold"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              {Object.entries(SORTS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-semibold text-slate-900">Немає рейсів за обраними фільтрами</p>
            <button type="button" className="btn btn-secondary mt-4" onClick={reset}>
              <X className="size-4" aria-hidden />
              Скинути фільтри
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((offer) => {
              const fare = offer.fares[0];
              return (
                <li key={offer.id} className="card overflow-hidden transition hover:border-brand-300 hover:shadow-md">
                  <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-slate-700">
                        {offer.airline.name} <span className="font-normal text-slate-400">· {offer.flightNumber}</span>
                      </p>
                      <FlightRoute flight={offer} />
                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Luggage className="size-3.5" aria-hidden />
                          {baggageLabel(fare.checkedBaggageKg)}
                        </span>
                        {offer.seatsLeft <= 5 && (
                          <span className="font-semibold text-red-600">
                            Залишилося {countLabel(offer.seatsLeft, ["місце", "місця", "місць"])}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-8 md:pt-0">
                      <div className="md:text-right">
                        <p className="text-2xl font-extrabold text-slate-900">{formatMoney(fare.totalPrice)}</p>
                        <p className="text-xs text-slate-500">
                          {paxTotal > 1 ? "за всіх пасажирів" : "за одного пасажира"} · тариф «{fare.name}»
                        </p>
                      </div>
                      <Link href={`/flights/${offer.id}?${paxQuery}`} className="btn btn-primary shrink-0">
                        Обрати
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
