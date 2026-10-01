import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { adminCancelOrder } from "@/app/actions/admin-system";
import { AdminHeader, ListNotices, listParams } from "@/components/admin/ui";
import { ActionForm } from "@/components/form";
import { OrderBookings, OrderTotals } from "@/components/OrderDetails";
import { DetailRow, StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { expireStaleOrders, orderInclude } from "@/lib/orders";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Замовлення" };

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("orders.view");
  await expireStaleOrders();
  const { id } = await params;
  const { error, saved } = listParams(await searchParams);
  const order = await db.order.findUnique({ where: { id }, include: { ...orderInclude, user: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!order) notFound();

  const canCancel = can(staff.role, "orders.manage") && (order.status === "PAID" || order.status === "PENDING_PAYMENT");

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Усі замовлення
      </Link>
      <AdminHeader
        title={`Замовлення ${order.number}`}
        action={<StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />}
      />
      <ListNotices error={error} saved={saved} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
        <div className="space-y-6">
          <OrderBookings order={order} showDocuments />

          <section className="card overflow-hidden">
            <h2 className="px-5 py-4 text-base font-extrabold text-slate-900">Платежі</h2>
            {order.payments.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">Спроб оплати ще не було.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Сервіс</th>
                      <th>Ідентифікатор</th>
                      <th>Статус</th>
                      <th className="text-right">Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="whitespace-nowrap text-slate-600">{formatDateTime(payment.createdAt)}</td>
                        <td>{payment.provider}</td>
                        <td className="font-mono text-xs">{payment.providerRef ?? "—"}</td>
                        <td>
                          <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
                        </td>
                        <td className="whitespace-nowrap text-right font-semibold">
                          {formatMoney(payment.amount)}
                          {payment.refundedAmount > 0 && (
                            <span className="block text-xs font-normal text-slate-500">
                              повернено {formatMoney(payment.refundedAmount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-2 text-base font-extrabold text-slate-900">Вартість</h2>
            <OrderTotals order={order} />
          </div>

          <div className="card p-5">
            <h2 className="mb-1 text-base font-extrabold text-slate-900">Клієнт</h2>
            <dl>
              <DetailRow label="Ім'я">
                <Link href={`/admin/customers/${order.user.id}`} className="text-brand-700 hover:underline">
                  {order.user.firstName} {order.user.lastName}
                </Link>
              </DetailRow>
              <DetailRow label="Email для зв'язку">{order.contactEmail}</DetailRow>
              <DetailRow label="Телефон">{order.contactPhone}</DetailRow>
              <DetailRow label="Створено">{formatDateTime(order.createdAt)}</DetailRow>
              {order.paidAt && <DetailRow label="Оплачено">{formatDateTime(order.paidAt)}</DetailRow>}
              {order.cancelledAt && <DetailRow label="Скасовано">{formatDateTime(order.cancelledAt)}</DetailRow>}
            </dl>
          </div>

          {order.status === "PAID" &&
            order.bookings.map((booking) => (
              <Link key={booking.id} href={`/ticket/${booking.id}`} className="btn btn-secondary w-full">
                <Ticket className="size-4" aria-hidden />
                Маршрутна квитанція
              </Link>
            ))}

          {canCancel && (
            <div className="card p-5">
              <h2 className="text-base font-extrabold text-slate-900">Скасування</h2>
              <p className="mt-1 text-sm text-slate-600">
                {order.status === "PAID"
                  ? `Клієнту буде повернено повну суму ${formatMoney(order.total)}, місця повернуться в продаж.`
                  : "Замовлення ще не оплачено — воно буде просто скасовано."}
              </p>
              <ActionForm
                action={adminCancelOrder}
                submitLabel={order.status === "PAID" ? "Скасувати й повернути кошти" : "Скасувати замовлення"}
                submitClassName="btn btn-danger w-full"
                className="mt-4 space-y-3"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
                  <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-brand-600" />
                  <span>Підтверджую скасування. Цю дію не можна відмінити.</span>
                </label>
              </ActionForm>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
