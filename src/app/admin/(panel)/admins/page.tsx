import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { AddButton } from "@/components/admin/crud";
import { AdminHeader, ListNotices, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/constants";
import { formatDateTime } from "@/lib/datetime";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Адміністратори" };

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPPORT: "Перегляд замовлень, бронювань, клієнтів і рейсів. Без змін.",
  MANAGER: "Керування замовленнями, клієнтами, рейсами, довідниками, тарифами та промокодами.",
  ADMIN: "Повний доступ, включно з налаштуваннями, комісіями та співробітниками.",
};

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const current = await requireStaff("admins.manage");
  const { error, saved } = listParams(await searchParams);
  const staff = await db.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isBlocked: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <AdminHeader
        title="Адміністратори"
        description="Співробітники з доступом до панелі та їхні ролі."
        action={<AddButton href="/admin/admins/new">Додати співробітника</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <TableCard empty={staff.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Співробітник</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Додано</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="font-semibold text-slate-900">
                  {member.firstName} {member.lastName}
                  {member.id === current.id && <span className="ml-2 text-xs font-normal text-slate-500">(ви)</span>}
                </td>
                <td>{member.email}</td>
                <td>
                  <Badge tone={member.role === "ADMIN" ? "blue" : "gray"}>{ROLE_LABELS[member.role as Role]}</Badge>
                </td>
                <td className="whitespace-nowrap text-slate-600">{formatDateTime(member.createdAt)}</td>
                <td>{member.isBlocked ? <Badge tone="red">Заблоковано</Badge> : <Badge tone="green">Активний</Badge>}</td>
                <td className="text-right">
                  <Link href={`/admin/admins/${member.id}`} className="btn btn-ghost btn-sm px-2" aria-label="Редагувати">
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-extrabold text-slate-900">Ролі та права</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {STAFF_ROLES.map((role) => (
            <div key={role}>
              <dt className="font-semibold text-slate-900">{ROLE_LABELS[role]}</dt>
              <dd className="text-slate-600">{ROLE_DESCRIPTIONS[role]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
