import { notFound } from "next/navigation";
import { saveTariff } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { CABIN_CLASSES, CABIN_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function TariffEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("tariffs.manage");
  const { id } = await params;
  const tariff = id === "new" ? null : await db.tariff.findUnique({ where: { id } });
  if (id !== "new" && !tariff) notFound();

  return (
    <EditPage
      title={tariff ? `Тариф «${tariff.name}»` : "Новий тариф"}
      backHref="/admin/tariffs"
      backLabel="Тарифи та послуги"
      action={saveTariff}
      id={tariff?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Назва">
          <input name="name" className="input" defaultValue={tariff?.name} required />
        </Field>
        <Field label="Код" hint="Латинські літери, цифри, підкреслення">
          <input name="code" className="input uppercase" defaultValue={tariff?.code} required />
        </Field>
        <Field label="Клас обслуговування">
          <select name="cabinClass" className="input" defaultValue={tariff?.cabinClass ?? "ECONOMY"}>
            {CABIN_CLASSES.map((c) => (
              <option key={c} value={c}>
                {CABIN_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Множник ціни" hint="Ціна тарифу = базова ціна рейсу × множник">
          <input
            name="priceMultiplier"
            className="input"
            inputMode="decimal"
            defaultValue={tariff?.priceMultiplier ?? 1}
            required
          />
        </Field>
        <Field label="Ручна поклажа, кг">
          <input name="carryOnKg" type="number" min={0} className="input" defaultValue={tariff?.carryOnKg ?? 8} required />
        </Field>
        <Field label="Зареєстрований багаж, кг" hint="0 — без багажу">
          <input
            name="checkedBaggageKg"
            type="number"
            min={0}
            className="input"
            defaultValue={tariff?.checkedBaggageKg ?? 0}
            required
          />
        </Field>
        <Field label="Утримання при поверненні, %" hint="Діє, якщо повернення дозволено">
          <input
            name="refundFeePercent"
            type="number"
            min={0}
            max={100}
            className="input"
            defaultValue={tariff?.refundFeePercent ?? 0}
            required
          />
        </Field>
        <Field label="Порядок показу">
          <input name="sortOrder" type="number" min={0} className="input" defaultValue={tariff?.sortOrder ?? 0} required />
        </Field>
        <Field label="Опис" className="sm:col-span-2">
          <textarea name="description" rows={2} className="input" defaultValue={tariff?.description ?? ""} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Checkbox name="isRefundable" label="Повернення дозволено" defaultChecked={tariff?.isRefundable} />
        <Checkbox name="isChangeable" label="Обмін дозволено" defaultChecked={tariff?.isChangeable} />
        <Checkbox name="seatSelection" label="Вибір місця включено" defaultChecked={tariff?.seatSelection} />
        <Checkbox name="isActive" label="Активний (доступний для продажу)" defaultChecked={tariff?.isActive ?? true} />
      </div>
    </EditPage>
  );
}
