import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = process.env.MONITOR_TOKEN;
  const given = req.headers.get("x-monitor-token");
  if (!token || given !== token) return NextResponse.json({ status: "ok" });
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "disconnected" }, { status: 503 });
  }
}
