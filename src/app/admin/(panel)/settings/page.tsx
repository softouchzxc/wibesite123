import type { Metadata } from "next";
import { updateSettings } from "@/app/actions/admin-system";
import { AdminHeader, Checkbox, Field, ListNotices, listParams } from "@/components/admin/ui";
import { ActionForm } from "@/components/form";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Налаштування" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff("settings.manage");
  const { error, saved } = listParams(await searchParams);
  const settings = await getSettings();
  const flightProvider = process.env.FLIGHT_PROVIDER || "local";
  const paymentProvider = process.env.PAYMENT_PROVIDER || "demo";

  return (
    <div className="max-w-3xl">
      <AdminHeader title="Налаштування" description="Ціноутворення, комісії та контакти сайту." />
      <ListNotices error={error} saved={saved} />

      <div className="card p-5 sm:p-6">
        <ActionForm action={updateSettings} submitLabel="Зберегти налаштування" className="space-y-8">
          <section>
            <h2 className="text-base font-extrabold text-slate-900">Ціни та комісії</h2>
            <p className="mt-1 text-sm text-slate-600">
              Зміни діють для нових замовлень. Комісія від авіакомпаній задається в розділі «Авіакомпанії».
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Сервісний збір, %" hint="Від вартості перельоту">
                <input
                  name="serviceFeePercent"
                  className="input"
                  inputMode="decimal"
                  defaultValue={settings.serviceFeePercent}
                  required
                />
              </Field>
              <Field label="Фіксований збір, ₴" hint="Додається до кожного замовлення">
                <input
                  name="serviceFeeFixed"
                  className="input"
                  inputMode="decimal"
                  defaultValue={settings.serviceFeeFixed / 100}
                  required
                />
              </Field>
              <Field label="Знижка для дітей, %" hint="Пасажири 2–11 років">
                <input
                  name="childDiscountPercent"
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  defaultValue={settings.childDiscountPercent}
                  required
                />
              </Field>
              <Field label="Знижка для немовлят, %" hint="До 2 років, без окремого місця">
                <input
                  name="infantDiscountPercent"
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  defaultValue={settings.infantDiscountPercent}
                  required
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-slate-900">Сайт і підтримка</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Назва сайту">
                <input name="siteName" className="input" defaultValue={settings.siteName} required />
              </Field>
              <Field label="Email підтримки">
                <input name="supportEmail" type="email" className="input" defaultValue={settings.supportEmail} required />
              </Field>
              <Field label="Телефон підтримки">
                <input name="supportPhone" className="input" defaultValue={settings.supportPhone} required />
              </Field>
            </div>
            <div className="mt-4">
              <Checkbox
                name="demoBanner"
                label="Показувати попередження про демонстраційний режим"
                defaultChecked={settings.demoBanner}
              />
            </div>
          </section>
        </ActionForm>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900">Інтеграції</h2>
        <p className="mt-1 text-sm text-slate-600">
          Постачальники задаються у файлі <code className="rounded bg-slate-100 px-1">.env</code> і підключаються
          розробником.
        </p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Постачальник рейсів</dt>
            <dd className="font-semibold text-slate-900">
              {flightProvider === "local" ? "Власна база рейсів (GDS не підключено)" : flightProvider}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Платіжний сервіс</dt>
            <dd className="font-semibold text-slate-900">
              {paymentProvider === "demo" ? "Тестова оплата (кошти не списуються)" : paymentProvider}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
