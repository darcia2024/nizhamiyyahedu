"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { idle, type ActionResult } from "@/lib/action";

type ActionFn = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Bungkus tabel dengan kotak centang `ids` dan bar aksi massal. Sengaja tanpa peringatan "tinggalkan halaman".
 * Dikirim manual (bukan lewat action form) supaya centang dan isian tidak ikut hilang saat aksi ditolak.
 */
export function BulkForm({ action, children, controls, submit, submitClass = "btn btn-primary", danger }: {
  action: ActionFn;
  children: React.ReactNode;
  controls?: React.ReactNode;
  submit: string;
  submitClass?: string;
  danger?: { action: ActionFn; label: string; confirm: string };
}) {
  const [running, setRunning] = useState<"main" | "danger">("main");
  const [r, run, pending] = useActionState<ActionResult, FormData>((_p, fd) => (fd.get("intent") === "danger" && danger ? danger : { action }).action(idle, fd), idle);
  const ref = useRef<HTMLFormElement>(null);
  const boxes = () => Array.from(ref.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? []);

  useEffect(() => {
    if (r.ok && r.message) ref.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((b) => { b.checked = false; });
  }, [r]);

  const send = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter);
    const isDanger = fd.get("intent") === "danger";
    const count = boxes().filter((b) => b.checked).length;
    if (isDanger && danger && count && !window.confirm(danger.confirm.replace("{n}", String(count)))) return;
    setRunning(isDanger ? "danger" : "main");
    startTransition(() => run(fd));
  };

  return (
    <form ref={ref} onSubmit={send} noValidate>
      <div className="bulk-bar">
        <label className="check"><input type="checkbox" aria-label="Pilih semua di halaman ini" onChange={(e) => boxes().forEach((b) => { b.checked = e.target.checked; })} /><span>Pilih semua</span></label>
        {controls}
        <button type="submit" className={submitClass} disabled={pending} aria-busy={pending && running === "main"}>{pending && running === "main" ? "Memproses…" : submit}</button>
        {danger && <button type="submit" name="intent" value="danger" className="btn btn-danger bulk-danger" disabled={pending} aria-busy={pending && running === "danger"}>{pending && running === "danger" ? "Menghapus…" : danger.label}</button>}
      </div>
      {!r.ok && r.error && <div className="alert err-box" role="alert">{r.error}</div>}
      {r.ok && r.message && <div className="alert ok-box" role="status">{r.message}</div>}
      {children}
    </form>
  );
}
