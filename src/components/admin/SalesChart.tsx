"use client";

import { useState } from "react";
import { countLabel, formatMoney } from "@/lib/format";

export type SalesPoint = { key: string; label: string; revenue: number; orders: number };

const ORDER_FORMS: [string, string, string] = ["замовлення", "замовлення", "замовлень"];

/** Стовпчикова діаграма продажів за днями: одна серія, одна вісь, підказка при наведенні. */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const point = active === null ? null : data[active];

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-slate-500">
        <span>макс. {formatMoney(max)}</span>
        <span className="h-4 font-medium text-slate-900" aria-live="polite">
          {point && `${point.label}: ${formatMoney(point.revenue)} · ${countLabel(point.orders, ORDER_FORMS)}`}
        </span>
      </div>

      <div
        className="mt-2 flex h-44 items-end gap-0.5 border-b border-slate-300"
        role="img"
        aria-label="Продажі за днями. Точні значення — у таблиці нижче."
        onMouseLeave={() => setActive(null)}
      >
        {data.map((d, i) => (
          // Зона наведення — на всю висоту графіка, щоб влучити було легко навіть у низький стовпчик.
          <div
            key={d.key}
            className="group flex h-full min-w-0 flex-1 cursor-default items-end"
            onMouseEnter={() => setActive(i)}
          >
            <div
              className={`w-full rounded-t ${active === i ? "bg-brand-800" : "bg-brand-600"}`}
              style={{ height: d.revenue > 0 ? `max(${(d.revenue / max) * 100}%, 3px)` : "0" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">Показати таблицею</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-1.5 pr-3 font-medium">Дата</th>
              <th className="py-1.5 pr-3 font-medium">Замовлень</th>
              <th className="py-1.5 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-b border-slate-100">
                <td className="py-1.5 pr-3">{d.label}</td>
                <td className="py-1.5 pr-3 tabular-nums">{d.orders}</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoney(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
