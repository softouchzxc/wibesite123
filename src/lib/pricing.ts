// Розрахунок цін. Файл не має серверних залежностей: ті самі формули використовує
// і сервер (остаточна сума), і форма бронювання в браузері (попередній підсумок).

import type { PassengerType } from "./constants";

export type PricingRules = {
  serviceFeePercent: number;
  serviceFeeFixed: number;
  childDiscountPercent: number;
  infantDiscountPercent: number;
};

export type PassengerCounts = { adults: number; children: number; infants: number };

// Ціни округлюються до цілих гривень.
const roundToHryvnia = (kopecks: number) => Math.round(kopecks / 100) * 100;

export function passengerPrice(basePrice: number, multiplier: number, type: PassengerType, rules: PricingRules): number {
  const adult = basePrice * multiplier;
  const discount =
    type === "CHILD" ? rules.childDiscountPercent : type === "INFANT" ? rules.infantDiscountPercent : 0;
  return roundToHryvnia(adult * (1 - discount / 100));
}

export function fareTotal(basePrice: number, multiplier: number, pax: PassengerCounts, rules: PricingRules): number {
  return (
    pax.adults * passengerPrice(basePrice, multiplier, "ADULT", rules) +
    pax.children * passengerPrice(basePrice, multiplier, "CHILD", rules) +
    pax.infants * passengerPrice(basePrice, multiplier, "INFANT", rules)
  );
}

export function serviceFee(fare: number, rules: PricingRules): number {
  return roundToHryvnia((fare * rules.serviceFeePercent) / 100) + rules.serviceFeeFixed;
}

export type PromoRule = { discountType: string; discountValue: number; minOrderAmount: number };

/** Знижка за промокодом. Не може перевищувати суму, до якої застосовується. */
export function promoDiscount(amount: number, promo: PromoRule | null): number {
  if (!promo || amount < promo.minOrderAmount) return 0;
  const raw = promo.discountType === "PERCENT" ? roundToHryvnia((amount * promo.discountValue) / 100) : promo.discountValue;
  return Math.min(raw, amount);
}

export function orderTotals(fare: number, extras: number, rules: PricingRules, promo: PromoRule | null) {
  const fee = serviceFee(fare, rules);
  const beforeDiscount = fare + extras + fee;
  const discount = promoDiscount(beforeDiscount, promo);
  return { fareTotal: fare, extrasTotal: extras, serviceFee: fee, discount, total: beforeDiscount - discount };
}

/** Кількість місць, які займає група: немовлята летять без окремого місця. */
export function seatsNeeded(pax: PassengerCounts): number {
  return pax.adults + pax.children;
}
