// Меню закладу. ПОЗИЦІЇ, ВАГА Й ЦІНИ — ПРИКЛАД: замініть на справжні.
// Щоб додати страву, допишіть об'єкт у MENU; щоб прибрати — видаліть його.

// photo — ілюстративне фото категорії з public/photos (зі стоку, не знімки конкретних страв).
// featured — категорія показується великою карткою на головній.
export const CATEGORIES = [
  { id: "shawarma", label: "Шаурма", photo: "/photos/shawarma.jpg", featured: true },
  { id: "hotdogs", label: "Хот-доги", photo: "/photos/hotdogs.jpg", featured: true },
  { id: "burgers", label: "Бургери", photo: "/photos/burgers.jpg", featured: true },
  { id: "combo", label: "Комбо", photo: "/photos/combo.jpg" },
  { id: "snacks", label: "Закуски", photo: "/photos/snacks.jpg" },
  { id: "sauces", label: "Соуси", photo: "/photos/sauces.jpg" },
  { id: "drinks", label: "Напої", photo: "/photos/drinks.jpg" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const TAGS = {
  hit: { label: "Хіт", className: "bg-fire-500 text-ink" },
  new: { label: "Новинка", className: "bg-hop-400 text-ink" },
  spicy: { label: "Гостро", className: "bg-red-600 text-white" },
  veg: { label: "Без м'яса", className: "bg-hop-700 text-white" },
} as const;

export type Tag = keyof typeof TAGS;

export type MenuItem = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  /** Вага або об'єм, як показувати на сайті. */
  size: string;
  /** Ціна в гривнях. */
  price: number;
  tags?: Tag[];
};

export const MENU: MenuItem[] = [
  {
    id: "classic",
    category: "shawarma",
    name: "Хмеля Класична",
    description: "Курка з гриля, свіжа капуста, огірок, помідор і фірмовий часниковий соус у хрусткому лаваші.",
    size: "350 г",
    price: 139,
    tags: ["hit"],
  },
  {
    id: "cheese",
    category: "shawarma",
    name: "Сирна Шава",
    description: "Курка, подвійна порція сиру, помідор, огірок і ніжний сирний соус.",
    size: "370 г",
    price: 159,
    tags: ["hit"],
  },
  {
    id: "spicy",
    category: "shawarma",
    name: "Гостра Шава",
    description: "Курка, халапеньйо, морква по-корейськи, свіжі овочі та гострий соус.",
    size: "350 г",
    price: 149,
    tags: ["spicy"],
  },
  {
    id: "bbq",
    category: "shawarma",
    name: "Шава BBQ",
    description: "Курка, смажена цибуля, солоний огірок, капуста і димний соус барбекю.",
    size: "360 г",
    price: 155,
    tags: ["new"],
  },
  {
    id: "veal",
    category: "shawarma",
    name: "Шава з телятиною",
    description: "Телятина з гриля, помідор, маринована цибуля, зелень і часниковий соус.",
    size: "360 г",
    price: 179,
  },
  {
    id: "xxl",
    category: "shawarma",
    name: "Шава XXL",
    description: "Подвійна порція курки, овочі та два соуси на вибір. Для тих, хто справді зголоднів.",
    size: "550 г",
    price: 199,
    tags: ["hit"],
  },
  {
    id: "plate",
    category: "shawarma",
    name: "Шава в тарілці",
    description: "Усе найкраще без лаваша: курка, картопля фрі, свіжі овочі та соус.",
    size: "400 г",
    price: 169,
  },
  {
    id: "veggie",
    category: "shawarma",
    name: "Шава з фалафелем",
    description: "Хрусткий фалафель, хумус, свіжі овочі та зелень у лаваші.",
    size: "330 г",
    price: 129,
    tags: ["veg"],
  },

  {
    id: "hotdog-classic",
    category: "hotdogs",
    name: "Хот-дог Класичний",
    description: "Сосиска з гриля, гірчиця, кетчуп і хрустка цибуля в теплій булочці.",
    size: "180 г",
    price: 89,
    tags: ["hit"],
  },
  {
    id: "hotdog-cheese",
    category: "hotdogs",
    name: "Сирний Дог",
    description: "Сосиска з гриля, сирний соус, чедер і солоний огірок.",
    size: "200 г",
    price: 105,
  },
  {
    id: "hotdog-spicy",
    category: "hotdogs",
    name: "Гострий Дог",
    description: "Мисливська ковбаска, халапеньйо, цибуля фрі та гострий соус.",
    size: "200 г",
    price: 109,
    tags: ["spicy"],
  },
  {
    id: "hotdog-french",
    category: "hotdogs",
    name: "Французький хот-дог",
    description: "Сосиска в хрусткому багеті з соусом на вибір.",
    size: "170 г",
    price: 85,
  },

  {
    id: "burger-hmelya",
    category: "burgers",
    name: "Хмеля Бургер",
    description: "Яловича котлета, чедер, помідор, салат, маринована цибуля та фірмовий соус.",
    size: "300 г",
    price: 189,
    tags: ["hit"],
  },
  {
    id: "burger-cheese",
    category: "burgers",
    name: "Чизбургер",
    description: "Яловича котлета, подвійний чедер, солоний огірок, кетчуп і гірчиця.",
    size: "260 г",
    price: 169,
  },
  {
    id: "burger-chicken",
    category: "burgers",
    name: "Чікен Бургер",
    description: "Хрустке куряче філе, салат, помідор і часниковий соус.",
    size: "280 г",
    price: 159,
  },
  {
    id: "burger-bbq",
    category: "burgers",
    name: "Бургер BBQ",
    description: "Яловича котлета, бекон, цибуля фрі, чедер і димний соус барбекю.",
    size: "320 г",
    price: 199,
    tags: ["new"],
  },

  {
    id: "combo-classic",
    category: "combo",
    name: "Комбо Класика",
    description: "Хмеля Класична, картопля фрі та напій на вибір.",
    size: "набір",
    price: 229,
    tags: ["hit"],
  },
  {
    id: "combo-xxl",
    category: "combo",
    name: "Комбо XXL",
    description: "Шава XXL, картопля по-селянськи, соус і напій на вибір.",
    size: "набір",
    price: 299,
  },
  {
    id: "combo-duo",
    category: "combo",
    name: "Комбо на двох",
    description: "Дві шави на вибір, велика картопля фрі, два соуси та два напої.",
    size: "набір",
    price: 439,
  },

  {
    id: "fries",
    category: "snacks",
    name: "Картопля фрі",
    description: "Золотиста та хрустка, із сіллю.",
    size: "150 г",
    price: 69,
  },
  {
    id: "wedges",
    category: "snacks",
    name: "Картопля по-селянськи",
    description: "Скибочки зі шкіркою та спеціями.",
    size: "150 г",
    price: 75,
  },
  {
    id: "nuggets",
    category: "snacks",
    name: "Нагетси",
    description: "Курячі нагетси в хрусткій паніровці.",
    size: "6 шт",
    price: 95,
  },
  {
    id: "cheese-sticks",
    category: "snacks",
    name: "Сирні палички",
    description: "Тягучий сир у хрусткій скоринці.",
    size: "5 шт",
    price: 99,
  },
  {
    id: "falafel",
    category: "snacks",
    name: "Фалафель",
    description: "Кульки з нуту зі спеціями та зеленню.",
    size: "6 шт",
    price: 89,
    tags: ["veg"],
  },

  { id: "sauce-garlic", category: "sauces", name: "Часниковий", description: "Фірмовий, ніжний.", size: "40 г", price: 25 },
  { id: "sauce-cheese", category: "sauces", name: "Сирний", description: "Густий і вершковий.", size: "40 г", price: 25 },
  { id: "sauce-hot", category: "sauces", name: "Гострий", description: "Для сміливих.", size: "40 г", price: 25, tags: ["spicy"] },
  { id: "sauce-bbq", category: "sauces", name: "Барбекю", description: "Солодкуватий, з димком.", size: "40 г", price: 25 },

  { id: "uzvar", category: "drinks", name: "Узвар", description: "Домашній, із сухофруктів.", size: "0,4 л", price: 45 },
  { id: "lemonade", category: "drinks", name: "Лимонад", description: "Лимон і м'ята.", size: "0,4 л", price: 55 },
  { id: "ayran", category: "drinks", name: "Айран", description: "Освіжає після гострого.", size: "0,3 л", price: 45 },
  { id: "coffee", category: "drinks", name: "Кава американо", description: "Свіжозварена.", size: "0,25 л", price: 45 },
  { id: "water", category: "drinks", name: "Вода", description: "Газована або негазована.", size: "0,5 л", price: 30 },
];

export const HITS = MENU.filter((item) => item.category === "shawarma" && item.tags?.includes("hit")).concat(
  MENU.filter((item) => item.id === "combo-classic"),
);

export const FEATURED = CATEGORIES.filter((category) => "featured" in category);

export function isCategoryId(value: unknown): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export function formatPrice(price: number): string {
  return `${price} ₴`;
}
