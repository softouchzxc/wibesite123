import type { Metadata } from "next";
import { deleteExtra, deleteTariff } from "@/app/actions/admin-catalog";
import { AddButton, RowActions } from "@/components/admin/crud";
import { AdminHeader, ListNotices, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { CABIN_LABELS, type CabinClass } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Тарифи та послуги" };

export default async function TariffsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("tariffs.view");
  const { error, saved } = listParams(await searchParams);
  const manage = can(staff.role, "tariffs.manage");
  const [tariffs, extras] = await Promise.all([
    db.tariff.findMany({ orderBy: [{ cabinClass: "desc" }, { sortOrder: "asc" }] }),
    db.extraService.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <AdminHeader
        title="Тарифи"
        description="Тариф задає множник до базової ціни рейсу та умови багажу, обміну й повернення."
        action={manage && <AddButton href="/admin/tariffs/new">Додати тариф</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <TableCard empty={tariffs.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Клас</th>
              <th>Множник</th>
              <th>Багаж</th>
              <th>Обмін</th>
              <th>Повернення</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tariffs.map((tariff) => (
              <tr key={tariff.id}>
                <td>
                  <p className="font-semibold text-slate-900">{tariff.name}</p>
                  <p className="font-mono text-xs text-slate-500">{tariff.code}</p>
                </td>
                <td>{CABIN_LABELS[tariff.cabinClass as CabinClass]}</td>
                <td className="tabular-nums">× {tariff.priceMultiplier}</td>
                <td className="whitespace-nowrap">
                  {tariff.carryOnKg} кг + {tariff.checkedBaggageKg} кг
                </td>
                <td>{tariff.isChangeable ? "Так" : "Ні"}</td>
                <td className="whitespace-nowrap">
                  {tariff.isRefundable ? `Так, утримання ${tariff.refundFeePercent}%` : "Ні"}
                </td>
                <td>{tariff.isActive ? <Badge tone="green">Активний</Badge> : <Badge>Вимкнений</Badge>}</td>
                <td>
                  {manage && (
                    <RowActions
                      editHref={`/admin/tariffs/${tariff.id}`}
                      deleteAction={deleteTariff}
                      id={tariff.id}
                      confirm={`Видалити тариф «${tariff.name}»?`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <div className="mt-10">
        <AdminHeader
          title="Додаткові послуги"
          description="Послуги, які покупець може додати під час бронювання."
          action={manage && <AddButton href="/admin/tariffs/extras/new">Додати послугу</AddButton>}
        />
        <TableCard empty={extras.length === 0}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Ціна</th>
                <th>Нарахування</th>
                <th>Стан</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {extras.map((extra) => (
                <tr key={extra.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{extra.name}</p>
                    <p className="text-xs text-slate-500">{extra.description}</p>
                  </td>
                  <td className="whitespace-nowrap font-semibold">{formatMoney(extra.price)}</td>
                  <td className="whitespace-nowrap">{extra.perPassenger ? "За пасажира" : "За замовлення"}</td>
                  <td>{extra.isActive ? <Badge tone="green">Активна</Badge> : <Badge>Вимкнена</Badge>}</td>
                  <td>
                    {manage && (
                      <RowActions
                        editHref={`/admin/tariffs/extras/${extra.id}`}
                        deleteAction={deleteExtra}
                        id={extra.id}
                        confirm={`Видалити послугу «${extra.name}»?`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}
