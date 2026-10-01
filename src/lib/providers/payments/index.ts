import "server-only";
import { DemoPaymentProvider } from "./demo";
import type { PaymentProvider } from "./types";

export type * from "./types";

// Реальні платіжні сервіси додаються сюди й вибираються через PAYMENT_PROVIDER.
const providers: Record<string, () => PaymentProvider> = {
  demo: () => new DemoPaymentProvider(),
};

let instance: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (!instance) {
    const name = process.env.PAYMENT_PROVIDER || "demo";
    const create = providers[name];
    if (!create) throw new Error(`Невідомий платіжний сервіс: ${name}`);
    instance = create();
  }
  return instance;
}
