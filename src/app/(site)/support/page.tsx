import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Підтримка" };

const FAQ = [
  {
    q: "Як забронювати квиток?",
    a: "Вкажіть напрямок, дату й кількість пасажирів на головній сторінці, оберіть рейс і тариф, введіть дані пасажирів та оплатіть замовлення. Для бронювання потрібен обліковий запис.",
  },
  {
    q: "Де знайти мій квиток після оплати?",
    a: "У розділі «Мої бронювання» особистого кабінету. Відкрийте замовлення й натисніть «Переглянути / завантажити квиток» — квитанцію можна роздрукувати або зберегти як PDF.",
  },
  {
    q: "Скільки часу є на оплату?",
    a: "Замовлення потрібно оплатити протягом 30 хвилин після створення. Неоплачене замовлення скасовується автоматично, і його доведеться оформити заново.",
  },
  {
    q: "Як скасувати бронювання та повернути кошти?",
    a: "Якщо тариф передбачає повернення, у картці замовлення в кабінеті буде кнопка скасування із сумою до повернення. Онлайн-повернення закривається за 3 години до вильоту. Для тарифів без повернення зверніться до підтримки.",
  },
  {
    q: "Які дані пасажирів потрібні?",
    a: "Прізвище та ім'я латиницею, як у паспорті, дата народження, стать, громадянство та номер паспорта. Перевірте дані перед оплатою: помилки в імені можуть завадити посадці на рейс.",
  },
  {
    q: "Як рахується вартість для дітей і немовлят?",
    a: "Діти від 2 до 11 років летять зі знижкою та окремим місцем. Немовлята до 2 років летять без окремого місця разом із дорослим — на кожне немовля потрібен один дорослий пасажир.",
  },
  {
    q: "Що таке сервісний збір?",
    a: "Це плата агенції за оформлення бронювання. Вона показується окремим рядком до оплати й не повертається при скасуванні.",
  },
];

export default async function SupportPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Підтримка</h1>
      <p className="mt-1 text-sm text-slate-600">Відповіді на поширені запитання та контакти служби підтримки.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="card divide-y divide-slate-100">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-slate-900">
                {item.q}
                <span className="text-xl font-normal text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </section>

        <aside className="card p-5">
          <h2 className="text-lg font-extrabold text-slate-900">Зв&apos;язатися з нами</h2>
          <p className="mt-1 text-sm text-slate-600">Вкажіть номер замовлення — так ми допоможемо швидше.</p>
          <a
            href={`mailto:${settings.supportEmail}`}
            className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 hover:border-brand-300"
          >
            <Mail className="size-5 text-brand-600" aria-hidden />
            {settings.supportEmail}
          </a>
          <a
            href={`tel:${settings.supportPhone.replace(/[^\d+]/g, "")}`}
            className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-900 hover:border-brand-300"
          >
            <Phone className="size-5 text-brand-600" aria-hidden />
            {settings.supportPhone}
          </a>
        </aside>
      </div>
    </div>
  );
}
