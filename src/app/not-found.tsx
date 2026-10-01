import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-fire-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Цю сторінку вже з&apos;їли</h1>
      <p className="mt-2 text-ink/70">Можливо, посилання застаріло. Зате меню на місці.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-dark">
          На головну
        </Link>
        <Link href="/menu" className="btn btn-fire">
          Дивитися меню
        </Link>
      </div>
    </div>
  );
}
