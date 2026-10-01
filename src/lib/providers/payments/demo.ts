import "server-only";
import { randomBytes } from "node:crypto";
import type { PaymentIntent, PaymentProvider, PaymentResult } from "./types";

/** Тестова оплата: грошей не списує, результат платежу обирається кнопкою на сторінці оплати. */
export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";
  readonly isDemo = true;

  async createPayment(): Promise<PaymentIntent> {
    return { providerRef: `DEMO-${randomBytes(8).toString("hex").toUpperCase()}`, redirectUrl: null };
  }

  async confirmPayment(_providerRef: string, demoOutcome: "success" | "failure" = "success"): Promise<PaymentResult> {
    return demoOutcome === "success"
      ? { success: true }
      : { success: false, reason: "Платіж відхилено (імітація відмови в тестовому режимі)." };
  }

  async refund(): Promise<PaymentResult> {
    return { success: true };
  }
}
