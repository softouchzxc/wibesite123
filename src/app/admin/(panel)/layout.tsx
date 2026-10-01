import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plane,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Tags,
  Users,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { NavLink } from "@/components/NavLink";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { can, type Permission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: { default: "Адмін-панель", template: "%s — Адмін-панель" },
  robots: { index: false, follow: false },
};

const NAV: { href: string; label: string; permission: Permission; Icon: typeof Plane; exact?: boolean }[] = [
  { href: "/admin", label: "Огляд", permission: "dashboard.view", Icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Замовлення", permission: "orders.view", Icon: ShoppingCart },
  { href: "/admin/bookings", label: "Бронювання", permission: "bookings.view", Icon: CalendarCheck },
  { href: "/admin/customers", label: "Клієнти", permission: "customers.view", Icon: Users },
  { href: "/admin/payments", label: "Платежі", permission: "payments.view", Icon: CreditCard },
  { href: "/admin/flights", label: "Рейси", permission: "flights.view", Icon: Plane },
  { href: "/admin/airlines", label: "Авіакомпанії", permission: "airlines.view", Icon: Building2 },
  { href: "/admin/airports", label: "Аеропорти", permission: "airports.view", Icon: MapPin },
  { href: "/admin/tariffs", label: "Тарифи та послуги", permission: "tariffs.view", Icon: Tags },
  { href: "/admin/promocodes", label: "Промокоди", permission: "promocodes.view", Icon: Tag },
  { href: "/admin/admins", label: "Адміністратори", permission: "admins.manage", Icon: ShieldCheck },
  { href: "/admin/settings", label: "Налаштування", permission: "settings.manage", Icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Меню показує лише дозволені розділи; сам доступ перевіряє кожна сторінка й кожна дія.
  const user = await requireStaff("dashboard.view");
  const items = NAV.filter((item) => can(user.role, item.permission));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <aside className="bg-slate-900 text-slate-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2 text-base font-extrabold text-white">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-500">
              <Plane className="size-4 -rotate-45" aria-hidden />
            </span>
            Крила · Адмін
          </Link>
          <form action={logout} className="lg:hidden">
            <button type="submit" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Вийти">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pb-0">
          {items.map(({ href, label, Icon, exact }) => (
            <NavLink
              key={href}
              href={href}
              exact={exact}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white"
              activeClassName="bg-brand-600 text-white hover:bg-brand-600"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-slate-800 p-4 lg:block">
          <p className="truncate text-sm font-semibold text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <ExternalLink className="size-3.5" aria-hidden />
              На сайт
            </Link>
            <form action={logout} className="ml-auto">
              <button type="submit" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                <LogOut className="size-3.5" aria-hidden />
                Вийти
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
