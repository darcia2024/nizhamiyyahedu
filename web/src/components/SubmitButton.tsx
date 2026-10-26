"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText,
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  testId?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} data-testid={testId}>
      {pending && <span className="spin" aria-hidden="true" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="err" role="alert">
      <span aria-hidden="true">⚠</span> {message}
    </p>
  );
}

export function FormAlert({ state }: { state: { ok: boolean; error?: string; message?: string } }) {
  if (!state.ok && state.error) return <div className="alert err-box" role="alert">{state.error}</div>;
  if (state.ok && state.message) return <div className="alert ok-box" role="status">{state.message}</div>;
  return null;
}
