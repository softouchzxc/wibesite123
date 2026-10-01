import type { Metadata } from "next";
import Link from "next/link";
import { Armchair, ArrowLeft, Check, Luggage, RefreshCcw, Undo2, X } from "lucide-react";
import { FlightRoute } from "@/components/site/FlightRoute";
import { EmptyState } from "@/components/ui";
import { CABIN_CLASSES, CABIN_LABELS } from "@/lib/constants";
import { formatDate, localDateKey } from "@/lib/datetime";
import { PASSENGER_FORMS, countLabel, formatMoney } from "@/lib/format";
import { getFlightProvider, type FareOption } from "@/lib/providers/flights";
import { parsePassengers, passengerQuery } from "@/lib/search-params";

export const metadata: Metadata = { title: "Інформація про рейс" };

function Feature({ ok, Icon, children }: { ok: boolean; Icon: typeof Check; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${ok ? "text-slate-700" : "text-slate-400"}`}>
      {ok ? (
        <Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <X className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <span>{children}</span>
    </li>
  );
}

function FareFeatures({ fare }: { fare: FareOption }) {
  return (
    <ul className="space-y-2">
      <Feature ok Icon={Luggage}>
        Ручна поклажа до {fare.carryOnKg} кг
      </Feature>
      <Feature ok={fare.checkedBaggageKg > 0} Icon={Luggage}>
        {fare.checkedBaggageKg > 0 ? `Зареєстрований багаж ${fare.checkedBaggageKg} кг` : "Без зареєстрованого багажу"}
      </Feature>
      <Feature ok={fare.seatSelection} Icon={Armchair}>
        {fare.seatSelection ? "Вибір місця включено" : "Вибір місця за доплату"}
      </Feature>
      <Feature ok={fare.isChangeable} Icon={RefreshCcw}>
        {fare.isChangeable ? "Обмін дозволено" : "Обмін не передбачено"}
      </Feature>
      <Feature ok={fare.isRefundable} Icon={Undo2}>
        {fare.isRefundable
          ? fare.refundFeePercent > 0
            ? `Повернення з утриманням ${fare.refundFeePercent}%`
            : "Повернення без утримань"
          : "Повернення не передбачено"}
      </Feature>
    </ul>
  );
}

export default async function FlightPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const pax = parsePassengers(await searchParams);
  const offer = await getFlightProvider().getOffer(id, pax.cabinClass, pax);
  const paxTotal = pax.adults + pax.children + pax.infants;

  if (!offer) {
    // Можливо, місць немає лише в обраному класі — пропонуємо інший.
    const otherClass = CABIN_CLASSES.find((c) => c !== pax.cabinClass)!;
    const alternative = await getFlightProvider().getOffer(id, otherClass, pax);
    return (
      <div className="container-page py-10">
        <EmptyState title="Рейс недоступний для бронювання">
          <p>Продаж на цей рейс закрито або в обраному класі не залишилося місць.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {alternative && (
              <Link
                href={`/flights/${id}?${passengerQuery({ ...pax, cabinClass: otherClass })}`}
                className="btn btn-primary"
              >
                Переглянути клас «{CABIN_LABELS[otherClass]}»
              </Link>
            )}
            <Link href="/" className="btn btn-secondary">
              Новий пошук
            </Link>
          </div>
        </EmptyState>
      </div>
    );
  }

  const date = localDateKey(offer.departureAt, offer.origin.timezone);
  const backHref = `/search?from=${offer.origin.code}&to=${offer.destination.code}&date=${date}&${passengerQuery(pax)}`;

  return (
    <div className="container-page space-y-6 py-8">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        До результатів пошуку
      </Link>

      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {offer.origin.city} → {offer.destination.city}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(offer.departureAt, offer.origin.timezone)} · {countLabel(paxTotal, PASSENGER_FORMS)}
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-semibold">
            {CABIN_CLASSES.map((c) => (
              <Link
                key={c}
                href={`/flights/${offer.id}?${passengerQuery({ ...pax, cabinClass: c })}`}
                className={`rounded-lg px-3 py-1.5 ${
                  c === pax.cabinClass ? "bg-white text-brand-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {CABIN_LABELS[c]}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 sm:p-6">
          <FlightRoute flight={offer} showDates />
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Авіакомпанія</dt>
            <dd className="font-semibold text-slate-900">{offer.airline.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Рейс</dt>
            <dd className="font-semibold text-slate-900">
              {offer.flightNumber}
              {offer.aircraft ? ` · ${offer.aircraft}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Виліт</dt>
            <dd className="font-semibold text-slate-900">
              {offer.origin.name} ({offer.origin.code})
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Прибуття</dt>
            <dd className="font-semibold text-slate-900">
              {offer.destination.name} ({offer.destination.code})
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">Час вильоту та прибуття вказано місцевий для кожного аеропорту.</p>
      </section>

      <section>
        <h2 className="text-xl font-extrabold text-slate-900">Оберіть тариф</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offer.fares.map((fare, i) => (
            <article
              key={fare.tariffId}
              className={`card flex flex-col p-5 ${i === 1 ? "border-brand-300 ring-1 ring-brand-200" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{fare.name}</h3>
                {i === 1 && (
                  <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white">Оптимальний</span>
                )}
              </div>
              {fare.description && <p className="mt-1 text-sm text-slate-500">{fare.description}</p>}
              <div className="my-5 flex-1">
                <FareFeatures fare={fare} />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{formatMoney(fare.totalPrice)}</p>
              <p className="text-xs text-slate-500">
                {paxTotal > 1
                  ? `за всіх пасажирів · ${formatMoney(fare.adultPrice)} за дорослого`
                  : "за одного пасажира"}
              </p>
              <Link
                href={`/booking?flight=${offer.id}&tariff=${fare.tariffId}&${passengerQuery(pax)}`}
                className={`btn mt-4 ${i === 1 ? "btn-primary" : "btn-secondary"}`}
              >
                Обрати тариф
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          До вартості перельоту додається сервісний збір. Остаточну суму буде показано перед оплатою.
        </p>
      </section>
    </div>
  );
}
