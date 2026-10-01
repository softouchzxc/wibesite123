import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Alert } from "@/components/ui";

export const PAGE_SIZE = 20;

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Параметри списку з адреси: пошуковий рядок, фільтр і сторінка. */
export function listParams(params: RawParams) {
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);
  return {
    q: first(params.q).trim().slice(0, 100),
    status: first(params.status),
    page,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    error: first(params.error),
    saved: first(params.saved) === "1",
  };
}

export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Повідомлення після дії, передані через адресу (?saved=1 або ?error=...). */
export function ListNotices({ error, saved }: { error: string; saved: boolean }) {
  return (
    <>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}
      {saved && (
        <Alert tone="success" className="mb-4">
          Зміни збережено.
        </Alert>
      )}
    </>
  );
}

export function ListFilters({
  q,
  placeholder,
  status,
  statuses,
  children,
}: {
  q: string;
  placeholder: string;
  status?: string;
  statuses?: Record<string, string>;
  children?: ReactNode;
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input type="search" name="q" defaultValue={q} placeholder={placeholder} className="input pl-9" aria-label="Пошук" />
      </div>
      {statuses && (
        <select name="status" defaultValue={status} className="input w-auto" aria-label="Статус">
          <option value="">Усі статуси</option>
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )}
      {children}
      <button type="submit" className="btn btn-secondary">
        Знайти
      </button>
    </form>
  );
}

export function TableCard({ children, empty }: { children: ReactNode; empty: boolean }) {
  if (empty) {
    return <div className="card px-6 py-12 text-center text-sm text-slate-500">Записів не знайдено.</div>;
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Pagination({ page, total, params }: { page: number; total: number; params: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (target: number) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `?${text}` : "?";
  };
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
      <p>
        Усього: <span className="font-semibold text-slate-900">{total}</span>
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className="btn btn-secondary btn-sm" aria-label="Попередня сторінка">
              <ChevronLeft className="size-4" />
            </Link>
          ) : null}
          <span>
            {page} з {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className="btn btn-secondary btn-sm" aria-label="Наступна сторінка">
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Поле форми з підписом. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-brand-600" />
      {label}
    </label>
  );
}
