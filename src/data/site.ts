// Загальні дані закладу. ПОШТА Й СОЦМЕРЕЖІ — ЗАГЛУШКИ: замініть на справжні.

import { CITIES } from "./locations";

export const SITE = {
  name: "Хмеля Шава",
  slogan: "Шаурма, по яку повертаються",
  // Кількість міст рахується зі списку в locations.ts, тож після додавання міста тексти оновлюються самі.
  description: `Мережа шаурми «Хмеля Шава»: соковита шава, щедрі порції та фірмові соуси у ${CITIES.length} містах України.`,
  phone: "+380 66 666 38 66",
  email: "hello@example.com",
  instagram: "https://instagram.com/",
  // Спільний графік показується на сторінці точок, якщо для точки не вказано власний.
  defaultHours: "Щодня 09:00–23:00" as string | null,
};

export const NAV = [
  { href: "/", label: "Головна" },
  { href: "/menu", label: "Меню" },
  { href: "/locations", label: "Наші точки" },
];
