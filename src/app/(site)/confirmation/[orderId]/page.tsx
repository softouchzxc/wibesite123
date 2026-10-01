import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Ticket } from "lucide-react";
import { OrderBookings, OrderTotals } from "@/components/OrderDetails";
import { getOwnOrder } from "@/lib/order-access";

export const metadata: Metadata = { title: "Бронювання підтверджено" };

export default async function ConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOwnOrder(orderId, `/confirmation/${orderId}`);
  if (order.status === "PENDING_PAYMENT") redirect(`/checkout/${order.id}`);
  if (order.status !== "PAID") redirect(`/cabinet/bookings/${order.id}`);

  return (
    <div className="container-page space-y-6 py-8">
      <section className="card flex flex-col items-center gap-3 border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
        <h1 className="text-2xl font-extrabold text-slate-900">Бронювання підтверджено</h1>
        <p className="max-w-xl text-sm text-slate-700">
          Замовлення <span className="font-bold">{order.number}</span> оплачено. Квитки та маршрутну квитанцію
          можна будь-коли переглянути в особистому кабінеті.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {order.bookings.map((booking) => (
            <Link key={booking.id} href={`/ticket/${booking.id}`} className="btn btn-primary">
              <Ticket className="size-4" aria-hidden />
              Переглянути квиток
            </Link>
          ))}
          <Link href="/cabinet/bookings" className="btn btn-secondary">
            Мої бронювання
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <OrderBookings order={order} />
        <aside className="card p-5">
          <h2 className="mb-2 text-lg font-extrabold text-slate-900">Оплачено</h2>
          <OrderTotals order={order} />
          <p className="mt-4 text-xs text-slate-500">Контакти для зв&apos;язку: {order.contactEmail}, {order.contactPhone}</p>
        </aside>
      </div>
    </div>
  );
}
