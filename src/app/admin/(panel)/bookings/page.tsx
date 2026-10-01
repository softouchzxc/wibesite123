import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, ListFilters, Pagination, TableCard, listParams } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { BOOKING_STATUS_LABELS, CABIN_LABELS, type CabinClass } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { expireStaleOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Бронювання" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("bookings.view");
  await expireStaleOrders();
  const { q, status, page, skip, take } = listParams(await searchParams);

  const where: Prisma.BookingWhereInput = {
    ...(status in BOOKING_STATUS_LABELS ? { status } : {}),
    ...(q
      ? {
          OR: [
            { pnr: { contains: q.toUpperCase() } },
            { flight: { flightNumber: { contains: q.toUpperCase() } } },
            { passengers: { some: { lastName: { contains: q.toUpperCase() } } } },
            { order: { number: { contains: q } } },
          ],
        }
      : {}),
  };
  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        order: { select: { id: true, number: true } },
        flight: { include: { origin: true, destination: true } },
        passengers: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.booking.count({ where }),
  ]);

  return (
    <>
      <AdminHeader title="Бронювання" description="Місця на рейсах із кодами бронювання та пасажирами." />
      <ListFilters
        q={q}
        placeholder="Код бронювання, рейс, прізвище пасажира або номер замовлення"
        status={status}
        statuses={BOOKING_STATUS_LABELS}
      />
      <TableCard empty={bookings.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Код</th>
              <th>Рейс</th>
              <th>Виліт</th>
              <th>Пасажири</th>
              <th>Тариф</th>
              <th>Статус</th>
              <th>Замовлення</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="font-mono font-bold tracking-widest">{booking.pnr}</td>
                <td className="whitespace-nowrap">
                  <p className="font-medium text-slate-900">{booking.flight.flightNumber}</p>
                  <p className="text-xs text-slate-500">
                    {booking.flight.origin.code} → {booking.flight.destination.code}
                  </p>
                </td>
                <td className="whitespace-nowrap text-slate-600">
                  {formatDateTime(booking.flight.departureAt, booking.flight.origin.timezone)}
                </td>
                <td>
                  <p className="max-w-56 truncate">
                    {booking.passengers.map((p) => `${p.lastName} ${p.firstName}`).join(", ")}
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  {booking.tariffName}
                  <span className="block text-xs text-slate-500">{CABIN_LABELS[booking.cabinClass as CabinClass]}</span>
                </td>
                <td>
                  <StatusBadge status={booking.status} labels={BOOKING_STATUS_LABELS} />
                </td>
                <td>
                  <Link href={`/admin/orders/${booking.order.id}`} className="font-semibold text-brand-700 hover:underline">
                    {booking.order.number}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Pagination page={page} total={total} params={{ q, status }} />
    </>
  );
}
