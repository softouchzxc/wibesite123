"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid flex-1 place-items-center px-4 py-20 text-center">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Сталася помилка</h1>
        <p className="mt-2 text-sm text-slate-600">Не вдалося завантажити сторінку. Спробуйте ще раз.</p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => reset()}>
          Спробувати ще раз
        </button>
      </div>
    </main>
  );
}
