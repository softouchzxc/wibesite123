import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setCustomerBlocked } from "@/app/actions/admin-system";
import { AdminHeader, ListNotices, listParams } from "@/components/admin/ui";
import { SubmitButton } from "@/components/form";
import { Badge, DetailRow, StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Клієнт" };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("customers.view");
  const { id } = await params;
  const { error, saved } = listParams(await searchParams);
  const customer = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isBlocked: true,
      createdAt: true,
      orders: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!customer) notFound();

  const paidTotal = customer.orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        Усі клієнти
      </Link>
      <AdminHeader
        title={`${customer.firstName} ${customer.lastName}`}
        action={customer.isBlocked ? <Badge tone="red">Заблоковано</Badge> : <Badge tone="green">Активний</Badge>}
      />
      <ListNotices error={error} saved={saved} />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr] xl:items-start">
        <aside className="card p-5">
          <dl>
            <DetailRow label="Email">{customer.email}</DetailRow>
            <DetailRow label="Телефон">{customer.phone ?? "—"}</DetailRow>
            <DetailRow label="Зареєстровано">{formatDateTime(customer.createdAt)}</DetailRow>
            <DetailRow label="Замовлень">{customer.orders.length}</DetailRow>
            <DetailRow label="Оплачено на суму">{formatMoney(paidTotal)}</DetailRow>
          </dl>
          {can(staff.role, "customers.manage") && (
            <form action={setCustomerBlocked} className="mt-4 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={customer.id} />
              <input type="hidden" name="blocked" value={String(!customer.isBlocked)} />
              {customer.isBlocked ? (
                <SubmitButton className="btn btn-secondary w-full">Розблокувати клієнта</SubmitButton>
              ) : (
                <SubmitButton
                  className="btn btn-danger w-full"
                  confirm="Заблокувати клієнта? Він не зможе входити до кабінету та бронювати квитки."
                >
                  Заблокувати клієнта
                </SubmitButton>
              )}
            </form>
          )}
        </aside>

        <section className="card overflow-hidden">
          <h2 className="px-5 py-4 text-base font-extrabold text-slate-900">Замовлення</h2>
          {customer.orders.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">Клієнт ще нічого не замовляв.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Створено</th>
                    <th>Статус</th>
                    <th className="text-right">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                          {order.number}
                        </Link>
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
            </div>
          )}
        </section>
      </div>
    </>
  );
}
