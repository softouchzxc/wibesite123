import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { STATUS_TONES, type BadgeTone } from "@/lib/constants";

const BADGE_TONES: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  return <Badge tone={STATUS_TONES[status] ?? "gray"}>{labels[status] ?? status}</Badge>;
}

const ALERT_STYLES = {
  error: { box: "border-red-200 bg-red-50 text-red-800", Icon: AlertCircle },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
  info: { box: "border-brand-200 bg-brand-50 text-brand-900", Icon: Info },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertCircle },
};

export function Alert({
  tone = "info",
  children,
  className = "",
}: {
  tone?: keyof typeof ALERT_STYLES;
  children: ReactNode;
  className?: string;
}) {
  const { box, Icon } = ALERT_STYLES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${box} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-slate-600">{children}</div>}
    </div>
  );
}

/** Рядок «назва — значення» для карток із деталями. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}
