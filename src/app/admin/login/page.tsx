import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { adminLogin } from "@/app/actions/auth";
import { ActionForm } from "@/components/form";
import { Alert } from "@/components/ui";
import { getCurrentUser, isStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Вхід до адмін-панелі", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (isStaff(user)) redirect("/admin");

  return (
    <main className="grid flex-1 place-items-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Адміністративна панель</h1>
        <p className="mt-1 text-sm text-slate-600">Вхід лише для співробітників.</p>

        {user && (
          <Alert tone="warning" className="mt-4">
            Ви ввійшли як клієнт ({user.email}). Для доступу до панелі увійдіть обліковим записом співробітника.
          </Alert>
        )}

        <ActionForm action={adminLogin} submitLabel="Увійти" submitClassName="btn btn-primary w-full" className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Електронна пошта
            </label>
            <input id="email" name="email" type="email" className="input" autoComplete="username" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
        </ActionForm>

        <Link href="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-brand-700">
          ← Повернутися на сайт
        </Link>
      </div>
    </main>
  );
}
