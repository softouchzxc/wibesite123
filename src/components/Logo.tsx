import { SITE } from "@/data/site";

// Лусочки шишки хмелю: знизу вгору, щоб верхні перекривали нижні.
const SCALES = [
  { cx: 20, cy: 30.5, rx: 3.6, ry: 4.6 },
  { cx: 15.6, cy: 26, rx: 4.6, ry: 5.2 },
  { cx: 24.4, cy: 26, rx: 4.6, ry: 5.2 },
  { cx: 20, cy: 23.5, rx: 4.4, ry: 5.2 },
  { cx: 14.8, cy: 19, rx: 4.8, ry: 5.4 },
  { cx: 25.2, cy: 19, rx: 4.8, ry: 5.4 },
  { cx: 20, cy: 16.5, rx: 4.6, ry: 5.4 },
  { cx: 20, cy: 11.5, rx: 3.8, ry: 4.4 },
];

/** Шишка хмелю — знак закладу. */
export function HopMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="var(--color-fire-500)" />
      <path d="M20 8c.4-1.800 1.600-3 3.400-3.400" fill="none" stroke="var(--color-hop-700)" strokeWidth="1.8" strokeLinecap="round" />
      <g fill="var(--color-hop-400)" stroke="var(--color-hop-700)" strokeWidth="1.1">
        {SCALES.map((s, i) => (
          <ellipse key={i} {...s} />
        ))}
      </g>
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2.5 font-display text-base font-extrabold sm:text-lg ${light ? "text-white" : "text-ink"}`}
    >
      <HopMark />
      {SITE.name}
    </span>
  );
}
