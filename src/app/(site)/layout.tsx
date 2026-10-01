import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      {settings.demoBanner && (
        <div className="no-print bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Демонстраційний режим: рейси й ціни тестові, оплата не списує кошти, квитки недійсні для перельоту.
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
