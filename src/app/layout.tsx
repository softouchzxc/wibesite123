import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CITIES } from "@/data/locations";
import { SITE } from "@/data/site";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], display: "swap" });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — шаурма у ${CITIES.length} містах України`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1410",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" data-scroll-behavior="smooth" className={`${onest.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
