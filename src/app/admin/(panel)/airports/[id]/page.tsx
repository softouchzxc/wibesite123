import { notFound } from "next/navigation";
import { saveAirport } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AirportEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("airports.manage");
  const { id } = await params;
  const airport = id === "new" ? null : await db.airport.findUnique({ where: { id } });
  if (id !== "new" && !airport) notFound();

  return (
    <EditPage
      title={airport ? `Аеропорт ${airport.code}` : "Новий аеропорт"}
      backHref="/admin/airports"
      backLabel="Усі аеропорти"
      action={saveAirport}
      id={airport?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Код IATA" hint="3 латинські літери">
          <input name="code" className="input uppercase" defaultValue={airport?.code} maxLength={3} required />
        </Field>
        <Field label="Назва аеропорту">
          <input name="name" className="input" defaultValue={airport?.name} required />
        </Field>
        <Field label="Місто">
          <input name="city" className="input" defaultValue={airport?.city} required />
        </Field>
        <Field label="Країна">
          <input name="country" className="input" defaultValue={airport?.country} required />
        </Field>
        <Field label="Часовий пояс" hint="Назва IANA, наприклад Europe/Kyiv або Europe/Warsaw">
          <input name="timezone" className="input" defaultValue={airport?.timezone ?? "Europe/Kyiv"} required />
        </Field>
      </div>
      <Checkbox name="isActive" label="Активний (показується в пошуку)" defaultChecked={airport?.isActive ?? true} />
    </EditPage>
  );
}
