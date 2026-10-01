import { Plane } from "lucide-react";
import { formatDateShort, formatDuration, formatTime, localDateKey } from "@/lib/datetime";
import { stopsLabel } from "@/lib/format";

export type RouteInfo = {
  origin: { code: string; city: string; timezone: string };
  destination: { code: string; city: string; timezone: string };
  departureAt: string | Date;
  arrivalAt: string | Date;
  durationMinutes: number;
  stops: number;
  stopCity: string | null;
};

/** Маршрут рейсу: час і місто вильоту, тривалість і пересадки, час і місто прибуття. */
export function FlightRoute({ flight, showDates = false }: { flight: RouteInfo; showDates?: boolean }) {
  const { origin, destination } = flight;
  // Прибуття наступного дня за місцевим часом позначаємо окремо.
  const dayShift =
    localDateKey(flight.arrivalAt, destination.timezone) !== localDateKey(flight.departureAt, origin.timezone);

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <div className="min-w-0">
        <p className="text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl">
          {formatTime(flight.departureAt, origin.timezone)}
        </p>
        <p className="truncate text-sm text-slate-600">
          {origin.city} <span className="font-semibold text-slate-400">{origin.code}</span>
        </p>
        {showDates && <p className="text-xs text-slate-500">{formatDateShort(flight.departureAt, origin.timezone)}</p>}
      </div>

      <div className="flex min-w-20 flex-1 flex-col items-center text-center">
        <p className="text-xs text-slate-500">{formatDuration(flight.durationMinutes)}</p>
        <div className="my-1 flex w-full items-center gap-1 text-slate-300">
          <span className="h-px flex-1 bg-slate-300" />
          <Plane className="size-4 rotate-45 text-brand-500" aria-hidden />
          <span className="h-px flex-1 bg-slate-300" />
        </div>
        <p className={`text-xs font-semibold ${flight.stops === 0 ? "text-emerald-600" : "text-amber-700"}`}>
          {stopsLabel(flight.stops)}
          {flight.stops > 0 && flight.stopCity ? ` · ${flight.stopCity}` : ""}
        </p>
      </div>

      <div className="min-w-0 text-right">
        <p className="text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl">
          {formatTime(flight.arrivalAt, destination.timezone)}
          {dayShift && !showDates && <sup className="ml-0.5 text-xs font-bold text-amber-700">+1</sup>}
        </p>
        <p className="truncate text-sm text-slate-600">
          {destination.city} <span className="font-semibold text-slate-400">{destination.code}</span>
        </p>
        {showDates && (
          <p className="text-xs text-slate-500">{formatDateShort(flight.arrivalAt, destination.timezone)}</p>
        )}
      </div>
    </div>
  );
}
