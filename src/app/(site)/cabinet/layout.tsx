import { NavLink } from "@/components/NavLink";

const TABS = [
  { href: "/cabinet", label: "Профіль", exact: true },
  { href: "/cabinet/bookings", label: "Мої бронювання", exact: false },
];

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Особистий кабінет</h1>
      <nav className="no-print mt-4 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.href}
            href={tab.href}
            exact={tab.exact}
            className="-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
            activeClassName="!border-brand-600 !text-brand-700"
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
