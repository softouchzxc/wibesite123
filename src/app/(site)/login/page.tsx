import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm } from "@/components/form";
import { getCurrentUser, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Вхід" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNextPath((await searchParams).next, "/cabinet");
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Вхід до кабінету</h1>
        <p className="mt-1 text-sm text-slate-600">Увійдіть, щоб бронювати квитки та керувати поїздками.</p>

        <ActionForm action={login} submitLabel="Увійти" submitClassName="btn btn-primary w-full" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="email">
              Електронна пошта
            </label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" required />
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

        <p className="mt-6 text-center text-sm text-slate-600">
          Ще не маєте облікового запису?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
