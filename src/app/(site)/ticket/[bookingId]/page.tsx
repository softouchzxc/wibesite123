import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plane } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { FlightRoute } from "@/components/site/FlightRoute";
import { Alert } from "@/components/ui";
import { isStaff, requireUser } from "@/lib/auth";
import { CABIN_LABELS, PASSENGER_TYPE_LABELS, type CabinClass, type PassengerType } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { baggageLabel } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Маршрутна квитанція" };

export default async function TicketPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireUser(`/ticket/${bookingId}`);
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      order: true,
      passengers: true,
      flight: { include: { airline: true, origin: true, destination: true } },
    },
  });
  // Квиток бачить лише власник замовлення або співробітник із доступом до бронювань.
  const allowed =
    booking && (booking.order.userId === user.id || (isStaff(user) && can(user.role, "bookings.view")));
  if (!booking || !allowed) notFound();

  const { flight, order } = booking;
  const settings = await getSettings();
  const confirmed = booking.status === "CONFIRMED";

  return (
    <div className="container-page max-w-3xl space-y-4 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href={booking.order.userId === user.id ? `/cabinet/bookings/${order.id}` : `/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          До замовлення
        </Link>
        {confirmed && <PrintButton>Друк / зберегти як PDF</PrintButton>}
      </div>

      {!confirmed && (
        <Alert tone="warning" className="no-print">
          {booking.status === "CANCELLED"
            ? "Це бронювання скасовано, квиток недійсний."
            : "Квиток буде доступний після оплати замовлення."}
        </Alert>
      )}

      <article className="card overflow-hidden print:border-slate-400 print:shadow-none">
        <header className="flex items-center justify-between gap-4 bg-brand-800 px-6 py-4 text-white print:bg-white print:text-slate-900">
          <p className="flex items-center gap-2 text-lg font-extrabold">
            <Plane className="size-5 -rotate-45" aria-hidden />
            {settings.siteName}
          </p>
          <p className="text-sm font-semibold">Маршрутна квитанція</p>
        </header>

        <div className="space-y-6 p-6">
          {settings.demoBanner && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-amber-900">
              Демонстраційний документ — недійсний для перельоту
            </p>
          )}

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Код бронювання</dt>
              <dd className="font-mono text-lg font-bold tracking-widest text-slate-900">{booking.pnr}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Замовлення</dt>
              <dd className="font-semibold text-slate-900">{order.number}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Рейс</dt>
              <dd className="font-semibold text-slate-900">{flight.flightNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Авіакомпанія</dt>
              <dd className="font-semibold text-slate-900">{flight.airline.name}</dd>
            </div>
          </dl>

          <div className="rounded-2xl bg-slate-50 p-5 print:border print:border-slate-300 print:bg-white">
            <FlightRoute flight={flight} showDates />
            <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:grid-cols-2">
              <p>
                Виліт: {flight.origin.name} ({flight.origin.code}), {formatDate(flight.departureAt, flight.origin.timezone)}
              </p>
              <p>
                Прибуття: {flight.destination.name} ({flight.destination.code}),{" "}
                {formatDate(flight.arrivalAt, flight.destination.timezone)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">Пасажири</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-medium">Пасажир</th>
                  <th className="py-2 pr-3 font-medium">Категорія</th>
                  <th className="py-2 font-medium">Номер квитка</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengers.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-semibold text-slate-900">
                      {p.lastName} {p.firstName}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {PASSENGER_TYPE_LABELS[p.type as PassengerType].split(" ")[0]}
                    </td>
                    <td className="py-2 font-mono text-slate-900">{p.ticketNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Тариф і клас</dt>
              <dd className="font-semibold text-slate-900">
                {booking.tariffName}, {CABIN_LABELS[booking.cabinClass as CabinClass].toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Багаж</dt>
              <dd className="font-semibold text-slate-900">
                Ручна поклажа {booking.carryOnKg} кг · {baggageLabel(booking.checkedBaggageKg).toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Обмін і повернення</dt>
              <dd className="font-semibold text-slate-900">
                {booking.isChangeable ? "Обмін дозволено" : "Без обміну"},{" "}
                {booking.isRefundable ? `повернення з утриманням ${booking.refundFeePercent}%` : "без повернення"}
              </dd>
            </div>
          </dl>

          <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
            {order.paidAt ? `Оплачено ${formatDateTime(order.paidAt)}. ` : ""}
            Час вильоту та прибуття місцевий. Прибудьте до аеропорту щонайменше за дві години до вильоту та майте
            при собі документ, указаний під час бронювання. Підтримка: {settings.supportEmail}, {settings.supportPhone}.
          </p>
        </div>
      </article>
    </div>
  );
}
