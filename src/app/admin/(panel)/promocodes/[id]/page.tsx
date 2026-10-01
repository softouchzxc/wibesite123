import { notFound } from "next/navigation";
import { savePromoCode } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { DISCOUNT_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

const dateValue = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : "");

export default async function PromoCodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("promocodes.manage");
  const { id } = await params;
  const promo = id === "new" ? null : await db.promoCode.findUnique({ where: { id } });
  if (id !== "new" && !promo) notFound();

  return (
    <EditPage
      title={promo ? `Промокод ${promo.code}` : "Новий промокод"}
      backHref="/admin/promocodes"
      backLabel="Усі промокоди"
      action={savePromoCode}
      id={promo?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Код" hint="Латинські літери, цифри, дефіс">
          <input name="code" className="input uppercase" defaultValue={promo?.code} required />
        </Field>
        <Field label="Опис">
          <input name="description" className="input" defaultValue={promo?.description ?? ""} />
        </Field>
        <Field label="Тип знижки">
          <select name="discountType" className="input" defaultValue={promo?.discountType ?? "PERCENT"}>
            {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Розмір знижки" hint="Відсотки (1–100) або сума в гривнях — залежно від типу">
          <input
            name="discountValue"
            className="input"
            inputMode="decimal"
            defaultValue={promo ? (promo.discountType === "PERCENT" ? promo.discountValue : promo.discountValue / 100) : ""}
            required
          />
        </Field>
        <Field label="Мінімальна сума замовлення, ₴" hint="0 — без обмеження">
          <input
            name="minOrderAmount"
            className="input"
            inputMode="decimal"
            defaultValue={promo ? promo.minOrderAmount / 100 : 0}
          />
        </Field>
        <Field label="Ліміт використань" hint="Порожньо — без ліміту">
          <input name="maxUses" type="number" min={1} className="input" defaultValue={promo?.maxUses ?? ""} />
        </Field>
        <Field label="Діє з">
          <input name="validFrom" type="date" className="input" defaultValue={dateValue(promo?.validFrom)} />
        </Field>
        <Field label="Діє до (включно)">
          <input name="validTo" type="date" className="input" defaultValue={dateValue(promo?.validTo)} />
        </Field>
      </div>
      <Checkbox name="isActive" label="Активний" defaultChecked={promo?.isActive ?? true} />
    </EditPage>
  );
}
