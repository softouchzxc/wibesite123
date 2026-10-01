import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Сторінку не знайдено</h1>
        <p className="mt-2 text-sm text-slate-600">Можливо, посилання застаріло або сторінку було переміщено.</p>
        <Link href="/" className="btn btn-primary mt-6">
          На головну
        </Link>
      </div>
    </main>
  );
}
