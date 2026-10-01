import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, ListFilters, ListNotices, Pagination, TableCard, listParams } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { expireStaleOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Замовлення" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("orders.view");
  await expireStaleOrders();
  const { q, status, page, skip, take, error, saved } = listParams(await searchParams);

  const where: Prisma.OrderWhereInput = {
    ...(status in ORDER_STATUS_LABELS ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { contactEmail: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { lastName: { contains: q } }] } },
            { bookings: { some: { pnr: { contains: q.toUpperCase() } } } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        bookings: { select: { flight: { select: { origin: { select: { code: true } }, destination: { select: { code: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.order.count({ where }),
  ]);

  return (
    <>
      <AdminHeader title="Замовлення" description="Усі замовлення клієнтів із сумами та статусами оплати." />
      <ListNotices error={error} saved={saved} />
      <ListFilters q={q} placeholder="Номер, email, прізвище або код бронювання" status={status} statuses={ORDER_STATUS_LABELS} />
      <TableCard empty={orders.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клієнт</th>
              <th>Маршрут</th>
              <th>Створено</th>
              <th>Статус</th>
              <th className="text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                    {order.number}
                  </Link>
                </td>
                <td>
                  <p className="font-medium text-slate-900">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{order.user.email}</p>
                </td>
                <td className="whitespace-nowrap">
                  {order.bookings.map((b) => `${b.flight.origin.code} → ${b.flight.destination.code}`).join(", ")}
                </td>
                <td className="whitespace-nowrap text-slate-600">{formatDateTime(order.createdAt)}</td>
                <td>
                  <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />
                </td>
                <td className="whitespace-nowrap text-right font-semibold">{formatMoney(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Pagination page={page} total={total} params={{ q, status }} />
    </>
  );
}
