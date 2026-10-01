import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, HandPlatter, MapPin, Soup, Utensils } from "lucide-react";
import { MenuCard } from "@/components/MenuCard";
import { CITIES } from "@/data/locations";
import { FEATURED, HITS, MENU } from "@/data/menu";
import { SITE } from "@/data/site";
import grillPhoto from "../../public/photos/grill.jpg";
import heroPhoto from "../../public/photos/hero.jpg";

// ТЕКСТИ ПЕРЕВАГ — ПРИКЛАД: перевірте, що вони відповідають тому, як працює заклад.
const FEATURES = [
  { Icon: Flame, title: "Готуємо при вас", text: "Збираємо кожну шаву після замовлення — гарячу, з хрустким лавашем." },
  { Icon: HandPlatter, title: "Щедрі порції", text: "М'яса не шкодуємо: наїстеся однією, а XXL вистачить і на двох." },
  { Icon: Soup, title: "Фірмові соуси", text: "Часниковий, сирний, гострий і барбекю — додайте улюблений або всі одразу." },
  { Icon: Utensils, title: "Є з чого вибрати", text: "Шаурма, хот-доги, бургери, комбо-набори, закуски та напої." },
];

/** «4 позиції», «8 позицій» — українська множина. */
function positions(n: number): string {
  const last = n % 10;
  const teen = n % 100 > 10 && n % 100 < 20;
  const word = !teen && last === 1 ? "позиція" : !teen && last >= 2 && last <= 4 ? "позиції" : "позицій";
  return `${n} ${word}`;
}

function CityMarquee() {
  // Список повторено двічі: друга половина підхоплює першу, і рядок біжить без шва.
  const cities = [...CITIES, ...CITIES];
  return (
    <div className="overflow-hidden bg-fire-500 py-3.5 text-ink" aria-hidden>
      <div className="marquee-track flex w-max">
        {cities.map((city, i) => (
          <span key={i} className="flex items-center font-display text-sm font-extrabold uppercase tracking-wide">
            <span className="px-6">{city.name}</span>
            <span className="text-ink/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="container-page relative z-10 pb-8 pt-12 sm:pt-16 lg:py-28">
          <div className="lg:max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fire-300">
              <MapPin className="size-3.5" aria-hidden />
              {CITIES.length} міст України
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              {SITE.name}
              <span className="mt-3 block text-2xl text-fire-400 sm:text-3xl">{SITE.slogan}</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/75 sm:text-lg">
              Соковите м&apos;ясо з гриля, свіжі овочі та фірмові соуси в хрусткому лаваші. Заходьте до нас у своєму
              місті.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-fire">
                Дивитися меню
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/locations" className="btn btn-light">
                <MapPin className="size-4" aria-hidden />
                Наші точки
              </Link>
            </div>
          </div>
        </div>
        {/* На телефоні фото — окремий блок під текстом, на широкому екрані — фон усього блоку. */}
        <div className="relative mx-4 mb-10 aspect-[4/3] overflow-hidden rounded-3xl sm:mx-6 lg:absolute lg:inset-0 lg:m-0 lg:aspect-auto lg:rounded-none">
          <Image
            src={heroPhoto}
            alt="Шаурма в лаваші"
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="hero-zoom object-cover lg:object-[60%_55%]"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-ink via-ink/80 to-ink/5 lg:block" />
        </div>
      </section>

      <CityMarquee />

      <section className="container-page pt-14 sm:pt-20">
        <p className="eyebrow">Меню</p>
        <h2 className="section-title mt-2">Що в нас поїсти</h2>
        {/* На телефоні картки широкі й невисокі, одна під одною; від планшета — три високі в ряд. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {FEATURED.map((category) => (
            <li key={category.id}>
              <Link
                href={`/menu?c=${category.id}`}
                className="group relative block aspect-[16/9] overflow-hidden rounded-3xl bg-ink sm:aspect-[3/4]"
              >
                <Image
                  src={category.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1152px) 360px, (min-width: 640px) 33vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-ink/45 transition group-hover:bg-ink/30" />
                <span className="absolute inset-0 grid place-items-center p-4 text-center">
                  <span>
                    <span className="block font-display text-2xl font-extrabold text-white drop-shadow-lg sm:text-3xl">
                      {category.label}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/40 backdrop-blur-sm transition group-hover:bg-fire-500 group-hover:text-ink group-hover:ring-fire-500">
                      {positions(MENU.filter((item) => item.category === category.id).length)}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Хіти меню</p>
            <h2 className="section-title mt-2">Найчастіше замовляють</h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-1.5 py-2.5 text-sm font-bold text-fire-600 hover:underline">
            Усе меню
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {/* На телефоні хіти гортаються вбік, щоб сторінка не була надто довгою; від планшета — сітка. */}
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {HITS.map((item) => (
            <li key={item.id} className="w-[78%] shrink-0 snap-center sm:w-auto">
              <MenuCard item={item} />
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-sand/60">
        <div className="container-page grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.25fr] lg:items-center lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-xl lg:aspect-[4/5]">
            <Image
              src={grillPhoto}
              alt="М'ясо на вертикальному грилі"
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Чому ми</p>
            <h2 className="section-title mt-2 max-w-xl">Шава, за яку не соромно</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
              {FEATURES.map(({ Icon, title, text }) => (
                // На телефоні іконка стоїть збоку від тексту — картка виходить удвічі нижчою.
                <li key={title} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm sm:block sm:p-6">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-fire-500 text-ink">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-extrabold sm:mt-5">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70 sm:mt-2">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <p className="eyebrow">Де нас знайти</p>
        <h2 className="section-title mt-2">Працюємо у {CITIES.length} містах</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city, i) => (
            <li key={city.slug}>
              <Link
                href={`/locations#${city.slug}`}
                className="group flex items-center gap-4 rounded-3xl border border-sand bg-white p-5 transition hover:border-fire-400 hover:shadow-md"
              >
                <span className="font-display text-sm font-extrabold text-fire-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-extrabold">{city.name}</span>
                  <span className="block truncate text-sm text-ink/60">{city.points[0]?.address ?? city.region}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-ink/30 transition group-hover:translate-x-1 group-hover:text-fire-500" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-fire-500/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-hop-500/25 blur-3xl" aria-hidden />
          <h2 className="relative font-display text-2xl font-extrabold sm:text-4xl">Зголодніли?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/75">
            Оберіть шаву до смаку та завітайте до найближчої точки «{SITE.name}».
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className="btn btn-fire">
              Обрати шаву
            </Link>
            <Link href="/locations" className="btn btn-light">
              Знайти точку
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
