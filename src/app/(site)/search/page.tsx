import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/site/SearchForm";
import { SearchResults } from "@/components/site/SearchResults";
import { EmptyState } from "@/components/ui";
import { CABIN_LABELS } from "@/lib/constants";
import { formatDate, localDateKey, todayKey } from "@/lib/datetime";
import { db } from "@/lib/db";
import { PASSENGER_FORMS, countLabel } from "@/lib/format";
import { getFlightProvider } from "@/lib/providers/flights";
import { parseSearch, passengerQuery, searchQuery } from "@/lib/search-params";

export const metadata: Metadata = { title: "Результати пошуку" };

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = parseSearch(await searchParams);
  const airports = await db.airport.findMany({
    where: { isActive: true },
    select: { code: true, name: true, city: true, country: true },
    orderBy: [{ country: "asc" }, { city: "asc" }],
  });
  const today = todayKey();

  if (!search) {
    return (
      <div className="container-page space-y-6 py-8">
        <SearchForm
          airports={airports}
          minDate={today}
          initial={{ origin: "", destination: "", date: today, adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY" }}
        />
        <EmptyState title="Вкажіть параметри пошуку">Оберіть напрямок і дату, щоб побачити доступні рейси.</EmptyState>
      </div>
    );
  }

  const origin = airports.find((a) => a.code === search.origin);
  const destination = airports.find((a) => a.code === search.destination);
  const offers =
    origin && destination && search.date >= today ? await getFlightProvider().search(search) : [];
  const paxTotal = search.adults + search.children + search.infants;

  // Сусідні дати допомагають, коли на обраний день рейсів немає.
  const base = new Date(`${search.date}T12:00:00Z`).getTime();
  const nearby = [-1, 1]
    .map((shift) => localDateKey(new Date(base + shift * DAY_MS), "UTC"))
    .filter((date) => date >= today);

  return (
    <div className="container-page space-y-6 py-8">
      <SearchForm key={`form:${searchQuery(search)}`} airports={airports} minDate={today} initial={search} />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {origin?.city ?? search.origin} → {destination?.city ?? search.destination}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(`${search.date}T12:00:00Z`, "UTC")} · {countLabel(paxTotal, PASSENGER_FORMS)} ·{" "}
          {CABIN_LABELS[search.cabinClass].toLowerCase()}
        </p>
      </div>

      {offers.length === 0 ? (
        <EmptyState title="На цю дату рейсів не знайдено">
          <p>Спробуйте іншу дату, інший клас обслуговування або сусідній аеропорт.</p>
          {nearby.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {nearby.map((date) => (
                <Link key={date} href={`/search?${searchQuery({ ...search, date })}`} className="btn btn-secondary">
                  {formatDate(`${date}T12:00:00Z`, "UTC")}
                </Link>
              ))}
            </div>
          )}
        </EmptyState>
      ) : (
        <SearchResults key={searchQuery(search)} offers={offers} paxQuery={passengerQuery(search)} paxTotal={paxTotal} />
      )}
    </div>
  );
}
