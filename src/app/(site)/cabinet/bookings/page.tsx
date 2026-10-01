import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateShort, formatTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { PASSENGER_FORMS, countLabel, formatMoney } from "@/lib/format";
import { expireStaleOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Мої бронювання" };

export default async function MyBookingsPage() {
  const user = await requireUser("/cabinet/bookings");
  await expireStaleOrders();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: {
      bookings: { include: { flight: { include: { origin: true, destination: true } }, _count: { select: { passengers: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <EmptyState title="У вас ще немає бронювань">
        <p>Знайдіть рейс і оформіть перше бронювання — воно з&apos;явиться тут.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Знайти квитки
        </Link>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const booking = order.bookings[0];
        const flight = booking?.flight;
        return (
          <li key={order.id}>
            <Link
              href={`/cabinet/bookings/${order.id}`}
              className="card flex items-center gap-4 p-4 transition hover:border-brand-300 hover:shadow-md sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-base font-extrabold text-slate-900">
                    {flight ? `${flight.origin.city} → ${flight.destination.city}` : "Замовлення"}
                  </p>
                  <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />
                </div>
                {flight && (
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateShort(flight.departureAt, flight.origin.timezone)},{" "}
                    {formatTime(flight.departureAt, flight.origin.timezone)} · {flight.flightNumber} ·{" "}
                    {countLabel(booking._count.passengers, PASSENGER_FORMS)}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">Замовлення {order.number}</p>
              </div>
              <p className="shrink-0 text-base font-extrabold text-slate-900">{formatMoney(order.total)}</p>
              <ChevronRight className="size-5 shrink-0 text-slate-300" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
