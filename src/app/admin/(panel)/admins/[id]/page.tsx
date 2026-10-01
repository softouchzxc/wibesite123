import { notFound } from "next/navigation";
import { saveStaff } from "@/app/actions/admin-system";
import { EditPage } from "@/components/admin/crud";
import { Checkbox, Field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("admins.manage");
  const { id } = await params;
  const member =
    id === "new"
      ? null
      : await db.user.findFirst({
          where: { id, role: { in: STAFF_ROLES } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isBlocked: true },
        });
  if (id !== "new" && !member) notFound();

  return (
    <EditPage
      title={member ? `${member.firstName} ${member.lastName}` : "Новий співробітник"}
      backHref="/admin/admins"
      backLabel="Усі адміністратори"
      action={saveStaff}
      id={member?.id}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ім'я">
          <input name="firstName" className="input" defaultValue={member?.firstName} required />
        </Field>
        <Field label="Прізвище">
          <input name="lastName" className="input" defaultValue={member?.lastName} required />
        </Field>
        <Field label="Електронна пошта">
          <input name="email" type="email" className="input" defaultValue={member?.email} autoComplete="off" required />
        </Field>
        <Field label="Роль">
          <select name="role" className="input" defaultValue={member?.role ?? "SUPPORT"}>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={member ? "Новий пароль" : "Пароль"}
          hint={member ? "Залиште порожнім, щоб не змінювати" : "Щонайменше 10 символів, літери та цифри"}
        >
          <input name="password" type="password" className="input" autoComplete="new-password" required={!member} />
        </Field>
      </div>
      <Checkbox name="isBlocked" label="Заблокувати доступ" defaultChecked={member?.isBlocked} />
    </EditPage>
  );
}
