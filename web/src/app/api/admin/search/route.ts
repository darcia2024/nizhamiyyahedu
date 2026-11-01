import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/** Pencarian cepat untuk panel superadmin (Ctrl+K): user, kursus, dan tagihan. */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const like = { contains: q, mode: "insensitive" as const };
  const [users, courses, orders] = await Promise.all([
    db.user.findMany({ where: { OR: [{ name: like }, { email: like }] }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true } }),
    db.course.findMany({ where: { title: like }, take: 5, select: { id: true, title: true, status: true } }),
    db.order.findMany({ where: { OR: [{ mayarId: like }, { user: { email: like } }] }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, status: true, user: { select: { email: true } }, course: { select: { title: true } } } }),
  ]);
  return NextResponse.json({
    results: [
      ...users.map((u) => ({ type: "User", title: u.name ?? u.email, sub: `${u.email} · ${u.role}`, href: `/admin/pengguna/${u.id}` })),
      ...courses.map((c) => ({ type: "Kursus", title: c.title, sub: c.status === "PUBLISHED" ? "Tayang" : "Draf", href: `/admin/kursus/${c.id}` })),
      ...orders.map((o) => ({ type: "Tagihan", title: o.user.email, sub: `${o.course.title} · Rp${o.amount.toLocaleString("id-ID")} · ${o.status}`, href: `/admin/pembayaran/${o.id}` })),
    ],
  });
}
