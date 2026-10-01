"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/form";
import { Alert } from "./ui";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Форма із серверною дією: показує помилки, повідомлення про успіх і стан надсилання. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
  submitClassName = "btn btn-primary",
  footer,
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  submitClassName?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const fieldErrors = state?.fieldErrors ? Object.values(state.fieldErrors) : [];

  // У довгих формах повідомлення може опинитися поза екраном — прокручуємо до нього.
  const messageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.error || state?.success) messageRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  return (
    <form
      action={formAction}
      className={className}
      // React очищає форму після виконання дії з атрибута action. Щоб у разі помилки
      // користувач не втрачав введене, з JavaScript надсилаємо дані самі.
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(formData));
      }}
    >
      {(state?.error || state?.success) && (
        <div ref={messageRef}>
          {state.error ? (
            <Alert tone="error">
              <p>{state.error}</p>
              {fieldErrors.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {fieldErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </Alert>
          ) : (
            <Alert tone="success">{state.success}</Alert>
          )}
        </div>
      )}
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={submitClassName} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitLabel}
        </button>
        {footer}
      </div>
    </form>
  );
}

/** Кнопка надсилання для звичайних <form action={...}> без useActionState. */
export function SubmitButton({
  children,
  className = "btn btn-primary",
  confirm,
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  /** Текст запиту на підтвердження перед надсиланням. */
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
