import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { cancelOwnOrder, payForOrder } from "@/app/actions/booking";
import { ActionForm } from "@/components/form";
import { OrderBookings, OrderTotals } from "@/components/OrderDetails";
import { Alert, EmptyState } from "@/components/ui";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/constants";
import { formatTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/format";
import { getOwnOrder } from "@/lib/order-access";
import { getPaymentProvider } from "@/lib/providers/payments";

export const metadata: Metadata = { title: "Оплата замовлення" };

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOwnOrder(orderId, `/checkout/${orderId}`);
  if (order.status === "PAID") redirect(`/confirmation/${order.id}`);

  if (order.status !== "PENDING_PAYMENT") {
    return (
      <div className="container-page py-10">
        <EmptyState title="Замовлення скасовано">
          <p>Час на оплату минув або замовлення було скасовано. Оформіть бронювання ще раз.</p>
          <Link href="/" className="btn btn-primary mt-4">
            Новий пошук
          </Link>
        </EmptyState>
      </div>
    );
  }

  const provider = getPaymentProvider();
  const payUntil = new Date(order.createdAt.getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

  return (
    <div className="container-page space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Оплата замовлення {order.number}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Оплатіть замовлення до {formatTime(payUntil, "Europe/Kyiv")} (за київським часом), інакше його буде
          скасовано. Місця закріплюються за вами після оплати.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <OrderBookings order={order} />

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="card p-5">
            <h2 className="mb-2 text-lg font-extrabold text-slate-900">До сплати</h2>
            <OrderTotals order={order} />
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Lock className="size-4 text-emerald-600" aria-hidden />
              Оплата
            </h2>
            {provider.isDemo && (
              <Alert tone="warning" className="mt-3">
                Тестовий режим: платіжний сервіс ще не підключено, тому дані картки не потрібні й кошти не
                списуються.
              </Alert>
            )}
            <ActionForm
              action={payForOrder}
              submitLabel={`Оплатити ${formatMoney(order.total)}`}
              submitClassName="btn btn-accent w-full text-base"
              className="mt-4 space-y-3"
              footer={
                provider.isDemo && (
                  <button type="submit" name="outcome" value="failure" className="btn btn-secondary w-full">
                    Імітувати відмову банку
                  </button>
                )
              }
            >
              <input type="hidden" name="orderId" value={order.id} />
            </ActionForm>
          </div>

          <ActionForm
            action={cancelOwnOrder}
            submitLabel="Скасувати замовлення"
            submitClassName="btn btn-ghost w-full text-slate-500"
            className=""
          >
            <input type="hidden" name="orderId" value={order.id} />
          </ActionForm>
        </aside>
      </div>
    </div>
  );
}
