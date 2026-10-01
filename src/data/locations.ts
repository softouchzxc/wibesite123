// Міста й точки мережі.
// АДРЕСИ — ПРИКЛАДИ ДЛЯ МАКЕТА: вулиці справжні, але номери будинків підібрані навмання,
// закладу за ними немає. Перед публікацією сайту замініть на справжні адреси точок.
// У місті може бути кілька точок — додавайте об'єкти в масив points.

export type Point = {
  /** Назва точки, якщо в місті їх кілька (напр. «Центр», «Вокзал»). */
  name?: string;
  /** Вулиця й номер будинку. null — адресу ще не додано. */
  address: string | null;
  /** Графік роботи, якщо він відрізняється від спільного (SITE.defaultHours). */
  hours: string | null;
  /** Телефон точки, якщо він відрізняється від спільного. */
  phone: string | null;
};

export type City = {
  slug: string;
  name: string;
  /** Місцевий відмінок із прийменником: «у Львові». */
  inCity: string;
  region: string;
  points: Point[];
};

const point = (address: string): Point => ({ address, hours: null, phone: null });

export const CITIES: City[] = [
  {
    slug: "lutsk",
    name: "Луцьк",
    inCity: "у Луцьку",
    region: "Волинська область",
    points: [point("вул. Лесі Українки, 24")],
  },
  {
    slug: "lviv",
    name: "Львів",
    inCity: "у Львові",
    region: "Львівська область",
    points: [point("вул. Городоцька, 82")],
  },
  {
    slug: "kyiv",
    name: "Київ",
    inCity: "у Києві",
    region: "Столиця",
    points: [point("вул. Саксаганського, 41")],
  },
  {
    slug: "odesa",
    name: "Одеса",
    inCity: "в Одесі",
    region: "Одеська область",
    points: [point("вул. Преображенська, 34")],
  },
  {
    slug: "kharkiv",
    name: "Харків",
    inCity: "у Харкові",
    region: "Харківська область",
    points: [point("просп. Науки, 12")],
  },
  {
    slug: "dnipro",
    name: "Дніпро",
    inCity: "у Дніпрі",
    region: "Дніпропетровська область",
    points: [point("просп. Дмитра Яворницького, 64")],
  },
  {
    slug: "vinnytsia",
    name: "Вінниця",
    inCity: "у Вінниці",
    region: "Вінницька область",
    points: [point("вул. Соборна, 52")],
  },
  {
    slug: "ivano-frankivsk",
    name: "Івано-Франківськ",
    inCity: "в Івано-Франківську",
    region: "Івано-Франківська область",
    points: [point("вул. Незалежності, 31")],
  },
  {
    slug: "khmelnytskyi",
    name: "Хмельницький",
    inCity: "у Хмельницькому",
    region: "Хмельницька область",
    points: [point("вул. Проскурівська, 44")],
  },
  {
    slug: "zaporizhzhia",
    name: "Запоріжжя",
    inCity: "у Запоріжжі",
    region: "Запорізька область",
    points: [point("просп. Соборний, 150")],
  },
];

/** Посилання на маршрут у Google Картах для точки з адресою. */
export function routeUrl(city: City, point: Point): string | null {
  if (!point.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city.name}, ${point.address}`)}`;
}
