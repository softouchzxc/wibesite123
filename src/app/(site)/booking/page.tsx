import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingForm } from "@/components/site/BookingForm";
import { FlightRoute } from "@/components/site/FlightRoute";
import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { CABIN_LABELS } from "@/lib/constants";
import { formatDate, localDateKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { baggageLabel } from "@/lib/format";
import { getFlightProvider } from "@/lib/providers/flights";
import { parsePassengers, passengerQuery } from "@/lib/search-params";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Дані пасажирів" };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flightId = typeof params.flight === "string" ? params.flight : "";
  const tariffId = typeof params.tariff === "string" ? params.tariff : "";
  const pax = parsePassengers(params);
  const query = `flight=${encodeURIComponent(flightId)}&tariff=${encodeURIComponent(tariffId)}&${passengerQuery(pax)}`;
  const user = await requireUser(`/booking?${query}`);

  const offer = flightId ? await getFlightProvider().getOffer(flightId, pax.cabinClass, pax) : null;
  const fare = offer?.fares.find((f) => f.tariffId === tariffId);

  if (!offer || !fare) {
    return (
      <div className="container-page py-10">
        <EmptyState title="Рейс або тариф недоступні">
          <p>Можливо, місця закінчилися або продаж уже закрито. Спробуйте знайти інший рейс.</p>
          <Link href="/" className="btn btn-primary mt-4">
            Новий пошук
          </Link>
        </EmptyState>
      </div>
    );
  }

  const [extras, settings] = await Promise.all([
    db.extraService.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true, price: true, perPassenger: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);

  return (
    <div className="container-page space-y-6 py-8">
      <Link
        href={`/flights/${offer.id}?${passengerQuery(pax)}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        До вибору тарифу
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900">Дані пасажирів</h1>

      <BookingForm
        flightId={offer.id}
        tariffId={fare.tariffId}
        cabinClass={pax.cabinClass}
        pax={{ adults: pax.adults, children: pax.children, infants: pax.infants }}
        basePrice={offer.basePrice}
        priceMultiplier={fare.priceMultiplier}
        rules={{
          serviceFeePercent: settings.serviceFeePercent,
          serviceFeeFixed: settings.serviceFeeFixed,
          childDiscountPercent: settings.childDiscountPercent,
          infantDiscountPercent: settings.infantDiscountPercent,
        }}
        extras={extras}
        contact={{ email: user.email, phone: user.phone ?? "" }}
        departureDate={localDateKey(offer.departureAt, offer.origin.timezone)}
        summaryHeader={
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {offer.airline.name} · {offer.flightNumber}
            </p>
            <p className="mb-3 text-xs text-slate-500">{formatDate(offer.departureAt, offer.origin.timezone)}</p>
            <FlightRoute flight={offer} />
            <p className="mt-3 text-xs text-slate-600">
              Тариф «{fare.name}» · {CABIN_LABELS[pax.cabinClass]} · {baggageLabel(fare.checkedBaggageKg)}
            </p>
          </div>
        }
      />
    </div>
  );
}
