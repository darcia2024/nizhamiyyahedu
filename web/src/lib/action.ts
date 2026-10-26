import type { ZodError } from "zod";

/** Bentuk respons Server Action: kesalahan yang diharapkan dikembalikan, bukan di-throw (B1). */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

export function fromZod(e: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = String(issue.path[0] ?? "_");
    if (!fieldErrors[k]) fieldErrors[k] = issue.message;
  }
  const first = Object.values(fieldErrors)[0] ?? "Data tidak valid.";
  return fail(first, fieldErrors);
}

export function formObject(fd: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(fd.entries());
}

export const idle: ActionResult = { ok: true };
