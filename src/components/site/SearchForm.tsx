"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ChevronDown, Minus, PlaneLanding, PlaneTakeoff, Plus, Search } from "lucide-react";
import { CABIN_CLASSES, CABIN_LABELS, MAX_PASSENGERS, type CabinClass } from "@/lib/constants";
import { PASSENGER_FORMS, countLabel } from "@/lib/format";
import { AirportCombobox, type AirportOption } from "./AirportCombobox";

export type SearchFormValues = {
  origin: string;
  destination: string;
  date: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
};

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          disabled={value <= min}
          aria-label={`Менше: ${label}`}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          disabled={value >= max}
          aria-label={`Більше: ${label}`}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SearchForm({
  airports,
  initial,
  minDate,
  compact = false,
}: {
  airports: AirportOption[];
  initial: SearchFormValues;
  minDate: string;
  compact?: boolean;
}) {
  const [origin, setOrigin] = useState(initial.origin);
  const [destination, setDestination] = useState(initial.destination);
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [infants, setInfants] = useState(initial.infants);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initial.cabinClass);
  const [paxOpen, setPaxOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paxOpen) return;
    const close = (event: MouseEvent) => {
      if (!paxRef.current?.contains(event.target as Node)) setPaxOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [paxOpen]);

  const total = adults + children + infants;

  return (
    <form
      action="/search"
      method="get"
      className={compact ? "" : "card p-4 shadow-xl sm:p-6"}
      onSubmit={(event) => {
        const message = !origin
          ? "Оберіть місто або аеропорт вильоту."
          : !destination
            ? "Оберіть місто або аеропорт прибуття."
            : origin === destination
              ? "Місто вильоту та прибуття мають відрізнятися."
              : null;
        setError(message);
        if (message) event.preventDefault();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end lg:grid-cols-[1fr_auto_1fr_minmax(0,11rem)_minmax(0,14rem)_auto]">
        <AirportCombobox
          name="from"
          label="Звідки"
          placeholder="Місто або аеропорт"
          airports={airports}
          value={origin}
          onChange={setOrigin}
          icon={<PlaneTakeoff className="size-4" />}
        />

        <button
          type="button"
          className="btn btn-secondary mx-auto size-10 rounded-full p-0 sm:mb-0.5"
          aria-label="Поміняти місцями"
          title="Поміняти місцями"
          onClick={() => {
            setOrigin(destination);
            setDestination(origin);
          }}
        >
          <ArrowLeftRight className="size-4 rotate-90 sm:rotate-0" />
        </button>

        <AirportCombobox
          name="to"
          label="Куди"
          placeholder="Місто або аеропорт"
          airports={airports}
          value={destination}
          onChange={setDestination}
          icon={<PlaneLanding className="size-4" />}
        />

        <div>
          <label htmlFor="search-date" className="label">
            Дата вильоту
          </label>
          <input
            id="search-date"
            type="date"
            name="date"
            className="input"
            required
            min={minDate}
            defaultValue={initial.date}
          />
        </div>

        <div className="relative sm:col-span-2 lg:col-span-1" ref={paxRef}>
          <span className="label">Пасажири та клас</span>
          <button
            type="button"
            className="input flex items-center justify-between gap-2 text-left"
            aria-expanded={paxOpen}
            onClick={() => setPaxOpen((v) => !v)}
          >
            <span className="truncate">
              {countLabel(total, PASSENGER_FORMS)}, {CABIN_LABELS[cabinClass].toLowerCase()}
            </span>
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          </button>
          {paxOpen && (
            <div className="absolute right-0 z-20 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <Counter
                label="Дорослі"
                hint="від 12 років"
                value={adults}
                min={Math.max(1, infants)}
                max={MAX_PASSENGERS - children - infants}
                onChange={setAdults}
              />
              <Counter
                label="Діти"
                hint="2–11 років"
                value={children}
                min={0}
                max={MAX_PASSENGERS - adults - infants}
                onChange={setChildren}
              />
              <Counter
                label="Немовлята"
                hint="до 2 років, без місця"
                value={infants}
                min={0}
                max={Math.min(adults, MAX_PASSENGERS - adults - children)}
                onChange={setInfants}
              />
              <div className="mt-2 border-t border-slate-100 pt-3">
                <p className="mb-2 text-sm font-semibold text-slate-900">Клас обслуговування</p>
                <div className="grid grid-cols-2 gap-2">
                  {CABIN_CLASSES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={cabinClass === c}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        cabinClass === c
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => setCabinClass(c)}
                    >
                      {CABIN_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-secondary mt-3 w-full" onClick={() => setPaxOpen(false)}>
                Готово
              </button>
            </div>
          )}
          <input type="hidden" name="adults" value={adults} />
          <input type="hidden" name="children" value={children} />
          <input type="hidden" name="infants" value={infants} />
          <input type="hidden" name="cabin" value={cabinClass} />
        </div>

        <button type="submit" className="btn btn-accent h-[42px] px-6 text-base sm:col-span-3 lg:col-span-1">
          <Search className="size-4" aria-hidden />
          Знайти
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
