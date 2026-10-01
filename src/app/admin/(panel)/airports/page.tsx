import type { Metadata } from "next";
import { deleteAirport } from "@/app/actions/admin-catalog";
import { AddButton, RowActions } from "@/components/admin/crud";
import { AdminHeader, ListNotices, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Аеропорти" };

export default async function AirportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("airports.view");
  const { error, saved } = listParams(await searchParams);
  const manage = can(staff.role, "airports.manage");
  const airports = await db.airport.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }] });

  return (
    <>
      <AdminHeader
        title="Аеропорти"
        description="Аеропорти, доступні в пошуку. Часовий пояс визначає місцевий час вильоту та прибуття."
        action={manage && <AddButton href="/admin/airports/new">Додати аеропорт</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <TableCard empty={airports.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Код</th>
              <th>Місто</th>
              <th>Аеропорт</th>
              <th>Країна</th>
              <th>Часовий пояс</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {airports.map((airport) => (
              <tr key={airport.id}>
                <td className="font-mono font-bold">{airport.code}</td>
                <td className="font-medium text-slate-900">{airport.city}</td>
                <td>{airport.name}</td>
                <td>{airport.country}</td>
                <td className="text-slate-600">{airport.timezone}</td>
                <td>{airport.isActive ? <Badge tone="green">Активний</Badge> : <Badge>Вимкнений</Badge>}</td>
                <td>
                  {manage && (
                    <RowActions
                      editHref={`/admin/airports/${airport.id}`}
                      deleteAction={deleteAirport}
                      id={airport.id}
                      confirm={`Видалити аеропорт ${airport.code}?`}
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
