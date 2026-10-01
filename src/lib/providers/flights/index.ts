import "server-only";
import { LocalFlightProvider } from "./local";
import type { FlightProvider } from "./types";

export type * from "./types";

// Нові постачальники (GDS, консолідатори) додаються сюди й вибираються через FLIGHT_PROVIDER.
const providers: Record<string, () => FlightProvider> = {
  local: () => new LocalFlightProvider(),
};

let instance: FlightProvider | undefined;

export function getFlightProvider(): FlightProvider {
  if (!instance) {
    const name = process.env.FLIGHT_PROVIDER || "local";
    const create = providers[name];
    if (!create) throw new Error(`Невідомий постачальник рейсів: ${name}`);
    instance = create();
  }
  return instance;
}
