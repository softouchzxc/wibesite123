import { TAGS, formatPrice, type MenuItem } from "@/data/menu";

export function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {item.tags && item.tags.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li key={tag} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TAGS[tag].className}`}>
              {TAGS[tag].label}
            </li>
          ))}
        </ul>
      )}
      <h3 className="font-display text-lg font-extrabold leading-snug">{item.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">{item.description}</p>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-sand pt-4">
        <span className="text-sm text-ink/60">{item.size}</span>
        <span className="font-display text-xl font-extrabold text-fire-600">{formatPrice(item.price)}</span>
      </div>
    </article>
  );
}
