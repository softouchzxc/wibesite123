import Link from "next/link";
import { AtSign, Clock, Mail, Phone } from "lucide-react";
import { CITIES } from "@/data/locations";
import { NAV, SITE } from "@/data/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.4fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm">{SITE.description}</p>
        </div>

        <nav className="flex flex-col text-sm">
          <p className="mb-2 font-bold text-white">Сайт</p>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="py-2 hover:text-fire-400">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm">
          <p className="mb-3 font-bold text-white">Міста</p>
          <ul className="grid grid-cols-2 gap-x-4">
            {CITIES.map((city) => (
              <li key={city.slug}>
                <Link href={`/locations#${city.slug}`} className="block py-2 hover:text-fire-400">
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col text-sm">
          <p className="mb-2 font-bold text-white">Контакти</p>
          {SITE.defaultHours && (
            <p className="flex items-center gap-2 py-2">
              <Clock className="size-4" aria-hidden />
              {SITE.defaultHours}
            </p>
          )}
          <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 py-2 hover:text-fire-400">
            <Phone className="size-4" aria-hidden />
            {SITE.phone}
          </a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 py-2 hover:text-fire-400">
            <Mail className="size-4" aria-hidden />
            {SITE.email}
          </a>
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 hover:text-fire-400">
            <AtSign className="size-4" aria-hidden />
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {SITE.name}. Смачного!
      </div>
    </footer>
  );
}
