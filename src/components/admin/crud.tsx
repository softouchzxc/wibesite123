import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import type { FormState } from "@/lib/form";

export function AddButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="btn btn-primary">
      <Plus className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

/** Кнопки «редагувати» та «видалити» в рядку таблиці. */
export function RowActions({
  editHref,
  deleteAction,
  id,
  confirm,
}: {
  editHref: string;
  deleteAction?: (formData: FormData) => Promise<void>;
  id: string;
  confirm: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={editHref} className="btn btn-ghost btn-sm px-2" aria-label="Редагувати" title="Редагувати">
        <Pencil className="size-4" />
      </Link>
      {deleteAction && (
        <form action={deleteAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="btn btn-ghost btn-sm px-2 text-red-600 hover:bg-red-50" confirm={confirm}>
            <Trash2 className="size-4" aria-label="Видалити" />
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

/** Сторінка створення або редагування запису довідника. */
export function EditPage({
  title,
  backHref,
  backLabel,
  action,
  id,
  children,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{title}</h1>
      <div className="card p-5 sm:p-6">
        <ActionForm
          action={action}
          submitLabel="Зберегти"
          className="space-y-5"
          footer={
            <Link href={backHref} className="btn btn-ghost">
              Скасувати
            </Link>
          }
        >
          {id && <input type="hidden" name="id" value={id} />}
          {children}
        </ActionForm>
      </div>
    </div>
  );
}
