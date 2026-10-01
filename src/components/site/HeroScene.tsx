import Image from "next/image";
import heroPlane from "../../../public/hero-plane.jpg";

// Фон головної сторінки: фото літака в небі, яке повільно наближається й пливе,
// та легкий серпанок хмар поверх. Анімація — на CSS (блок «Анімація головної» в globals.css).
// Фото: Mark Olsen, Unsplash (ліцензія Unsplash); бортовий номер і позначку на кілі заретушовано.

const HAZE = [
  { top: "-10%", width: "55%", height: "60%", opacity: 0.22, duration: 60, delay: -20 },
  { top: "35%", width: "40%", height: "45%", opacity: 0.16, duration: 85, delay: -55 },
  { top: "55%", width: "70%", height: "60%", opacity: 0.12, duration: 110, delay: -80 },
];

/** Розміщується першим елементом у секції з `relative overflow-hidden`. */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/*
        На вузьких екранах фото займає нижню частину блоку й плавно зникає догори: літак
        цілком видно під текстом. На широких — заповнює блок, літак праворуч від тексту.
      */}
      <div className="hero-photo absolute inset-x-0 bottom-0 h-[86%] [mask-image:linear-gradient(to_bottom,transparent,black_30%)] lg:h-full lg:[mask-image:none]">
        <Image
          src={heroPlane}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1024px) 100vw, 300vw"
          className="object-cover object-[83%_50%] lg:object-[50%_100%]"
        />
      </div>

      {HAZE.map((haze, i) => (
        <div
          key={i}
          className="hero-haze absolute left-0 rounded-full"
          style={
            {
              top: haze.top,
              width: haze.width,
              height: haze.height,
              opacity: haze.opacity,
              animationDuration: `${haze.duration}s`,
              animationDelay: `${haze.delay}s`,
              // Позиція серпанку, коли анімації вимкнено в системі.
              "--i": i,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Затемнення під текстом, щоб білі літери читалися на небі. */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-900/55 to-brand-900/10 lg:bg-gradient-to-r lg:via-brand-900/45 lg:to-transparent" />
    </div>
  );
}
