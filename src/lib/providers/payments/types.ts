// Контракт платіжного сервісу. Щоб підключити реальний еквайринг, потрібна ще одна
// реалізація PaymentProvider, зареєстрована в ./index.ts. Дані карток сайт не приймає
// і не зберігає: реальний постачальник має вести покупця на власну платіжну сторінку.

export type PaymentIntent = {
  /** Ідентифікатор платежу на боці постачальника. */
  providerRef: string;
  /** Адреса платіжної сторінки постачальника; null, якщо оплата підтверджується на сайті. */
  redirectUrl: string | null;
};

export type CreatePaymentInput = {
  orderNumber: string;
  amount: number; // копійки
  currency: string;
  description: string;
  returnUrl: string;
};

export type PaymentResult = { success: true } | { success: false; reason: string };

export interface PaymentProvider {
  readonly name: string;
  /** true — тестовий режим: кошти не списуються, результат обирає користувач. */
  readonly isDemo: boolean;
  createPayment(input: CreatePaymentInput): Promise<PaymentIntent>;
  /** Перевіряє, чи платіж справді пройшов. */
  confirmPayment(providerRef: string, demoOutcome?: "success" | "failure"): Promise<PaymentResult>;
  refund(providerRef: string, amount: number): Promise<PaymentResult>;
}
