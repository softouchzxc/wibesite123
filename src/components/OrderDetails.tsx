import { FlightRoute } from "@/components/site/FlightRoute";
import { DetailRow, StatusBadge } from "@/components/ui";
import {
  BOOKING_STATUS_LABELS,
  CABIN_LABELS,
  PASSENGER_TYPE_LABELS,
  type CabinClass,
  type PassengerType,
} from "@/lib/constants";
import { formatDate, formatPlainDate } from "@/lib/datetime";
import { baggageLabel, formatMoney } from "@/lib/format";
import type { OrderWithDetails } from "@/lib/orders";

/** Рейси замовлення з пасажирами. Номери квитків з'являються після оплати. */
export function OrderBookings({ order, showDocuments = false }: { order: OrderWithDetails; showDocuments?: boolean }) {
  return (
    <div className="space-y-4">
      {order.bookings.map((booking) => {
        const { flight } = booking;
        return (
          <section key={booking.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {flight.airline.name} · {flight.flightNumber}
                </p>
                <p className="text-xs text-slate-500">{formatDate(flight.departureAt, flight.origin.timezone)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Код бронювання{" "}
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-bold tracking-widest text-slate-900">
                    {booking.pnr}
                  </span>
                </span>
                <StatusBadge status={booking.status} labels={BOOKING_STATUS_LABELS} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <FlightRoute flight={flight} showDates />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Тариф «{booking.tariffName}» · {CABIN_LABELS[booking.cabinClass as CabinClass]} · ручна поклажа{" "}
              {booking.carryOnKg} кг · {baggageLabel(booking.checkedBaggageKg).toLowerCase()} ·{" "}
              {booking.isRefundable
                ? `повернення з утриманням ${booking.refundFeePercent}%`
                : "без повернення"}
            </p>

            <h3 className="mt-5 text-sm font-bold text-slate-900">Пасажири</h3>
            <ul className="mt-2 divide-y divide-slate-100">
              {booking.passengers.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {p.lastName} {p.firstName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {PASSENGER_TYPE_LABELS[p.type as PassengerType].split(" ")[0]} · {formatPlainDate(p.birthDate)}
                      {showDocuments && ` · ${p.citizenship} · паспорт ${p.documentNumber}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {p.ticketNumber && <p className="font-mono text-xs text-slate-600">Квиток {p.ticketNumber}</p>}
                    <p className="font-semibold text-slate-900">{formatMoney(p.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Розрахунок вартості замовлення. */
export function OrderTotals({ order }: { order: OrderWithDetails }) {
  return (
    <dl>
      <DetailRow label="Переліт">{formatMoney(order.fareTotal)}</DetailRow>
      {order.extras.map((extra) => (
        <DetailRow key={extra.id} label={`${extra.name}${extra.quantity > 1 ? ` × ${extra.quantity}` : ""}`}>
          {formatMoney(extra.total)}
        </DetailRow>
      ))}
      <DetailRow label="Сервісний збір">{formatMoney(order.serviceFee)}</DetailRow>
      {order.discount > 0 && (
        <DetailRow label={`Промокод${order.promoCode ? ` ${order.promoCode.code}` : ""}`}>
          −{formatMoney(order.discount)}
        </DetailRow>
      )}
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3">
        <dt className="text-base font-extrabold text-slate-900">Разом</dt>
        <dd className="text-xl font-extrabold text-slate-900">{formatMoney(order.total)}</dd>
      </div>
    </dl>
  );
}
