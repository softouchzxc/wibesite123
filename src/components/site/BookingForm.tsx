"use client";

import { useState, useTransition } from "react";
import { Loader2, Tag } from "lucide-react";
import { checkPromo, submitBooking, type PromoCheck } from "@/app/actions/booking";
import { ActionForm } from "@/components/form";
import { PASSENGER_TYPE_LABELS, type CabinClass, type PassengerType } from "@/lib/constants";
import { countLabel, formatMoney } from "@/lib/format";
import { orderTotals, passengerPrice, type PassengerCounts, type PricingRules } from "@/lib/pricing";

type Extra = { id: string; name: string; description: string | null; price: number; perPassenger: boolean };

const COUNTRIES = [
  "Україна",
  "Польща",
  "Німеччина",
  "Чехія",
  "Австрія",
  "Франція",
  "Італія",
  "Іспанія",
  "Нідерланди",
  "Велика Британія",
  "Туреччина",
  "США",
  "Інша країна",
];

type AppliedPromo = Extract<PromoCheck, { ok: true }>;

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-base font-extrabold" : "text-sm"}`}>
      <dt className={strong ? "text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className="whitespace-nowrap font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function BookingForm({
  flightId,
  tariffId,
  cabinClass,
  pax,
  basePrice,
  priceMultiplier,
  rules,
  extras,
  contact,
  departureDate,
  summaryHeader,
}: {
  flightId: string;
  tariffId: string;
  cabinClass: CabinClass;
  pax: PassengerCounts;
  basePrice: number;
  priceMultiplier: number;
  rules: PricingRules;
  extras: Extra[];
  contact: { email: string; phone: string };
  /** Дата вильоту, YYYY-MM-DD — межа для дат народження та документів. */
  departureDate: string;
  summaryHeader: React.ReactNode;
}) {
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, startPromoCheck] = useTransition();

  const types: PassengerType[] = [
    ...Array<PassengerType>(pax.adults).fill("ADULT"),
    ...Array<PassengerType>(pax.children).fill("CHILD"),
    ...Array<PassengerType>(pax.infants).fill("INFANT"),
  ];
  const seated = pax.adults + pax.children;

  const fareLines = (["ADULT", "CHILD", "INFANT"] as const)
    .map((type) => {
      const count = type === "ADULT" ? pax.adults : type === "CHILD" ? pax.children : pax.infants;
      return { type, count, price: passengerPrice(basePrice, priceMultiplier, type, rules) };
    })
    .filter((line) => line.count > 0);
  const fare = fareLines.reduce((sum, line) => sum + line.count * line.price, 0);
  const extrasTotal = extras
    .filter((e) => selectedExtras.has(e.id))
    .reduce((sum, e) => sum + e.price * (e.perPassenger ? seated : 1), 0);
  const totals = orderTotals(fare, extrasTotal, rules, promo);
  const promoBelowMinimum = promo !== null && totals.discount === 0;

  function applyPromo() {
    setPromoError(null);
    startPromoCheck(async () => {
      const result = await checkPromo(promoInput);
      if (result.ok) {
        setPromo(result);
      } else {
        setPromo(null);
        setPromoError(result.error);
      }
    });
  }

  return (
    <ActionForm
      action={submitBooking}
      submitLabel="Перейти до оплати"
      submitClassName="btn btn-accent w-full text-base lg:hidden"
      className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start"
    >
      <input type="hidden" name="flightId" value={flightId} />
      <input type="hidden" name="tariffId" value={tariffId} />
      <input type="hidden" name="cabin" value={cabinClass} />
      <input type="hidden" name="adults" value={pax.adults} />
      <input type="hidden" name="children" value={pax.children} />
      <input type="hidden" name="infants" value={pax.infants} />
      {promo && !promoBelowMinimum && <input type="hidden" name="promoCode" value={promo.code} />}

      <div className="space-y-6 lg:col-start-1">
        {types.map((type, i) => (
          <fieldset key={i} className="card p-5 sm:p-6">
            <legend className="float-left mb-4 w-full text-lg font-extrabold text-slate-900">
              Пасажир {i + 1}
              <span className="ml-2 text-sm font-medium text-slate-500">{PASSENGER_TYPE_LABELS[type]}</span>
            </legend>
            <div className="clear-both grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`p${i}_lastName`}>
                  Прізвище (латиницею)
                </label>
                <input
                  id={`p${i}_lastName`}
                  name={`p${i}_lastName`}
                  className="input uppercase"
                  placeholder="SHEVCHENKO"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_firstName`}>
                  Ім&apos;я (латиницею)
                </label>
                <input
                  id={`p${i}_firstName`}
                  name={`p${i}_firstName`}
                  className="input uppercase"
                  placeholder="TARAS"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_birthDate`}>
                  Дата народження
                </label>
                <input
                  id={`p${i}_birthDate`}
                  name={`p${i}_birthDate`}
                  type="date"
                  className="input"
                  max={departureDate}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_gender`}>
                  Стать
                </label>
                <select id={`p${i}_gender`} name={`p${i}_gender`} className="input" defaultValue="" required>
                  <option value="" disabled>
                    Оберіть
                  </option>
                  <option value="M">Чоловіча</option>
                  <option value="F">Жіноча</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_citizenship`}>
                  Громадянство
                </label>
                <select id={`p${i}_citizenship`} name={`p${i}_citizenship`} className="input" defaultValue="Україна">
                  {COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_documentNumber`}>
                  Номер паспорта
                </label>
                <input
                  id={`p${i}_documentNumber`}
                  name={`p${i}_documentNumber`}
                  className="input uppercase"
                  placeholder="FA123456"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor={`p${i}_documentExpiry`}>
                  Термін дії паспорта <span className="font-normal text-slate-400">(якщо є)</span>
                </label>
                <input
                  id={`p${i}_documentExpiry`}
                  name={`p${i}_documentExpiry`}
                  type="date"
                  className="input"
                  min={departureDate}
                />
              </div>
            </div>
          </fieldset>
        ))}

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Контактні дані</h2>
          <p className="mt-1 text-sm text-slate-500">На ці контакти надійде підтвердження та повідомлення про рейс.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="contactEmail">
                Електронна пошта
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                className="input"
                defaultValue={contact.email}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="contactPhone">
                Телефон
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                className="input"
                defaultValue={contact.phone}
                placeholder="+380 XX XXX XX XX"
                autoComplete="tel"
                required
              />
            </div>
          </div>
        </section>

        {extras.length > 0 && (
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Додаткові послуги</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {extras.map((extra) => {
                const checked = selectedExtras.has(extra.id);
                return (
                  <label
                    key={extra.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                      checked ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="extras"
                      value={extra.id}
                      className="mt-0.5 size-4 shrink-0 accent-brand-600"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(selectedExtras);
                        if (!next.delete(extra.id)) next.add(extra.id);
                        setSelectedExtras(next);
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{extra.name}</span>
                      {extra.description && <span className="block text-xs text-slate-500">{extra.description}</span>}
                      <span className="mt-1 block text-sm font-semibold text-brand-700">
                        {formatMoney(extra.price)}
                        <span className="font-normal text-slate-500">
                          {extra.perPassenger ? " за пасажира" : " за замовлення"}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 shrink-0 accent-brand-600" required />
          <span>Я підтверджую правильність даних пасажирів і погоджуюся з умовами тарифу та правилами бронювання.</span>
        </label>
      </div>

      <aside className="card p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:row-end-4">
        {summaryHeader}
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {fareLines.map((line) => (
            <SummaryRow
              key={line.type}
              label={`${PASSENGER_TYPE_LABELS[line.type].split(" ")[0]} × ${line.count}`}
              value={formatMoney(line.count * line.price)}
            />
          ))}
          {extrasTotal > 0 && <SummaryRow label="Додаткові послуги" value={formatMoney(extrasTotal)} />}
          <SummaryRow label="Сервісний збір" value={formatMoney(totals.serviceFee)} />
          {totals.discount > 0 && <SummaryRow label={`Промокод ${promo!.code}`} value={`−${formatMoney(totals.discount)}`} />}
        </dl>
        <dl className="mt-4 border-t border-slate-200 pt-4">
          <SummaryRow strong label="До сплати" value={formatMoney(totals.total)} />
        </dl>
        <p className="mt-1 text-xs text-slate-500">
          {countLabel(types.length, ["пасажир", "пасажири", "пасажирів"])}, усі збори включено
        </p>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <label className="label" htmlFor="promoInput">
            Промокод
          </label>
          <div className="flex gap-2">
            <input
              id="promoInput"
              className="input uppercase"
              value={promoInput}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter у цьому полі застосовує промокод, а не надсилає всю форму.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (promoInput.trim()) applyPromo();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary shrink-0"
              disabled={promoPending || !promoInput.trim()}
              onClick={applyPromo}
            >
              {promoPending ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
              Застосувати
            </button>
          </div>
          {promoError && <p className="mt-2 text-xs font-medium text-red-600">{promoError}</p>}
          {promo && !promoBelowMinimum && (
            <p className="mt-2 text-xs font-medium text-emerald-700">Промокод {promo.code} застосовано.</p>
          )}
          {promoBelowMinimum && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Промокод діє для замовлень від {formatMoney(promo.minOrderAmount)}.
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-accent mt-5 hidden w-full text-base lg:inline-flex">
          Перейти до оплати
        </button>
      </aside>
    </ActionForm>
  );
}
