import "server-only";
import { cache } from "react";
import { db } from "./db";

export type Settings = {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  /** Сервісний збір агенції, % від вартості перельоту. */
  serviceFeePercent: number;
  /** Фіксована частина сервісного збору на замовлення, копійки. */
  serviceFeeFixed: number;
  /** Знижка на дитячий квиток, %. */
  childDiscountPercent: number;
  /** Знижка на квиток немовляти без місця, %. */
  infantDiscountPercent: number;
  /** Показувати попередження про демонстраційний режим. */
  demoBanner: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  siteName: "Крила",
  supportEmail: "support@example.com",
  supportPhone: "+380 00 000 00 00",
  serviceFeePercent: 3,
  serviceFeeFixed: 0,
  childDiscountPercent: 25,
  infantDiscountPercent: 90,
  demoBanner: true,
};

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: keyof Settings) => {
    const raw = stored.get(key);
    const value = raw === undefined ? NaN : Number(raw);
    return Number.isFinite(value) ? value : (DEFAULT_SETTINGS[key] as number);
  };
  return {
    siteName: stored.get("siteName") || DEFAULT_SETTINGS.siteName,
    supportEmail: stored.get("supportEmail") || DEFAULT_SETTINGS.supportEmail,
    supportPhone: stored.get("supportPhone") || DEFAULT_SETTINGS.supportPhone,
    serviceFeePercent: num("serviceFeePercent"),
    serviceFeeFixed: num("serviceFeeFixed"),
    childDiscountPercent: num("childDiscountPercent"),
    infantDiscountPercent: num("infantDiscountPercent"),
    demoBanner: (stored.get("demoBanner") ?? String(DEFAULT_SETTINGS.demoBanner)) === "true",
  };
});

export async function saveSettings(values: Settings) {
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  );
}
