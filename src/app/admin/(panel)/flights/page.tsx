import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { deleteFlight } from "@/app/actions/admin-catalog";
import { AddButton, RowActions } from "@/components/admin/crud";
import { AdminHeader, ListFilters, ListNotices, Pagination, TableCard, listParams } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { FLIGHT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatDuration, isDateKey, localDateKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney, stopsLabel } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Рейси" };

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("flights.view");
  const raw = await searchParams;
  const { q, status, page, skip, take, error, saved } = listParams(raw);
  const date = typeof raw.date === "string" && isDateKey(raw.date) ? raw.date : "";
  const manage = can(staff.role, "flights.manage");

  // Без дати показуємо майбутні рейси. З датою беремо вікно із запасом на часові пояси,
  // а точний відбір за місцевою датою вильоту робимо нижче.
  const dayStart = date ? new Date(`${date}T00:00:00Z`).getTime() : 0;
  const code = q.toUpperCase();
  const where: Prisma.FlightWhereInput = {
    ...(status in FLIGHT_STATUS_LABELS ? { status } : {}),
    departureAt: date
      ? { gte: new Date(dayStart - DAY_MS), lt: new Date(dayStart + 2 * DAY_MS) }
      : { gte: new Date() },
    ...(q
      ? {
          OR: [
            { flightNumber: { contains: code } },
            { origin: { code } },
            { destination: { code } },
            { origin: { city: { contains: q } } },
            { destination: { city: { contains: q } } },
          ],
        }
      : {}),
  };
  const include = { airline: true, origin: true, destination: true, _count: { select: { bookings: true } } };
  let flights: Prisma.FlightGetPayload<{ include: typeof include }>[];
  let total: number;
  if (date) {
    const sameDay = (await db.flight.findMany({ where, include, orderBy: { departureAt: "asc" } })).filter(
      (f) => localDateKey(f.departureAt, f.origin.timezone) === date,
    );
    total = sameDay.length;
    flights = sameDay.slice(skip, skip + take);
  } else {
    [flights, total] = await Promise.all([
      db.flight.findMany({ where, include, orderBy: { departureAt: "asc" }, skip, take }),
      db.flight.count({ where }),
    ]);
  }

  return (
    <>
      <AdminHeader
        title="Рейси"
        description="Розклад, базові ціни та залишок місць. Ціна тарифу = базова ціна × множник тарифу."
        action={manage && <AddButton href="/admin/flights/new">Додати рейс</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <ListFilters q={q} placeholder="Номер рейсу, місто або код аеропорту" status={status} statuses={FLIGHT_STATUS_LABELS}>
        <input type="date" name="date" defaultValue={date} className="input w-auto" aria-label="Дата вильоту" />
      </ListFilters>
      <TableCard empty={flights.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Рейс</th>
              <th>Маршрут</th>
              <th>Виліт (місцевий)</th>
              <th>У дорозі</th>
              <th>Базова ціна</th>
              <th>Місця Е / Б</th>
              <th>Бронювань</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {flights.map((flight) => (
              <tr key={flight.id}>
                <td className="whitespace-nowrap">
                  <p className="font-semibold text-slate-900">{flight.flightNumber}</p>
                  <p className="text-xs text-slate-500">{flight.airline.name}</p>
                </td>
                <td className="whitespace-nowrap">
                  {flight.origin.code} → {flight.destination.code}
                  <span className="block text-xs text-slate-500">
                    {flight.origin.city} → {flight.destination.city}
                  </span>
                </td>
                <td className="whitespace-nowrap text-slate-600">
                  {formatDateTime(flight.departureAt, flight.origin.timezone)}
                </td>
                <td className="whitespace-nowrap">
                  {formatDuration(flight.durationMinutes)}
                  <span className="block text-xs text-slate-500">{stopsLabel(flight.stops)}</span>
                </td>
                <td className="whitespace-nowrap font-semibold">{formatMoney(flight.basePrice)}</td>
                <td className="whitespace-nowrap tabular-nums">
                  {flight.seatsEconomy} / {flight.seatsBusiness}
                </td>
                <td>{flight._count.bookings}</td>
                <td>
                  <StatusBadge status={flight.status} labels={FLIGHT_STATUS_LABELS} />
                </td>
                <td>
                  {manage && (
                    <RowActions
                      editHref={`/admin/flights/${flight.id}`}
                      deleteAction={deleteFlight}
                      id={flight.id}
                      confirm={`Видалити рейс ${flight.flightNumber}?`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Pagination page={page} total={total} params={{ q, status, date }} />
    </>
  );
}
