import { db } from "@/lib/db";
import { ORDER_TTL_HOURS, type OrderStatus } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { createInvoice, fetchTransaction, mayarSimulated } from "@/lib/mayar";
import { unlockedCourseIds } from "@/lib/bundle";
import type { CurrentUser } from "@/lib/auth-guard";
import { Prisma } from "@prisma/client";

export type CreateOrderResult =
  | { ok: true; redirectUrl: string; orderId: string; reused: boolean }
  | { ok: false; error: string; field?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const appUrl = () => (process.env.APP_URL ?? "").replace(/\/$/, "");

/** Status yang ditampilkan: PENDING yang sudah lewat expiresAt dianggap EXPIRED (kedaluwarsa malas). */
export function effectiveStatus(o: { status: string; expiresAt: Date }): OrderStatus {
  if (o.status === "PENDING" && o.expiresAt.getTime() < Date.now()) return "EXPIRED";
  return o.status as OrderStatus;
}

export async function expirePendingOrders(): Promise<number> {
  const r = await db.order.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return r.count;
}

/** PRD 10.1: satu PENDING aktif per (user, kursus); klik ganda mengembalikan order yang sama. */
export async function createOrder(user: CurrentUser, courseId: string, whatsappRaw: string): Promise<CreateOrderResult> {
  const phone = normalizePhone(whatsappRaw);
  if (!phone.ok) return { ok: false, error: phone.message, field: "whatsapp" };

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED" || course.archivedAt) {
    return { ok: false, error: "Kursus ini tidak tersedia." };
  }
  if (course.priceRupiah <= 0) return { ok: false, error: "Kursus ini gratis, gunakan tombol Daftar gratis." };

  // Paket bundling dianggap sudah dimiliki bila semua kursus isinya sudah aktif.
  const unlocks = unlockedCourseIds(course);
  const enrolled = await db.enrollment.findMany({ where: { userId: user.id, courseId: { in: unlocks } } });
  if (enrolled.some((e) => e.status === "REVOKED")) return { ok: false, error: "Aksesmu dinonaktifkan admin. Hubungi pengelola dulu ya." };
  if (enrolled.filter((e) => e.status === "ACTIVE").length === unlocks.length) {
    return { ok: false, error: unlocks.length > 1 ? "Kamu sudah punya semua kelas di paket ini." : "Kamu sudah terdaftar di kursus ini." };
  }

  await db.user.update({ where: { id: user.id }, data: { whatsapp: phone.value } });

  // Cari atau buat order PENDING secara atomik.
  const reserve = () => db.$transaction(async (tx) => {
    const now = new Date();
    await tx.order.updateMany({
      where: { userId: user.id, courseId, status: "PENDING", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    });
    const existing = await tx.order.findFirst({ where: { userId: user.id, courseId, status: "PENDING" } });
    if (existing) return { order: existing, created: false };
    const o = await tx.order.create({
      data: {
        userId: user.id,
        courseId,
        amount: course.priceRupiah,
        whatsapp: phone.value,
        expiresAt: new Date(now.getTime() + ORDER_TTL_HOURS * 3600 * 1000),
      },
    });
    return { order: o, created: true };
  });
  let reservation: Awaited<ReturnType<typeof reserve>> | undefined;
  for(let attempt=0;attempt<4;attempt++) {
    try { reservation=await reserve(); break; }
    catch(e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || !["P2002","P2034","P1008"].includes(e.code)) throw e;
      await sleep(100*(attempt+1));
    }
  }
  if(!reservation) return {ok:false,error:"Tagihan sedang diproses. Coba lagi sebentar."};
  const {order,created}=reservation;

  if (!created) {
    // Mungkin request lain sedang membuat invoice. Tunggu sebentar bila belum ada tautan.
    let o = order;
    for (let i = 0; i < 12 && !o.payUrl; i++) {
      await sleep(250);
      o = (await db.order.findUnique({ where: { id: order.id } })) ?? o;
    }
    if (!o.payUrl) return { ok: false, error: "Tagihan sedang dibuat. Coba lagi beberapa detik lagi." };
    return { ok: true, redirectUrl: o.payUrl, orderId: o.id, reused: true };
  }

  try {
    const inv = await createInvoice({
      orderId: order.id,
      name: user.name ?? user.email,
      email: user.email,
      mobile: phone.value,
      amount: order.amount,
      description: `Kursus ${course.title}`,
      redirectUrl: `${appUrl()}/dashboard/pembayaran/${order.id}`,
      expiresAt: order.expiresAt,
    });
    await db.order.update({ where: { id: order.id }, data: { mayarId: inv.id, payUrl: inv.link } });
    await db.event.create({ data: { name: "checkout_start", courseId, userId: user.id } });
    return { ok: true, redirectUrl: inv.link, orderId: order.id, reused: false };
  } catch (e) {
    console.error("[orders] gagal membuat invoice", e);
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED", note: "Gagal membuat invoice" } });
    return { ok: false, error: "Pembayaran belum bisa dibuat saat ini. Coba lagi sebentar lagi." };
  }
}

/**
 * Tanya Mayar langsung (server ke server) untuk order yang masih PENDING, lalu perbarui bila sudah lunas atau gagal.
 * Dipakai pop-up pembayaran dan halaman status supaya tidak bergantung pada kecepatan webhook.
 * Tidak melakukan apa-apa di mode simulasi atau bila invoice belum dibuat.
 */
export async function syncOrderWithMayar(order: { id: string; status: string; mayarId: string | null }): Promise<void> {
  if (order.status !== "PENDING" || !order.mayarId || mayarSimulated()) return;
  const tx = await fetchTransaction(order.mayarId);
  if (!tx) return;
  if (tx.status === "PAID" && tx.currency === "IDR" && (!tx.orderId || tx.orderId === order.id)) {
    await settleOrder(order.id, tx.amount);
  } else if (tx.status === "FAILED" || tx.status === "EXPIRED") {
    await db.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: tx.status } });
  }
}

export type SettleResult = "paid" | "already" | "not_found" | "amount_mismatch" | "cancelled";

/** Tandai lunas dan buka akses, semuanya dalam satu transaksi dan idempoten. */
export async function settleOrder(orderId: string, paidAmount: number): Promise<SettleResult> {
  return db.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId } });
    if (!o) return "not_found";
    if (paidAmount !== o.amount) return "amount_mismatch";
    if (o.status === "PAID") return "already";
    if (o.status === "CANCELLED" || o.status === "FAILED") return "cancelled";
    await tx.order.update({ where: { id: o.id }, data: { status: "PAID", paidAt: new Date() } });
    const course = await tx.course.findUnique({ where: { id: o.courseId }, select: { id: true, bundleCourseIds: true } });
    for (const courseId of course ? unlockedCourseIds(course) : [o.courseId]) {
      await tx.enrollment.upsert({
        where: { userId_courseId: { userId: o.userId, courseId } },
        update: { status: "ACTIVE", source: "PAID" },
        create: { userId: o.userId, courseId, status: "ACTIVE", source: "PAID" },
      });
    }
    await tx.event.create({ data: { name: "order_paid", courseId: o.courseId, userId: o.userId } });
    return "paid";
  });
}
