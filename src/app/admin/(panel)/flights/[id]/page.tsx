import { notFound } from "next/navigation";
import { saveFlight } from "@/app/actions/admin-catalog";
import { EditPage } from "@/components/admin/crud";
import { Field } from "@/components/admin/ui";
import { Alert } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { FLIGHT_STATUS_LABELS } from "@/lib/constants";
import { toLocalInputValue } from "@/lib/datetime";
import { db } from "@/lib/db";

export default async function FlightEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("flights.manage");
  const { id } = await params;
  const [flight, airlines, airports] = await Promise.all([
    id === "new"
      ? null
      : db.flight.findUnique({
          where: { id },
          include: { origin: true, destination: true, _count: { select: { bookings: true } } },
        }),
    db.airline.findMany({ orderBy: { name: "asc" } }),
    db.airport.findMany({ orderBy: [{ city: "asc" }] }),
  ]);
  if (id !== "new" && !flight) notFound();

  const airportOptions = airports.map((a) => (
    <option key={a.id} value={a.id}>
      {a.city} ({a.code}) — {a.name}
    </option>
  ));

  return (
    <EditPage
      title={flight ? `Рейс ${flight.flightNumber}` : "Новий рейс"}
      backHref="/admin/flights"
      backLabel="Усі рейси"
      action={saveFlight}
      id={flight?.id}
    >
      {flight && flight._count.bookings > 0 && (
        <Alert tone="warning">
          На цей рейс уже є бронювання ({flight._count.bookings}). Зміна часу чи маршруту вплине на видані квитки —
          повідомте пасажирів.
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Авіакомпанія">
          <select name="airlineId" className="input" defaultValue={flight?.airlineId ?? ""} required>
            <option value="" disabled>
              Оберіть
            </option>
            {airlines.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Номер рейсу" hint="Наприклад, K1 204">
          <input name="flightNumber" className="input uppercase" defaultValue={flight?.flightNumber} required />
        </Field>
        <Field label="Аеропорт вильоту">
          <select name="originId" className="input" defaultValue={flight?.originId ?? ""} required>
            <option value="" disabled>
              Оберіть
            </option>
            {airportOptions}
          </select>
        </Field>
        <Field label="Аеропорт прибуття">
          <select name="destinationId" className="input" defaultValue={flight?.destinationId ?? ""} required>
            <option value="" disabled>
              Оберіть
            </option>
            {airportOptions}
          </select>
        </Field>
        <Field label="Виліт" hint="Місцевий час аеропорту вильоту">
          <input
            type="datetime-local"
            name="departureLocal"
            className="input"
            defaultValue={flight ? toLocalInputValue(flight.departureAt, flight.origin.timezone) : ""}
            required
          />
        </Field>
        <Field label="Прибуття" hint="Місцевий час аеропорту прибуття">
          <input
            type="datetime-local"
            name="arrivalLocal"
            className="input"
            defaultValue={flight ? toLocalInputValue(flight.arrivalAt, flight.destination.timezone) : ""}
            required
          />
        </Field>
        <Field label="Кількість пересадок">
          <input name="stops" type="number" min={0} max={3} className="input" defaultValue={flight?.stops ?? 0} required />
        </Field>
        <Field label="Місто пересадки" hint="Якщо рейс із пересадкою">
          <input name="stopCity" className="input" defaultValue={flight?.stopCity ?? ""} />
        </Field>
        <Field label="Літак">
          <input name="aircraft" className="input" defaultValue={flight?.aircraft ?? ""} placeholder="Airbus A320" />
        </Field>
        <Field label="Базова ціна, ₴" hint="Дорослий, економ-клас, тариф із множником 1">
          <input
            name="basePrice"
            className="input"
            inputMode="decimal"
            defaultValue={flight ? flight.basePrice / 100 : ""}
            required
          />
        </Field>
        <Field label="Вільні місця, економ">
          <input
            name="seatsEconomy"
            type="number"
            min={0}
            className="input"
            defaultValue={flight?.seatsEconomy ?? 150}
            required
          />
        </Field>
        <Field label="Вільні місця, бізнес">
          <input
            name="seatsBusiness"
            type="number"
            min={0}
            className="input"
            defaultValue={flight?.seatsBusiness ?? 12}
            required
          />
        </Field>
        <Field label="Статус">
          <select name="status" className="input" defaultValue={flight?.status ?? "SCHEDULED"}>
            {Object.entries(FLIGHT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </EditPage>
  );
}
