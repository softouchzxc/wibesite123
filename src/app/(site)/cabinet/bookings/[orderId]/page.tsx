import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { cancelOwnOrder } from "@/app/actions/booking";
import { ActionForm } from "@/components/form";
import { OrderBookings, OrderTotals } from "@/components/OrderDetails";
import { Alert, DetailRow, StatusBadge } from "@/components/ui";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/format";
import { getOwnOrder } from "@/lib/order-access";
import { customerRefundAmount, customerRefundBlocker } from "@/lib/orders";

export const metadata: Metadata = { title: "Бронювання" };

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOwnOrder(orderId, `/cabinet/bookings/${orderId}`);
  const refundBlocker = customerRefundBlocker(order);
  const refunded = order.payments.find((p) => p.status === "REFUNDED");

  return (
    <div className="space-y-6">
      <Link href="/cabinet/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Усі бронювання
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold text-slate-900">Замовлення {order.number}</h2>
        <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <OrderBookings order={order} showDocuments />

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 text-lg font-extrabold text-slate-900">Вартість</h3>
            <OrderTotals order={order} />
            <dl className="mt-4 border-t border-slate-100 pt-2">
              <DetailRow label="Створено">{formatDateTime(order.createdAt)}</DetailRow>
              {order.paidAt && <DetailRow label="Оплачено">{formatDateTime(order.paidAt)}</DetailRow>}
              {refunded && <DetailRow label="Повернено">{formatMoney(refunded.refundedAmount)}</DetailRow>}
            </dl>
          </div>

          {order.status === "PENDING_PAYMENT" && (
            <Link href={`/checkout/${order.id}`} className="btn btn-accent w-full text-base">
              Перейти до оплати
            </Link>
          )}

          {order.status === "PAID" && (
            <>
              {order.bookings.map((booking) => (
                <Link key={booking.id} href={`/ticket/${booking.id}`} className="btn btn-primary w-full">
                  <Ticket className="size-4" aria-hidden />
                  Переглянути / завантажити квиток
                </Link>
              ))}

              <div className="card p-5">
                <h3 className="text-base font-extrabold text-slate-900">Скасування та повернення</h3>
                {refundBlocker ? (
                  <p className="mt-2 text-sm text-slate-600">{refundBlocker}</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-slate-600">
                      За умовами тарифу до повернення:{" "}
                      <span className="font-bold text-slate-900">{formatMoney(customerRefundAmount(order))}</span>.
                      Сервісний збір і утримання за тарифом не повертаються.
                    </p>
                    <ActionForm
                      action={cancelOwnOrder}
                      submitLabel="Скасувати та повернути кошти"
                      submitClassName="btn btn-danger w-full"
                      className="mt-4 space-y-3"
                    >
                      <input type="hidden" name="orderId" value={order.id} />
                      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
                        <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-brand-600" />
                        <span>Я розумію, що бронювання буде скасовано без можливості відновлення.</span>
                      </label>
                    </ActionForm>
                  </>
                )}
              </div>
            </>
          )}

          {(order.status === "CANCELLED" || order.status === "REFUNDED") && (
            <Alert tone="info">
              {order.status === "REFUNDED"
                ? "Бронювання скасовано, кошти повернено на спосіб оплати."
                : "Замовлення скасовано. Кошти не списувалися."}
            </Alert>
          )}
        </aside>
      </div>
    </div>
  );
}
