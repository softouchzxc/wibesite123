import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, ListFilters, Pagination, TableCard, listParams } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Платежі" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("payments.view");
  const { q, status, page, skip, take } = listParams(await searchParams);

  const where: Prisma.PaymentWhereInput = {
    ...(status in PAYMENT_STATUS_LABELS ? { status } : {}),
    ...(q ? { OR: [{ providerRef: { contains: q.toUpperCase() } }, { order: { number: { contains: q } } }] } : {}),
  };
  const [payments, total, succeeded] = await Promise.all([
    db.payment.findMany({
      where,
      include: { order: { select: { id: true, number: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.payment.count({ where }),
    db.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true } }),
  ]);

  return (
    <>
      <AdminHeader
        title="Платежі"
        description={`Усі спроби оплати та повернення. Успішних платежів на суму ${formatMoney(succeeded._sum.amount ?? 0)}.`}
      />
      <ListFilters q={q} placeholder="Ідентифікатор платежу або номер замовлення" status={status} statuses={PAYMENT_STATUS_LABELS} />
      <TableCard empty={payments.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Замовлення</th>
              <th>Сервіс</th>
              <th>Ідентифікатор</th>
              <th>Статус</th>
              <th className="text-right">Сума</th>
              <th className="text-right">Повернено</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap text-slate-600">{formatDateTime(payment.createdAt)}</td>
                <td>
                  <Link href={`/admin/orders/${payment.order.id}`} className="font-semibold text-brand-700 hover:underline">
                    {payment.order.number}
                  </Link>
                </td>
                <td>{payment.provider}</td>
                <td className="font-mono text-xs">{payment.providerRef ?? "—"}</td>
                <td>
                  <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
                </td>
                <td className="whitespace-nowrap text-right font-semibold">{formatMoney(payment.amount)}</td>
                <td className="whitespace-nowrap text-right text-slate-600">
                  {payment.refundedAmount > 0 ? formatMoney(payment.refundedAmount) : "—"}
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
