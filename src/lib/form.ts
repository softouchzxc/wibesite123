import type { ZodError } from "zod";

/** Стан форми, який серверна дія повертає в useActionState. */
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
} | null;

export function zodFormState(error: ZodError): NonNullable<FormState> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Перевірте правильність заповнення форми.", fieldErrors };
}

/** Рядкове значення поля форми без пробілів по краях. */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
