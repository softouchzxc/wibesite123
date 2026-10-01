import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, ListFilters, Pagination, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Клієнти" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("customers.view");
  const { q, page, skip, take } = listParams(await searchParams);

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q
      ? {
          OR: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return (
    <>
      <AdminHeader title="Клієнти" description="Зареєстровані покупці та їхні замовлення." />
      <ListFilters q={q} placeholder="Ім'я, прізвище, email або телефон" />
      <TableCard empty={customers.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Клієнт</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Замовлень</th>
              <th>Зареєстровано</th>
              <th>Стан</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-brand-700 hover:underline">
                    {customer.firstName} {customer.lastName}
                  </Link>
                </td>
                <td>{customer.email}</td>
                <td className="whitespace-nowrap">{customer.phone ?? "—"}</td>
                <td>{customer._count.orders}</td>
                <td className="whitespace-nowrap text-slate-600">{formatDateTime(customer.createdAt)}</td>
                <td>{customer.isBlocked ? <Badge tone="red">Заблоковано</Badge> : <Badge tone="green">Активний</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Pagination page={page} total={total} params={{ q }} />
    </>
  );
}
