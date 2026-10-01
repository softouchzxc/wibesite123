import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { ActionForm } from "@/components/form";
import { getCurrentUser, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Реєстрація" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNextPath((await searchParams).next, "/cabinet");
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Реєстрація</h1>
        <p className="mt-1 text-sm text-slate-600">Створіть обліковий запис, щоб бронювати квитки.</p>

        <ActionForm
          action={register}
          submitLabel="Зареєструватися"
          submitClassName="btn btn-primary w-full"
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">
                Ім&apos;я
              </label>
              <input id="firstName" name="firstName" className="input" autoComplete="given-name" required />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Прізвище
              </label>
              <input id="lastName" name="lastName" className="input" autoComplete="family-name" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Електронна пошта
            </label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Телефон <span className="font-normal text-slate-400">(необов&apos;язково)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input"
              placeholder="+380 XX XXX XX XX"
              autoComplete="tel"
            />
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
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Щонайменше 8 символів, літери та цифри.</p>
          </div>
          <div>
            <label className="label" htmlFor="passwordConfirm">
              Повторіть пароль
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              className="input"
              autoComplete="new-password"
              required
            />
          </div>
        </ActionForm>

        <p className="mt-6 text-center text-sm text-slate-600">
          Уже маєте обліковий запис?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
