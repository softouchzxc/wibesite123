"use client";

import { useId, useMemo, useRef, useState } from "react";

export type AirportOption = { code: string; name: string; city: string; country: string };

const labelOf = (a: AirportOption) => `${a.city} (${a.code})`;

/** Поле вибору міста або аеропорту з підказками. У форму передається IATA-код. */
export function AirportCombobox({
  name,
  label,
  placeholder,
  airports,
  value,
  onChange,
  icon,
}: {
  name: string;
  label: string;
  placeholder: string;
  airports: AirportOption[];
  value: string;
  onChange: (code: string) => void;
  icon?: React.ReactNode;
}) {
  const id = useId();
  const selected = airports.find((a) => a.code === value);
  const [query, setQuery] = useState<string | null>(null); // null — користувач не редагує поле
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = query !== null;

  const matches = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return airports;
    return airports.filter((a) =>
      [a.city, a.name, a.code, a.country].some((part) => part.toLowerCase().includes(q)),
    );
  }, [airports, query]);

  function choose(airport: AirportOption) {
    onChange(airport.code);
    setQuery(null);
    inputRef.current?.blur();
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          className={`input ${icon ? "pl-10" : ""}`}
          placeholder={placeholder}
          value={query ?? (selected ? labelOf(selected) : "")}
          onFocus={(e) => {
            setQuery("");
            setActive(0);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onBlur={() => setQuery(null)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && matches[active]) {
              e.preventDefault();
              choose(matches[active]);
            } else if (e.key === "Escape") {
              setQuery(null);
              inputRef.current?.blur();
            }
          }}
        />
      </div>
      <input type="hidden" name={name} value={value} />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full min-w-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {matches.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Нічого не знайдено</li>}
          {matches.map((a, i) => (
            <li
              key={a.code}
              role="option"
              aria-selected={a.code === value}
              // mousedown спрацьовує раніше за blur поля, тому вибір не губиться
              onMouseDown={(e) => {
                e.preventDefault();
                choose(a);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                i === active ? "bg-brand-50" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900">{a.city}</span>
                <span className="block truncate text-xs text-slate-500">
                  {a.name}, {a.country}
                </span>
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{a.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
