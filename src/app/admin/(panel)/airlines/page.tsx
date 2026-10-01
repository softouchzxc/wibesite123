import type { Metadata } from "next";
import { deleteAirline } from "@/app/actions/admin-catalog";
import { AddButton, RowActions } from "@/components/admin/crud";
import { AdminHeader, ListNotices, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Авіакомпанії" };

export default async function AirlinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("airlines.view");
  const { error, saved } = listParams(await searchParams);
  const manage = can(staff.role, "airlines.manage");
  const airlines = await db.airline.findMany({
    include: { _count: { select: { flights: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminHeader
        title="Авіакомпанії"
        description="Перевізники та комісія, яку агенція отримує від вартості перельоту."
        action={manage && <AddButton href="/admin/airlines/new">Додати авіакомпанію</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <TableCard empty={airlines.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Код</th>
              <th>Назва</th>
              <th>Країна</th>
              <th>Комісія</th>
              <th>Рейсів</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {airlines.map((airline) => (
              <tr key={airline.id}>
                <td className="font-mono font-bold">{airline.code}</td>
                <td className="font-medium text-slate-900">{airline.name}</td>
                <td>{airline.country ?? "—"}</td>
                <td>{airline.commissionPercent}%</td>
                <td>{airline._count.flights}</td>
                <td>{airline.isActive ? <Badge tone="green">Активна</Badge> : <Badge>Вимкнена</Badge>}</td>
                <td>
                  {manage && (
                    <RowActions
                      editHref={`/admin/airlines/${airline.id}`}
                      deleteAction={deleteAirline}
                      id={airline.id}
                      confirm={`Видалити авіакомпанію «${airline.name}»?`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
