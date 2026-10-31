import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { effectiveStatus, syncOrderWithMayar } from "@/lib/orders";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Status order milik pengguna yang sedang login, untuk pop-up pembayaran.
 * Dengan ?check=1 (dan masih PENDING) status ditanyakan ulang ke Mayar, dibatasi 12 kali per menit per pengguna.
 */
export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const { orderId } = await params;

  const find = () => db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { course: { select: { slug: true } } } });
  let order = await find();
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });

  if (order.status === "PENDING" && new URL(req.url).searchParams.get("check") === "1" && (await rateLimit(`ordchk:${user.id}`, 12, 60))) {
    try {
      await syncOrderWithMayar(order);
      order = (await find()) ?? order;
    } catch (e) {
      console.error("[orders] gagal sinkron ke Mayar", e);
    }
  }
  return NextResponse.json({ status: effectiveStatus(order), slug: order.course.slug }, { headers: noStore });
}
