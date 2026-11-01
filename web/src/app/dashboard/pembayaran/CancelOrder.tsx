"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { idle, type ActionResult } from "@/lib/action";
import { cancelMyOrder } from "./actions";

export function CancelOrder({ orderId, courseTitle, label = "Batalkan" }: { orderId: string; courseTitle: string; label?: string }) {
  const [r, action] = useActionState<ActionResult, FormData>(cancelMyOrder, idle);
  return (
    <form action={action} style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
      onSubmit={(e) => { if (!window.confirm(`Batalkan pesanan ${courseTitle}? Tautan pembayarannya jangan dibayar lagi setelah ini.`)) e.preventDefault(); }}>
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className="btn btn-ghost sm" pendingText="Membatalkan…">{label}</SubmitButton>
      {!r.ok && r.error && <span className="err" role="alert">{r.error}</span>}
      {r.ok && r.message && <span className="small" role="status">{r.message}</span>}
    </form>
  );
}
