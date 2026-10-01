import type { Metadata } from "next";
import { changePassword, updateProfile } from "@/app/actions/auth";
import { ActionForm } from "@/components/form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Профіль" };

export default async function ProfilePage() {
  const user = await requireUser("/cabinet");

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Особисті дані</h2>
        <ActionForm action={updateProfile} submitLabel="Зберегти" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">
                Ім&apos;я
              </label>
              <input id="firstName" name="firstName" className="input" defaultValue={user.firstName} required />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Прізвище
              </label>
              <input id="lastName" name="lastName" className="input" defaultValue={user.lastName} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Електронна пошта
            </label>
            <input id="email" className="input" value={user.email} disabled readOnly />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input"
              defaultValue={user.phone ?? ""}
              placeholder="+380 XX XXX XX XX"
            />
          </div>
        </ActionForm>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Зміна пароля</h2>
        <ActionForm action={changePassword} submitLabel="Змінити пароль" className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="currentPassword">
              Поточний пароль
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="newPassword">
              Новий пароль
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="newPasswordConfirm">
              Повторіть новий пароль
            </label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              className="input"
              autoComplete="new-password"
              required
            />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
