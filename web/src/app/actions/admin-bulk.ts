"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, type ActionResult } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth-guard";
import { fetchTransaction, mayarSimulated } from "@/lib/mayar";
import { settleOrder } from "@/lib/orders";
import { unlockedCourseIds } from "@/lib/bundle";

const MAX_BULK = 100;

export type SearchHit = { type: string; title: string; sub: string; href: string };

/** Pencarian cepat panel admin (Ctrl+K): user, kursus, dan tagihan. */
export async function adminSearch(q: string): Promise<SearchHit[]> {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") return [];
  const term = q.trim().slice(0, 80);
  if (term.length < 2) return [];
  const like = { contains: term, mode: "insensitive" as const };
  const [users, courses, orders] = await Promise.all([
    db.user.findMany({ where: { OR: [{ name: like }, { email: like }] }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true } }),
    db.course.findMany({ where: { title: like }, take: 5, select: { id: true, title: true, status: true } }),
    db.order.findMany({ where: { OR: [{ mayarId: like }, { user: { email: like } }] }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, status: true, user: { select: { email: true } }, course: { select: { title: true } } } }),
  ]);
  return [
    ...users.map((u) => ({ type: "User", title: u.name ?? u.email, sub: `${u.email} · ${u.role}`, href: `/admin/pengguna/${u.id}` })),
    ...courses.map((c) => ({ type: "Kursus", title: c.title, sub: c.status === "PUBLISHED" ? "Tayang" : "Draf", href: `/admin/kursus/${c.id}` })),
    ...orders.map((o) => ({ type: "Tagihan", title: o.user.email, sub: `${o.course.title} · Rp${o.amount.toLocaleString("id-ID")} · ${o.status}`, href: `/admin/pembayaran/${o.id}` })),
  ];
}

async function adminOnly() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}
const ids = (fd: FormData) => [...new Set(fd.getAll("ids").map(String).filter(Boolean))];

/** Buka akses satu kursus untuk banyak user sekaligus. Satu catatan audit per user. */
export async function bulkGrantAccess(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail("Hanya admin yang boleh melakukan ini.");
  const userIds = ids(fd);
  const courseId = String(fd.get("courseId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (!userIds.length) return fail("Pilih minimal satu user.");
  if (userIds.length > MAX_BULK) return fail(`Maksimal ${MAX_BULK} user sekali proses.`);
  if (!courseId) return fail("Pilih kursus.", { courseId: "Pilih kursus." });
  if (reason.length < 3) return fail("Alasan wajib diisi.", { reason: "Alasan wajib diisi." });
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true, bundleCourseIds: true } });
  if (!course) return fail("Kursus tidak ditemukan.");
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true } });
  const courseIds = unlockedCourseIds(course);
  for (const u of users) {
    for (const cid of courseIds) {
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: u.id, courseId: cid } },
        update: { status: "ACTIVE" },
        create: { userId: u.id, courseId: cid, status: "ACTIVE", source: "MANUAL" },
      });
    }
    await audit(admin, "ACCESS_GRANT", "User", u.id, { after: { courseId, bulk: true }, reason });
  }
  revalidatePath("/admin/pengguna");
  return { ok: true, message: `Akses dibuka untuk ${users.length} user.` };
}

/** Tanya Mayar untuk banyak tagihan; yang sudah lunas langsung diselesaikan. */
export async function bulkRecheckOrders(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail("Hanya admin yang boleh melakukan ini.");
  const orderIds = ids(fd);
  if (!orderIds.length) return fail("Pilih minimal satu tagihan.");
  if (orderIds.length > MAX_BULK) return fail(`Maksimal ${MAX_BULK} tagihan sekali proses.`);
  if (mayarSimulated()) return fail("Mode simulasi: tidak ada Mayar untuk ditanya.");
  const orders = await db.order.findMany({ where: { id: { in: orderIds } } });
  let settled = 0, closed = 0, unchanged = 0, failed = 0;
  for (const o of orders) {
    if (!o.mayarId || o.status !== "PENDING") { unchanged++; continue; }
    const tx = await fetchTransaction(o.mayarId);
    if (!tx) { failed++; continue; }
    if (tx.status === "PAID" && tx.currency === "IDR" && (!tx.orderId || tx.orderId === o.id)) {
      const r = await settleOrder(o.id, tx.amount);
      await audit(admin, "ORDER_RECHECK", "Order", o.id, { after: r });
      if (r === "paid" || r === "already") settled++; else failed++;
    } else if (tx.status === "FAILED" || tx.status === "EXPIRED") {
      await db.order.update({ where: { id: o.id }, data: { status: tx.status } });
      closed++;
    } else unchanged++;
  }
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/tinjau");
  return { ok: true, message: `${settled} lunas, ${closed} ditutup, ${unchanged} tanpa perubahan${failed ? `, ${failed} gagal dicek` : ""}.` };
}
