import type { Metadata } from "next";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { CITIES, routeUrl } from "@/data/locations";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Наші точки",
  description: `Де знайти «${SITE.name}»: ${CITIES.map((city) => city.name).join(", ")}.`,
};

export default function LocationsPage() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-page py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fire-400">Наші точки</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">
            «{SITE.name}» у {CITIES.length} містах
          </h1>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Міста">
            {CITIES.map((city) => (
              <a
                key={city.slug}
                href={`#${city.slug}`}
                className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-fire-500 hover:text-ink"
              >
                {city.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city, i) => (
            // Відступ під липку шапку після переходу за якорем задає scroll-padding-top у globals.css.
            <li key={city.slug} id={city.slug} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-extrabold">{city.name}</h2>
                  <p className="text-sm text-ink/60">{city.region}</p>
                </div>
                <span className="font-display text-sm font-extrabold text-fire-500">{String(i + 1).padStart(2, "0")}</span>
              </div>

              <ul className="mt-5 space-y-5">
                {city.points.map((point, index) => {
                  const route = routeUrl(city, point);
                  const hours = point.hours ?? SITE.defaultHours;
                  return (
                    <li key={index} className="space-y-2.5 border-t border-dashed border-sand pt-4 text-sm">
                      {point.name && <p className="font-bold">{point.name}</p>}
                      <p className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-fire-500" aria-hidden />
                        {point.address ?? <span className="text-ink/50">Адресу скоро додамо</span>}
                      </p>
                      <p className="flex items-start gap-2.5">
                        <Clock className="mt-0.5 size-4 shrink-0 text-fire-500" aria-hidden />
                        {hours ?? <span className="text-ink/50">Графік роботи уточнюється</span>}
                      </p>
                      {point.phone && (
                        <p className="flex items-start gap-2.5">
                          <Phone className="mt-0.5 size-4 shrink-0 text-fire-500" aria-hidden />
                          <a href={`tel:${point.phone.replace(/[^\d+]/g, "")}`} className="font-semibold hover:text-fire-600">
                            {point.phone}
                          </a>
                        </p>
                      )}
                      {route && (
                        <a href={route} target="_blank" rel="noreferrer" className="btn btn-dark mt-2 px-5 py-3 text-xs">
                          <Navigation className="size-3.5" aria-hidden />
                          Прокласти маршрут
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-3xl bg-sand/70 p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold">Не знайшли своє місто?</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Напишіть або зателефонуйте — підкажемо найближчу точку та розповімо, де відкриваємося далі.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="btn btn-dark">
              <Phone className="size-4" aria-hidden />
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="btn bg-white text-ink ring-1 ring-inset ring-sand hover:bg-cream">
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
