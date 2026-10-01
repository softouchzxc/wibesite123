import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Headset, ShieldCheck } from "lucide-react";
import { SearchForm } from "@/components/site/SearchForm";
import { SALES_CLOSE_HOURS } from "@/lib/constants";
import { daysFromNow, formatDateShort, localDateKey, todayKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { passengerPrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const ADVANTAGES = [
  { Icon: BadgeCheck, title: "Прозорі тарифи", text: "Одразу видно, що входить у ціну: багаж, обмін і повернення." },
  { Icon: CreditCard, title: "Зручна оплата", text: "Оплата онлайн і миттєве підтвердження бронювання." },
  { Icon: ShieldCheck, title: "Особистий кабінет", text: "Усі бронювання та квитки зберігаються у вашому кабінеті." },
  { Icon: Headset, title: "Підтримка", text: "Допоможемо з бронюванням, обміном і поверненням квитків." },
];

const STEPS = [
  { title: "Знайдіть рейс", text: "Вкажіть напрямок, дату та кількість пасажирів." },
  { title: "Оберіть тариф", text: "Порівняйте умови та додайте потрібні послуги." },
  { title: "Оплатіть онлайн", text: "Квиток з'явиться в особистому кабінеті одразу після оплати." },
];

async function getPopularDestinations() {
  const from = new Date(Date.now() + SALES_CLOSE_HOURS * 60 * 60 * 1000);
  const where = { status: "SCHEDULED", departureAt: { gte: from }, origin: { code: "KBP" } };
  const groups = await db.flight.groupBy({
    by: ["destinationId"],
    where,
    _min: { basePrice: true },
    orderBy: { _min: { basePrice: "asc" } },
    take: 6,
  });
  const cheapestTariff = await db.tariff.findFirst({
    where: { cabinClass: "ECONOMY", isActive: true },
    orderBy: { priceMultiplier: "asc" },
  });
  if (!cheapestTariff) return [];
  const rules = await getSettings();

  const flights = await Promise.all(
    groups.map((g) =>
      db.flight.findFirst({
        where: { ...where, destinationId: g.destinationId, basePrice: g._min.basePrice ?? undefined },
        include: { origin: true, destination: true },
        orderBy: { departureAt: "asc" },
      }),
    ),
  );
  return flights
    .filter((f) => f !== null)
    .map((f) => ({
      id: f.id,
      city: f.destination.city,
      country: f.destination.country,
      code: f.destination.code,
      date: localDateKey(f.departureAt, f.origin.timezone),
      dateLabel: formatDateShort(f.departureAt, f.origin.timezone),
      price: passengerPrice(f.basePrice, cheapestTariff.priceMultiplier, "ADULT", rules),
    }));
}

export default async function HomePage() {
  const [airports, popular] = await Promise.all([
    db.airport.findMany({
      where: { isActive: true },
      select: { code: true, name: true, city: true, country: true },
      orderBy: [{ country: "asc" }, { city: "asc" }],
    }),
    getPopularDestinations(),
  ]);
  const today = todayKey();
  const defaultDate = localDateKey(daysFromNow(7), "Europe/Kyiv");

  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 pb-24 pt-12 text-white sm:pt-20">
        <div className="container-page">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Авіаквитки онлайн — швидко та без зайвих кроків
          </h1>
          <p className="mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Порівнюйте рейси й тарифи, бронюйте за кілька хвилин і керуйте поїздками в особистому кабінеті.
          </p>
        </div>
      </section>

      <section className="container-page relative z-10 -mt-16">
        <SearchForm
          airports={airports}
          minDate={today}
          initial={{
            origin: "KBP",
            destination: "",
            date: defaultDate,
            adults: 1,
            children: 0,
            infants: 0,
            cabinClass: "ECONOMY",
          }}
        />
      </section>

      {popular.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="text-2xl font-extrabold text-slate-900">Популярні напрямки з Києва</h2>
          <p className="mt-1 text-sm text-slate-600">Найнижчі ціни на найближчі дати, за одного дорослого.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((p) => (
              <Link
                key={p.id}
                href={`/search?from=KBP&to=${p.code}&date=${p.date}&adults=1&children=0&infants=0&cabin=ECONOMY`}
                className="card group flex items-center justify-between gap-4 p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-900">{p.city}</p>
                  <p className="text-sm text-slate-500">
                    {p.country} · {p.dateLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-500">від</p>
                  <p className="text-lg font-extrabold text-brand-700">{formatMoney(p.price)}</p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-16">
        <h2 className="text-2xl font-extrabold text-slate-900">Чому обирають нас</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map(({ Icon, title, text }) => (
            <div key={title} className="card p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page my-16">
        <h2 className="text-2xl font-extrabold text-slate-900">Як це працює</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-base font-extrabold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
