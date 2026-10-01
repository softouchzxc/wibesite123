import type { Metadata } from "next";
import { MenuBrowser } from "@/components/MenuBrowser";
import { isCategoryId } from "@/data/menu";

export const metadata: Metadata = {
  title: "Меню",
  description: "Шаурма, хот-доги, бургери, комбо-набори, закуски, соуси та напої з цінами.",
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Картки категорій на головній ведуть сюди з параметром: /menu?c=burgers.
  const { c } = await searchParams;
  const initial = isCategoryId(c) ? c : "all";

  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-page py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fire-400">Меню</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">Обирайте свою шаву</h1>
          <p className="mt-3 max-w-xl text-white/75">
            Шаурма, хот-доги, бургери, комбо-набори, закуски, соуси та напої. Перемикайте категорії, щоб швидше знайти потрібне.
          </p>
        </div>
      </section>

      <div className="container-page pb-16 pt-2 sm:pb-24">
        <MenuBrowser key={initial} initial={initial} />
        <p className="mt-10 text-sm text-ink/60">
          Вага страв указана в готовому вигляді. Про алергени запитуйте в працівників закладу.
        </p>
      </div>
    </>
  );
}
