import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { mayarSimulated } from "@/lib/mayar";
import { settleOrder } from "@/lib/orders";
import { rupiah } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth-guard";

export const metadata = { title: "Simulasi Mayar", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Halaman bayar tiruan, hanya ada saat MAYAR_API_KEY kosong (lokal). */
export default async function SimMayar({ params }: { params: Promise<{ orderId: string }> }) {
  if (!mayarSimulated() || process.env.NODE_ENV === "production") notFound();
  const { orderId } = await params;
  const user = await requireUser(`/dev/mayar/${orderId}`);
  const order = await db.order.findUnique({ where: { id: orderId }, include: { course: true } });
  if (!order || order.userId !== user.id) notFound();

  async function pay() {
    "use server";
    if (process.env.NODE_ENV === "production" || !mayarSimulated()) notFound();
    const actor = await requireUser();
    const target = await db.order.findFirst({ where: { id: orderId, userId: actor.id } });
    if (!target) notFound();
    // Memakai jalur yang sama dengan webhook, supaya yang teruji adalah logika pelunasan sebenarnya.
    await settleOrder(orderId, target.amount);
    redirect(`/dashboard/pembayaran/${orderId}`);
  }
  async function cancel() {
    "use server";
    if (process.env.NODE_ENV === "production" || !mayarSimulated()) notFound();
    const actor = await requireUser();
    await db.order.updateMany({ where: { id: orderId, userId: actor.id, status: "PENDING" }, data: { status: "FAILED" } });
    redirect(`/dashboard/pembayaran/${orderId}`);
  }

  return (
    <div className="err-page gutter">
      <div>
        <p className="eyebrow">Simulasi Mayar (lokal)</p>
        <h1>Bayar {rupiah(order.amount)}</h1>
        <p className="muted">{order.course.title} · status {order.status}</p>
        <form action={pay}><SubmitButton className="btn btn-primary" testId="sim-pay">Simulasikan pembayaran lunas</SubmitButton></form>
        <form action={cancel}><SubmitButton className="btn btn-ghost" testId="sim-fail">Simulasikan gagal</SubmitButton></form>
      </div>
    </div>
  );
}
