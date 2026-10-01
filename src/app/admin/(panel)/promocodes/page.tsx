import type { Metadata } from "next";
import { deletePromoCode } from "@/app/actions/admin-catalog";
import { AddButton, RowActions } from "@/components/admin/crud";
import { AdminHeader, ListNotices, TableCard, listParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { formatPlainDate } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Промокоди" };

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaff("promocodes.view");
  const { error, saved } = listParams(await searchParams);
  const manage = can(staff.role, "promocodes.manage");
  const promoCodes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <AdminHeader
        title="Промокоди"
        description="Знижки, які покупець застосовує під час бронювання."
        action={manage && <AddButton href="/admin/promocodes/new">Додати промокод</AddButton>}
      />
      <ListNotices error={error} saved={saved} />
      <TableCard empty={promoCodes.length === 0}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>Код</th>
              <th>Знижка</th>
              <th>Мін. сума</th>
              <th>Використано</th>
              <th>Термін дії</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((promo) => {
              const expired = promo.validTo !== null && promo.validTo < now;
              const exhausted = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
              return (
                <tr key={promo.id}>
                  <td>
                    <p className="font-mono font-bold text-slate-900">{promo.code}</p>
                    <p className="text-xs text-slate-500">{promo.description}</p>
                  </td>
                  <td className="whitespace-nowrap font-semibold">
                    {promo.discountType === "PERCENT" ? `${promo.discountValue}%` : formatMoney(promo.discountValue)}
                  </td>
                  <td className="whitespace-nowrap">{promo.minOrderAmount > 0 ? formatMoney(promo.minOrderAmount) : "—"}</td>
                  <td className="whitespace-nowrap tabular-nums">
                    {promo.usedCount}
                    {promo.maxUses !== null ? ` з ${promo.maxUses}` : ""}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">
                    {promo.validFrom || promo.validTo
                      ? `${promo.validFrom ? formatPlainDate(promo.validFrom) : "…"} — ${
                          promo.validTo ? formatPlainDate(promo.validTo) : "…"
                        }`
                      : "Безстроково"}
                  </td>
                  <td>
                    {!promo.isActive ? (
                      <Badge>Вимкнений</Badge>
                    ) : expired ? (
                      <Badge tone="red">Термін минув</Badge>
                    ) : exhausted ? (
                      <Badge tone="amber">Ліміт вичерпано</Badge>
                    ) : (
                      <Badge tone="green">Активний</Badge>
                    )}
                  </td>
                  <td>
                    {manage && (
                      <RowActions
                        editHref={`/admin/promocodes/${promo.id}`}
                        deleteAction={deletePromoCode}
                        id={promo.id}
                        confirm={`Видалити промокод ${promo.code}?`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
