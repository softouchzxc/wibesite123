import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SALES_CLOSE_HOURS, type CabinClass } from "@/lib/constants";
import { localDateKey } from "@/lib/datetime";
import { fareTotal, passengerPrice, seatsNeeded, type PassengerCounts } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import type { FareOption, FlightOffer, FlightProvider, FlightSearchQuery } from "./types";

const flightInclude = { airline: true, origin: true, destination: true } satisfies Prisma.FlightInclude;
type FlightRow = Prisma.FlightGetPayload<{ include: typeof flightInclude }>;

const DAY_MS = 24 * 60 * 60 * 1000;

function salesCutoff() {
  return new Date(Date.now() + SALES_CLOSE_HOURS * 60 * 60 * 1000);
}

/** Рейси з власної бази даних, якими керує адміністратор. */
export class LocalFlightProvider implements FlightProvider {
  readonly name = "local";

  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    // Дата запиту — місцева для аеропорту вильоту, тому беремо вікно із запасом
    // на різницю часових поясів і відсікаємо зайве за місцевою датою.
    const dayStart = new Date(`${query.date}T00:00:00Z`).getTime();
    const flights = await db.flight.findMany({
      where: {
        status: "SCHEDULED",
        origin: { code: query.origin, isActive: true },
        destination: { code: query.destination, isActive: true },
        airline: { isActive: true },
        departureAt: { gte: new Date(dayStart - DAY_MS), lt: new Date(dayStart + 2 * DAY_MS) },
      },
      include: flightInclude,
      orderBy: { departureAt: "asc" },
    });

    const cutoff = salesCutoff();
    const fares = await this.loadTariffs(query.cabinClass);
    const offers: FlightOffer[] = [];
    for (const flight of flights) {
      if (flight.departureAt < cutoff) continue;
      if (localDateKey(flight.departureAt, flight.origin.timezone) !== query.date) continue;
      const offer = await this.toOffer(flight, query.cabinClass, query, fares);
      if (offer) offers.push(offer);
    }
    return offers;
  }

  async getOffer(flightId: string, cabinClass: CabinClass, pax: PassengerCounts): Promise<FlightOffer | null> {
    const flight = await db.flight.findUnique({ where: { id: flightId }, include: flightInclude });
    if (!flight || flight.status !== "SCHEDULED" || !flight.airline.isActive) return null;
    if (flight.departureAt < salesCutoff()) return null;
    return this.toOffer(flight, cabinClass, pax, await this.loadTariffs(cabinClass));
  }

  private loadTariffs(cabinClass: CabinClass) {
    return db.tariff.findMany({
      where: { cabinClass, isActive: true },
      orderBy: [{ priceMultiplier: "asc" }, { sortOrder: "asc" }],
    });
  }

  private async toOffer(
    flight: FlightRow,
    cabinClass: CabinClass,
    pax: PassengerCounts,
    tariffs: Awaited<ReturnType<LocalFlightProvider["loadTariffs"]>>,
  ): Promise<FlightOffer | null> {
    const seatsLeft = cabinClass === "BUSINESS" ? flight.seatsBusiness : flight.seatsEconomy;
    if (seatsLeft < seatsNeeded(pax) || tariffs.length === 0) return null;

    const rules = await getSettings();
    const fares: FareOption[] = tariffs.map((t) => ({
      tariffId: t.id,
      code: t.code,
      name: t.name,
      cabinClass,
      description: t.description,
      priceMultiplier: t.priceMultiplier,
      adultPrice: passengerPrice(flight.basePrice, t.priceMultiplier, "ADULT", rules),
      totalPrice: fareTotal(flight.basePrice, t.priceMultiplier, pax, rules),
      carryOnKg: t.carryOnKg,
      checkedBaggageKg: t.checkedBaggageKg,
      isRefundable: t.isRefundable,
      refundFeePercent: t.refundFeePercent,
      isChangeable: t.isChangeable,
      seatSelection: t.seatSelection,
    }));

    const airport = (a: FlightRow["origin"]) => ({
      code: a.code,
      name: a.name,
      city: a.city,
      country: a.country,
      timezone: a.timezone,
    });

    return {
      id: flight.id,
      flightNumber: flight.flightNumber,
      airline: { code: flight.airline.code, name: flight.airline.name },
      origin: airport(flight.origin),
      destination: airport(flight.destination),
      departureAt: flight.departureAt.toISOString(),
      arrivalAt: flight.arrivalAt.toISOString(),
      durationMinutes: flight.durationMinutes,
      stops: flight.stops,
      stopCity: flight.stopCity,
      aircraft: flight.aircraft,
      basePrice: flight.basePrice,
      seatsLeft,
      fares,
    };
  }
}
