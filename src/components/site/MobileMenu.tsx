"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** Меню для вузьких екранів. Закривається після переходу на іншу сторінку. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn btn-ghost px-2.5"
        aria-expanded={open}
        aria-label={open ? "Закрити меню" : "Відкрити меню"}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-full z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-lg"
          onClick={() => setOpenOn(null)}
        >
          <nav className="flex flex-col gap-1">{children}</nav>
        </div>
      )}
    </div>
  );
}
