import { notFound } from "next/navigation";
import { saveExtra } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ExtraEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("tariffs.manage");
  const { id } = await params;
  const extra = id === "new" ? null : await db.extraService.findUnique({ where: { id } });
  if (id !== "new" && !extra) notFound();

  return (
    <EditPage
      title={extra ? `Послуга «${extra.name}»` : "Нова послуга"}
      backHref="/admin/tariffs"
      backLabel="Тарифи та послуги"
      action={saveExtra}
      id={extra?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Назва">
          <input name="name" className="input" defaultValue={extra?.name} required />
        </Field>
        <Field label="Код" hint="Латинські літери, цифри, підкреслення">
          <input name="code" className="input uppercase" defaultValue={extra?.code} required />
        </Field>
        <Field label="Ціна, ₴">
          <input name="price" className="input" inputMode="decimal" defaultValue={extra ? extra.price / 100 : ""} required />
        </Field>
        <Field label="Порядок показу">
          <input name="sortOrder" type="number" min={0} className="input" defaultValue={extra?.sortOrder ?? 0} required />
        </Field>
        <Field label="Опис" className="sm:col-span-2">
          <textarea name="description" rows={2} className="input" defaultValue={extra?.description ?? ""} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Checkbox
          name="perPassenger"
          label="Ціна за кожного пасажира з місцем"
          defaultChecked={extra?.perPassenger ?? true}
        />
        <Checkbox name="isActive" label="Активна (доступна під час бронювання)" defaultChecked={extra?.isActive ?? true} />
      </div>
    </EditPage>
  );
}
