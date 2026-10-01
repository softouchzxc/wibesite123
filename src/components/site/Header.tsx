import Link from "next/link";
import { LogOut, Plane, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { MobileMenu } from "./MobileMenu";

const NAV = [
  { href: "/", label: "Пошук квитків" },
  { href: "/cabinet/bookings", label: "Мої бронювання" },
  { href: "/support", label: "Підтримка" },
];

export async function Header() {
  const user = await getCurrentUser();
  const mobileLink = "rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100";

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-800">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Plane className="size-5 -rotate-45" aria-hidden />
          </span>
          Крила
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="btn btn-ghost">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isStaff(user) && (
                <Link href="/admin" className="btn btn-ghost">
                  Адмін-панель
                </Link>
              )}
              <Link href="/cabinet" className="btn btn-secondary">
                <UserRound className="size-4" aria-hidden />
                {user.firstName}
              </Link>
              <form action={logout}>
                <button type="submit" className="btn btn-ghost px-2.5" aria-label="Вийти" title="Вийти">
                  <LogOut className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Увійти
              </Link>
              <Link href="/register" className="btn btn-primary">
                Реєстрація
              </Link>
            </>
          )}
        </div>

        <MobileMenu>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={mobileLink}>
              {item.label}
            </Link>
          ))}
          <hr className="my-1 border-slate-200" />
          {user ? (
            <>
              <Link href="/cabinet" className={mobileLink}>
                Особистий кабінет ({user.firstName})
              </Link>
              {isStaff(user) && (
                <Link href="/admin" className={mobileLink}>
                  Адмін-панель
                </Link>
              )}
              <form action={logout}>
                <button type="submit" className={`${mobileLink} w-full text-left`}>
                  Вийти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={mobileLink}>
                Увійти
              </Link>
              <Link href="/register" className={mobileLink}>
                Реєстрація
              </Link>
            </>
          )}
        </MobileMenu>
      </div>
    </header>
  );
}
