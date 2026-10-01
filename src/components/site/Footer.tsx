import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const settings = await getSettings();
  return (
    <footer className="no-print mt-auto border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="text-base font-extrabold text-brand-800">{settings.siteName}</p>
          <p className="mt-2 text-slate-600">Пошук і бронювання авіаквитків онлайн.</p>
        </div>
        <nav className="flex flex-col gap-2">
          <p className="font-semibold text-slate-900">Навігація</p>
          <Link href="/" className="text-slate-600 hover:text-brand-700">
            Пошук авіаквитків
          </Link>
          <Link href="/cabinet/bookings" className="text-slate-600 hover:text-brand-700">
            Мої бронювання
          </Link>
          <Link href="/support" className="text-slate-600 hover:text-brand-700">
            Підтримка та запитання
          </Link>
        </nav>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-slate-900">Контакти</p>
          <a href={`mailto:${settings.supportEmail}`} className="text-slate-600 hover:text-brand-700">
            {settings.supportEmail}
          </a>
          <span className="text-slate-600">{settings.supportPhone}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {settings.siteName}. Усі права захищено.
      </div>
    </footer>
  );
}
