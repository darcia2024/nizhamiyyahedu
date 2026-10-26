import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expirePendingOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !same(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const expired = await expirePendingOrders();
  return NextResponse.json({ expired });
}
