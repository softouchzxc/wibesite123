"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CATEGORIES, MENU, type CategoryId } from "@/data/menu";
import { MenuCard } from "./MenuCard";

// На телефоні рядок категорій гортається вбік: ставимо вибрану кнопку по центру.
function centerTab(button: HTMLElement, behavior: ScrollBehavior) {
  const row = button.parentElement;
  row?.scrollTo({ left: button.offsetLeft - (row.clientWidth - button.offsetWidth) / 2, behavior });
}

/**
 * Меню з перемикачем категорій. «Усе» показує категорії одна за одною.
 * initial — категорія, відкрита одразу (перехід із картки на головній: /menu?c=burgers).
 */
export function MenuBrowser({ initial = "all" }: { initial?: CategoryId | "all" }) {
  const [active, setActive] = useState<CategoryId | "all">(initial);
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = CATEGORIES.filter((category) => active === "all" || category.id === active);

  // Якщо сторінку відкрито одразу на категорії, її кнопка може бути за краєм екрана.
  useEffect(() => {
    const pressed = rootRef.current?.querySelector<HTMLElement>("button[aria-pressed=true]");
    if (pressed) centerTab(pressed, "instant");
  }, []);

  function select(id: CategoryId | "all", button: HTMLButtonElement) {
    setActive(id);
    centerTab(button, "smooth");
    // Після вибору категорії список коротшає. Якщо людина вже прогорнула вниз, повертаємо її
    // до початку списку — інакше вона опиниться посеред підвалу сайту.
    requestAnimationFrame(() => {
      const root = rootRef.current;
      if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }

  const tab = (id: CategoryId | "all", label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={active === id}
      className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${
        active === id ? "bg-ink text-cream" : "bg-white text-ink ring-1 ring-inset ring-sand hover:bg-sand"
      }`}
      onClick={(event) => select(id, event.currentTarget)}
    >
      {label}
    </button>
  );

  return (
    <div ref={rootRef}>
      <div className="sticky top-16 z-30 -mx-4 bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative flex gap-2 overflow-x-auto pb-1">
          {tab("all", "Усе")}
          {CATEGORIES.map((category) => tab(category.id, category.label))}
        </div>
      </div>

      <div className="mt-6 space-y-12">
        {visible.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="relative h-36 overflow-hidden rounded-3xl bg-ink sm:h-48">
              <Image
                src={category.photo}
                alt=""
                fill
                sizes="(min-width: 1152px) 1104px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />
              <h2
                id={`cat-${category.id}`}
                className="absolute bottom-5 left-6 font-display text-2xl font-extrabold text-white sm:text-4xl"
              >
                {category.label}
              </h2>
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {MENU.filter((item) => item.category === category.id).map((item) => (
                <li key={item.id}>
                  <MenuCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
