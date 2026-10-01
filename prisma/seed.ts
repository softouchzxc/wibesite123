// Початкове наповнення бази: довідники, тарифи, адміністратор і ДЕМОНСТРАЦІЙНИЙ розклад.
// Рейси та авіакомпанії вигадані — це тестові дані, а не реальні пропозиції перевізників.
// Скрипт можна запускати повторно: довідники оновлюються, а рейси без бронювань
// створюються заново на наступні DAYS_AHEAD днів.

import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { zonedTimeToUtc } from "../src/lib/datetime";

const db = new PrismaClient();
const DAYS_AHEAD = 60;

// Детермінований генератор, щоб розклад був однаковим між запусками.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const airports = [
  { code: "KBP", name: "Бориспіль", city: "Київ", country: "Україна", timezone: "Europe/Kyiv", latitude: 50.345, longitude: 30.895 },
  { code: "LWO", name: "Львів ім. Данила Галицького", city: "Львів", country: "Україна", timezone: "Europe/Kyiv", latitude: 49.812, longitude: 23.956 },
  { code: "ODS", name: "Одеса", city: "Одеса", country: "Україна", timezone: "Europe/Kyiv", latitude: 46.427, longitude: 30.676 },
  { code: "WAW", name: "Варшава ім. Шопена", city: "Варшава", country: "Польща", timezone: "Europe/Warsaw", latitude: 52.166, longitude: 20.967 },
  { code: "KRK", name: "Краків-Баліце", city: "Краків", country: "Польща", timezone: "Europe/Warsaw", latitude: 50.078, longitude: 19.785 },
  { code: "BER", name: "Берлін-Бранденбург", city: "Берлін", country: "Німеччина", timezone: "Europe/Berlin", latitude: 52.362, longitude: 13.501 },
  { code: "MUC", name: "Мюнхен", city: "Мюнхен", country: "Німеччина", timezone: "Europe/Berlin", latitude: 48.354, longitude: 11.786 },
  { code: "VIE", name: "Відень-Швехат", city: "Відень", country: "Австрія", timezone: "Europe/Vienna", latitude: 48.11, longitude: 16.57 },
  { code: "PRG", name: "Прага ім. Вацлава Гавела", city: "Прага", country: "Чехія", timezone: "Europe/Prague", latitude: 50.101, longitude: 14.26 },
  { code: "CDG", name: "Шарль-де-Голль", city: "Париж", country: "Франція", timezone: "Europe/Paris", latitude: 49.01, longitude: 2.548 },
  { code: "LHR", name: "Гітроу", city: "Лондон", country: "Велика Британія", timezone: "Europe/London", latitude: 51.47, longitude: -0.454 },
  { code: "FCO", name: "Ф'юмічіно", city: "Рим", country: "Італія", timezone: "Europe/Rome", latitude: 41.8, longitude: 12.239 },
  { code: "BCN", name: "Ель-Прат", city: "Барселона", country: "Іспанія", timezone: "Europe/Madrid", latitude: 41.297, longitude: 2.078 },
  { code: "AMS", name: "Схіпгол", city: "Амстердам", country: "Нідерланди", timezone: "Europe/Amsterdam", latitude: 52.31, longitude: 4.768 },
  { code: "IST", name: "Стамбул", city: "Стамбул", country: "Туреччина", timezone: "Europe/Istanbul", latitude: 41.275, longitude: 28.752 },
];

// Вигадані перевізники для демонстрації.
const airlines = [
  { code: "K1", name: "Крила Демо", country: "Україна", commissionPercent: 2 },
  { code: "D2", name: "Дніпро Ейр Демо", country: "Україна", commissionPercent: 1.5 },
  { code: "C3", name: "Карпати Авіа Демо", country: "Україна", commissionPercent: 2.5 },
  { code: "B4", name: "Балтик Вінд Демо", country: "Польща", commissionPercent: 1 },
  { code: "S5", name: "Скайлайн Демо", country: "Німеччина", commissionPercent: 3 },
];

const tariffs = [
  { code: "ECO_LIGHT", name: "Базовий", cabinClass: "ECONOMY", priceMultiplier: 1, carryOnKg: 8, checkedBaggageKg: 0, isRefundable: false, refundFeePercent: 0, isChangeable: false, seatSelection: false, sortOrder: 1, description: "Лише ручна поклажа. Без обміну та повернення." },
  { code: "ECO_STANDARD", name: "Стандарт", cabinClass: "ECONOMY", priceMultiplier: 1.25, carryOnKg: 8, checkedBaggageKg: 23, isRefundable: false, refundFeePercent: 0, isChangeable: true, seatSelection: true, sortOrder: 2, description: "Багаж 23 кг і вибір місця. Обмін із доплатою, без повернення." },
  { code: "ECO_FLEX", name: "Гнучкий", cabinClass: "ECONOMY", priceMultiplier: 1.6, carryOnKg: 10, checkedBaggageKg: 23, isRefundable: true, refundFeePercent: 10, isChangeable: true, seatSelection: true, sortOrder: 3, description: "Багаж 23 кг, обмін і повернення з утриманням 10%." },
  { code: "BIZ_STANDARD", name: "Бізнес", cabinClass: "BUSINESS", priceMultiplier: 2.8, carryOnKg: 12, checkedBaggageKg: 32, isRefundable: false, refundFeePercent: 0, isChangeable: true, seatSelection: true, sortOrder: 4, description: "Салон бізнес-класу, багаж 32 кг, харчування. Обмін із доплатою." },
  { code: "BIZ_FLEX", name: "Бізнес Гнучкий", cabinClass: "BUSINESS", priceMultiplier: 3.5, carryOnKg: 12, checkedBaggageKg: 64, isRefundable: true, refundFeePercent: 5, isChangeable: true, seatSelection: true, sortOrder: 5, description: "Бізнес-клас, два місця багажу, обмін і повернення з утриманням 5%." },
];

const extras = [
  { code: "BAG_23", name: "Додатковий багаж 23 кг", description: "Одне додаткове місце багажу до 23 кг.", price: 150000, perPassenger: true, sortOrder: 1 },
  { code: "SEAT", name: "Вибір місця", description: "Місце біля вікна, проходу або поруч із супутниками.", price: 35000, perPassenger: true, sortOrder: 2 },
  { code: "MEAL", name: "Харчування на борту", description: "Гаряча страва та напій.", price: 45000, perPassenger: true, sortOrder: 3 },
  { code: "PRIORITY", name: "Пріоритетна посадка", description: "Посадка в літак без черги.", price: 25000, perPassenger: true, sortOrder: 4 },
  { code: "INSURANCE", name: "Страхування подорожі", description: "Медичне страхування на час поїздки.", price: 40000, perPassenger: true, sortOrder: 5 },
  { code: "SMS", name: "SMS-сповіщення про рейс", description: "Повідомлення про зміни в розкладі.", price: 5000, perPassenger: false, sortOrder: 6 },
];

const promoCodes = [
  { code: "DEMO10", description: "Знижка 10% на перше замовлення", discountType: "PERCENT", discountValue: 10, minOrderAmount: 0, maxUses: null },
  { code: "MINUS500", description: "500 ₴ знижки для замовлень від 5 000 ₴", discountType: "FIXED", discountValue: 50000, minOrderAmount: 500000, maxUses: 100 },
];

const settings: Record<string, string> = {
  siteName: "Крила",
  supportEmail: "support@example.com",
  supportPhone: "+380 00 000 00 00",
  serviceFeePercent: "3",
  serviceFeeFixed: "0",
  childDiscountPercent: "25",
  infantDiscountPercent: "90",
  demoBanner: "true",
};

const UA = ["KBP", "LWO", "ODS"];
const AIRCRAFT = ["Boeing 737-800", "Airbus A320", "Airbus A321neo", "Embraer E195"];
const HUB_CITIES = ["Варшава", "Відень", "Мюнхен", "Стамбул", "Прага"];

function distanceKm(a: (typeof airports)[number], b: (typeof airports)[number]) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

async function seedDirectories() {
  for (const a of airports) await db.airport.upsert({ where: { code: a.code }, create: a, update: a });
  for (const a of airlines) await db.airline.upsert({ where: { code: a.code }, create: a, update: { name: a.name } });
  for (const t of tariffs) await db.tariff.upsert({ where: { code: t.code }, create: t, update: {} });
  for (const e of extras) await db.extraService.upsert({ where: { code: e.code }, create: e, update: {} });
  for (const p of promoCodes) await db.promoCode.upsert({ where: { code: p.code }, create: p, update: {} });
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD не задано — адміністратора не створено.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.upsert({
    where: { email },
    create: { email, passwordHash, firstName: "Головний", lastName: "Адміністратор", role: "ADMIN" },
    update: { passwordHash, role: "ADMIN", isBlocked: false },
  });
  console.log(`Адміністратор: ${email} (пароль — у файлі .env)`);
}

async function seedFlights() {
  // Рейси з бронюваннями не чіпаємо, решту створюємо заново.
  await db.flight.deleteMany({ where: { bookings: { none: {} } } });

  const airportRows = await db.airport.findMany();
  const airlineRows = await db.airline.findMany({ where: { code: { in: airlines.map((a) => a.code) } } });
  const idByCode = new Map(airportRows.map((a) => [a.code, a.id]));
  const byCode = new Map(airports.map((a) => [a.code, a]));

  const routes: [string, string][] = [];
  for (const ua of UA) {
    for (const a of airports) {
      if (UA.includes(a.code)) continue;
      routes.push([ua, a.code], [a.code, ua]);
    }
  }
  routes.push(["KBP", "LWO"], ["LWO", "KBP"], ["KBP", "ODS"], ["ODS", "KBP"]);

  const rand = mulberry32(20260101);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const now = new Date();
  const rows: Prisma.FlightCreateManyInput[] = [];

  for (const [from, to] of routes) {
    const origin = byCode.get(from)!;
    const destination = byCode.get(to)!;
    const km = distanceKm(origin, destination);
    const directMinutes = Math.round((km / 780) * 60 + 35);
    const routeBase = 90000 + km * 170; // копійки
    const perDay = km < 700 ? 2 : 3;

    for (let day = 0; day < DAYS_AHEAD; day++) {
      const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      const weekend = [0, 5, 6].includes(date.getUTCDay());
      for (let n = 0; n < perDay; n++) {
        if (rand() < 0.15) continue; // не кожен рейс літає щодня
        const airline = pick(airlineRows);
        const stops = km < 700 ? 0 : rand() < 0.68 ? 0 : rand() < 0.85 ? 1 : 2;
        const hour = [6, 7, 9, 11, 13, 15, 17, 19, 21][Math.floor(rand() * 9)];
        const minute = pick([0, 10, 20, 30, 40, 50]);
        const durationMinutes = directMinutes + stops * (80 + Math.floor(rand() * 110));
        const departureAt = zonedTimeToUtc(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
          hour,
          minute,
          origin.timezone,
        );
        const price = routeBase * (0.8 + rand() * 0.7) * (weekend ? 1.15 : 1) * (stops ? 0.85 : 1);
        rows.push({
          flightNumber: `${airline.code} ${100 + Math.floor(rand() * 900)}`,
          airlineId: airline.id,
          originId: idByCode.get(from)!,
          destinationId: idByCode.get(to)!,
          departureAt,
          arrivalAt: new Date(departureAt.getTime() + durationMinutes * 60000),
          durationMinutes,
          stops,
          stopCity: stops
            ? HUB_CITIES.filter((c) => c !== origin.city && c !== destination.city)[Math.floor(rand() * 3)]
            : null,
          aircraft: pick(AIRCRAFT),
          basePrice: Math.round(price / 1000) * 1000,
          seatsEconomy: 20 + Math.floor(rand() * 130),
          seatsBusiness: 2 + Math.floor(rand() * 14),
        });
      }
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    await db.flight.createMany({ data: rows.slice(i, i + 500) });
  }
  console.log(`Створено демонстраційних рейсів: ${rows.length}`);
}

async function main() {
  await seedDirectories();
  await seedAdmin();
  await seedFlights();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
