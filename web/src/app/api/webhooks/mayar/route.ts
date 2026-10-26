import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { fetchTransaction, mayarSimulated } from "@/lib/mayar";
import { settleOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

const ok = () => NextResponse.json({ received: true });

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Bentuk payload disesuaikan dengan Mayar; hanya field yang dibutuhkan yang divalidasi.
const payload = z.object({
  event:z.string().max(80).optional(),
  orderId: z.string().min(1).max(64).optional(),
  data: z.object({ id: z.string().optional(), extraData: z.object({ orderId: z.string().optional() }).partial().optional() }).partial().optional(),
  simulate: z.object({ orderId: z.string().min(1).max(64) }).optional(),
});

/** PRD 10.2: rate limit -> token -> skema -> verifikasi ulang ke Mayar -> transaksi idempoten -> balasan generik. */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!(await rateLimit(`wh:${ip}`, 60, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const token = process.env.MAYAR_WEBHOOK_TOKEN;
  const given = req.headers.get("x-webhook-token") ?? new URL(req.url).searchParams.get("token") ?? "";
  if (!token || !same(given, token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const parsed = payload.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const p = parsed.data;
  if(p.event && p.event!=="payment.received")return ok();
  const orderId = p.simulate?.orderId ?? p.orderId ?? p.data?.extraData?.orderId;
  if (!orderId) return ok();

  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return ok();

    let paidAmount: number | null = null;
    if (mayarSimulated()) {
      // Mode lokal: tidak ada Mayar untuk ditanya; hanya token rahasia yang boleh memicu pelunasan uji.
      if (p.simulate) paidAmount = order.amount;
    } else if (order.mayarId) {
      const tx = await fetchTransaction(order.mayarId);
      if (tx && tx.status === "PAID" && tx.currency === "IDR" && (!tx.orderId || tx.orderId === order.id)) paidAmount = tx.amount;
      else if (tx && (tx.status === "FAILED" || tx.status === "EXPIRED") && order.status === "PENDING") {
        await db.order.update({ where: { id: order.id }, data: { status: tx.status } });
      }
    }
    if (paidAmount !== null) {
      const r = await settleOrder(order.id, paidAmount);
      if (r === "amount_mismatch" || r === "cancelled") console.warn(`[webhook] order ${order.id}: ${r}`);
    }
  } catch (e) {
    console.error("[webhook] gagal memproses", e);
    return NextResponse.json({error:"processing_failed"},{status:503});
  }
  return ok(); // detail hanya di log; respons selalu generik
}
