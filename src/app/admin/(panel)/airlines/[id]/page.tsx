import { notFound } from "next/navigation";
import { saveAirline } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AirlineEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("airlines.manage");
  const { id } = await params;
  const airline = id === "new" ? null : await db.airline.findUnique({ where: { id } });
  if (id !== "new" && !airline) notFound();

  return (
    <EditPage
      title={airline ? `Авіакомпанія «${airline.name}»` : "Нова авіакомпанія"}
      backHref="/admin/airlines"
      backLabel="Усі авіакомпанії"
      action={saveAirline}
      id={airline?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Код" hint="2–3 латинські літери або цифри">
          <input name="code" className="input uppercase" defaultValue={airline?.code} maxLength={3} required />
        </Field>
        <Field label="Назва">
          <input name="name" className="input" defaultValue={airline?.name} required />
        </Field>
        <Field label="Країна">
          <input name="country" className="input" defaultValue={airline?.country ?? ""} />
        </Field>
        <Field label="Комісія агенції, %" hint="Відсоток від вартості перельоту, який отримує агенція">
          <input
            name="commissionPercent"
            className="input"
            inputMode="decimal"
            defaultValue={airline?.commissionPercent ?? 0}
            required
          />
        </Field>
      </div>
      <Checkbox name="isActive" label="Активна (рейси доступні для продажу)" defaultChecked={airline?.isActive ?? true} />
    </EditPage>
  );
}
