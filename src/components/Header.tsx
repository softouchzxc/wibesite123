"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, X } from "lucide-react";
import { NAV } from "@/data/site";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  // Меню відкрите лише на тій сторінці, де його відкрили: після переходу воно закривається саме.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="На головну">
          <Logo light />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive(item.href) ? "bg-white/10 text-fire-400" : "text-white/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/locations" className="btn btn-fire hidden px-5 py-2.5 md:inline-flex">
          <MapPin className="size-4" aria-hidden />
          Знайти точку
        </Link>

        <button
          type="button"
          className="rounded-full p-2.5 text-white hover:bg-white/10 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Закрити меню" : "Відкрити меню"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-ink px-4 pb-5 pt-2 md:hidden" onClick={() => setOpenOn(null)}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-3 text-base font-semibold ${
                isActive(item.href) ? "text-fire-400" : "text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/locations" className="btn btn-fire mt-3 w-full">
            <MapPin className="size-4" aria-hidden />
            Знайти точку
          </Link>
        </nav>
      )}
    </header>
  );
}
