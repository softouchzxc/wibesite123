// Контракт постачальника рейсів. Сайт працює лише з цими типами, тому щоб підключити
// реальний GDS або API консолідатора, достатньо написати ще одну реалізацію
// FlightProvider і зареєструвати її в ./index.ts.

import type { CabinClass } from "@/lib/constants";
import type { PassengerCounts } from "@/lib/pricing";

export type FlightSearchQuery = PassengerCounts & {
  origin: string; // IATA
  destination: string; // IATA
  date: string; // YYYY-MM-DD за місцевим часом аеропорту вильоту
  cabinClass: CabinClass;
};

export type AirportInfo = {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export type FareOption = {
  tariffId: string;
  code: string;
  name: string;
  cabinClass: CabinClass;
  description: string | null;
  priceMultiplier: number;
  /** Ціна за одного дорослого, копійки. */
  adultPrice: number;
  /** Вартість перельоту для всіх пасажирів запиту, копійки. */
  totalPrice: number;
  carryOnKg: number;
  checkedBaggageKg: number;
  isRefundable: boolean;
  refundFeePercent: number;
  isChangeable: boolean;
  seatSelection: boolean;
};

export type FlightOffer = {
  id: string;
  flightNumber: string;
  airline: { code: string; name: string };
  origin: AirportInfo;
  destination: AirportInfo;
  departureAt: string; // ISO, UTC
  arrivalAt: string; // ISO, UTC
  durationMinutes: number;
  stops: number;
  stopCity: string | null;
  aircraft: string | null;
  basePrice: number;
  /** Вільні місця в запитаному класі обслуговування. */
  seatsLeft: number;
  /** Тарифи запитаного класу, від найдешевшого. */
  fares: FareOption[];
};

export interface FlightProvider {
  readonly name: string;
  search(query: FlightSearchQuery): Promise<FlightOffer[]>;
  /** Актуальна пропозиція для одного рейсу; null, якщо рейс недоступний для продажу. */
  getOffer(flightId: string, cabinClass: CabinClass, pax: PassengerCounts): Promise<FlightOffer | null>;
}
