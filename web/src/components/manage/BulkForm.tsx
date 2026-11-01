"use client";
import { useActionState, useRef } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { idle, type ActionResult } from "@/lib/action";

type ActionFn = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/** Bungkus tabel dengan kotak centang `ids` dan satu bar aksi massal. Sengaja tanpa peringatan "tinggalkan halaman". */
export function BulkForm({ action, children, controls, submit, submitClass = "btn btn-primary", danger }: {
  action: ActionFn;
  children: React.ReactNode;
  controls?: React.ReactNode;
  submit: string;
  submitClass?: string;
  danger?: { action: ActionFn; label: string; confirm: string };
}) {
  const [r, formAction] = useActionState<ActionResult, FormData>((_p, fd) => action(idle, fd), idle);
  const [dangerResult, dangerAction] = useActionState<ActionResult, FormData>((_p, fd) => (danger ? danger.action(idle, fd) : Promise.resolve(idle)), idle);
  const ref = useRef<HTMLFormElement>(null);
  const boxes = () => Array.from(ref.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? []);
  return (
    <form ref={ref} action={formAction} noValidate>
      <div className="bulk-bar">
        <label className="check"><input type="checkbox" aria-label="Pilih semua di halaman ini" onChange={(e) => boxes().forEach((b) => { b.checked = e.target.checked; })} /><span>Pilih semua</span></label>
        {controls}
        <SubmitButton className={submitClass} pendingText="Memproses…">{submit}</SubmitButton>
        {danger && (
          <button type="submit" className="btn btn-danger" formAction={dangerAction} onClick={(e) => {
            const count = boxes().filter((b) => b.checked).length;
            if (count && !window.confirm(danger.confirm.replace("{n}", String(count)))) e.preventDefault();
          }}>{danger.label}</button>
        )}
      </div>
      {[r, dangerResult].map((x, i) => (
        <div key={i}>
          {!x.ok && x.error && <div className="alert err-box" role="alert">{x.error}</div>}
          {x.ok && x.message && <div className="alert ok-box" role="status">{x.message}</div>}
        </div>
      ))}
      {children}
    </form>
  );
}
