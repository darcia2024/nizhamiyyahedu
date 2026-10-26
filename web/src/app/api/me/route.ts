import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  return NextResponse.json({ user: u ? { name: u.name, role: u.role } : null }, { headers: { "Cache-Control": "no-store" } });
}
