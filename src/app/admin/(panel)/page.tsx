import Link from "next/link";
import { SalesChart, type SalesPoint } from "@/components/admin/SalesChart";
import { AdminHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { daysFromNow, formatDateTime, localDateKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { expireStaleOrders } from "@/lib/orders";

const PERIOD_DAYS = 30;
const CHART_DAYS = 14;
const TZ = "Europe/Kyiv";

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function RankList({ title, rows }: { title: string; rows: { name: string; count: number; revenue: number }[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Поки що немає даних.</p>
      ) : (
        <ol className="mt-3 divide-y divide-slate-100 text-sm">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate font-medium text-slate-900">{row.name}</span>
              <span className="shrink-0 text-slate-500">
                {row.count} · <span className="font-semibold text-slate-900">{formatMoney(row.revenue)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function topRows(map: Map<string, { count: number; revenue: number }>) {
  return [...map]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export default async function DashboardPage() {
  await requireStaff("dashboard.view");
  await expireStaleOrders();
  const since = daysFromNow(-PERIOD_DAYS);

  const [paidOrders, pendingCount, newCustomers, upcomingFlights, recentOrders] = await Promise.all([
    db.order.findMany({
      where: { status: "PAID", paidAt: { gte: since } },
      select: {
        total: true,
        serviceFee: true,
        paidAt: true,
        bookings: {
          select: {
            fareTotal: true,
            flight: {
              select: {
                airline: { select: { name: true, commissionPercent: true } },
                origin: { select: { city: true } },
                destination: { select: { city: true } },
              },
            },
          },
        },
      },
    }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since } } }),
    db.flight.count({ where: { status: "SCHEDULED", departureAt: { gte: new Date() } } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  // Дохід агенції: сервісний збір плюс комісія авіакомпаній від вартості перельоту.
  const income = paidOrders.reduce(
    (sum, o) =>
      sum +
      o.serviceFee +
      o.bookings.reduce((s, b) => s + Math.round((b.fareTotal * b.flight.airline.commissionPercent) / 100), 0),
    0,
  );

  const days = new Map<string, SalesPoint>();
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const date = daysFromNow(-i);
    const key = localDateKey(date, TZ);
    const label = new Intl.DateTimeFormat("uk-UA", { timeZone: TZ, day: "numeric", month: "short" }).format(date);
    days.set(key, { key, label, revenue: 0, orders: 0 });
  }
  const routes = new Map<string, { count: number; revenue: number }>();
  const airlines = new Map<string, { count: number; revenue: number }>();
  const bump = (map: typeof routes, name: string, amount: number) => {
    const row = map.get(name) ?? { count: 0, revenue: 0 };
    row.count++;
    row.revenue += amount;
    map.set(name, row);
  };
  for (const order of paidOrders) {
    const day = order.paidAt && days.get(localDateKey(order.paidAt, TZ));
    if (day) {
      day.revenue += order.total;
      day.orders++;
    }
    for (const b of order.bookings) {
      bump(routes, `${b.flight.origin.city} → ${b.flight.destination.city}`, b.fareTotal);
      bump(airlines, b.flight.airline.name, b.fareTotal);
    }
  }

  return (
    <>
      <AdminHeader title="Огляд" description={`Показники за останні ${PERIOD_DAYS} днів.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Продажі" value={formatMoney(revenue)} hint={`Оплачених замовлень: ${paidOrders.length}`} />
        <StatTile
          label="Дохід агенції"
          value={formatMoney(income)}
          hint="Сервісний збір і комісія авіакомпаній"
        />
        <StatTile
          label="Середній чек"
          value={paidOrders.length ? formatMoney(Math.round(revenue / paidOrders.length)) : "—"}
          hint={`Нових клієнтів: ${newCustomers}`}
        />
        <StatTile label="Очікують оплати" value={String(pendingCount)} hint={`Рейсів у продажу: ${upcomingFlights}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 text-base font-extrabold text-slate-900">Продажі за {CHART_DAYS} днів</h2>
          <SalesChart data={[...days.values()]} />
        </section>
        <div className="grid gap-6">
          <RankList title="Популярні напрямки" rows={topRows(routes)} />
          <RankList title="Авіакомпанії" rows={topRows(airlines)} />
        </div>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-extrabold text-slate-900">Останні замовлення</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
            Усі замовлення
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клієнт</th>
                <th>Створено</th>
                <th>Статус</th>
                <th className="text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.number}
                    </Link>
                  </td>
                  <td>
                    {order.user.firstName} {order.user.lastName}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{formatDateTime(order.createdAt)}</td>
                  <td>
                    <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />
                  </td>
                  <td className="whitespace-nowrap text-right font-semibold">{formatMoney(order.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Замовлень ще немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
