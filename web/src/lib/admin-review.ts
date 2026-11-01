import { db } from "@/lib/db";
import { unlockedCourseIds } from "@/lib/bundle";

const HOUR = 3600000;

/** Tagihan yang menunggu lebih dari satu jam tetapi belum kedaluwarsa. */
const stalePending = () => ({ status: "PENDING", createdAt: { lt: new Date(Date.now() - HOUR) }, expiresAt: { gt: new Date() } });

/** Kursus draf yang sudah diajukan pengajar dan belum pernah diputuskan setelahnya. */
async function submittedDrafts() {
  const drafts = await db.course.findMany({ where: { status: "DRAFT", archivedAt: null }, select: { id: true, title: true, updatedAt: true, teacher: { select: { displayName: true } } } });
  if (!drafts.length) return [];
  const logs = await db.auditLog.findMany({
    where: { targetType: "Course", targetId: { in: drafts.map((d) => d.id) }, action: { in: ["COURSE_SUBMIT", "COURSE_STATUS"] } },
    orderBy: { createdAt: "desc" },
    select: { targetId: true, action: true, createdAt: true },
  });
  const last = new Map<string, { action: string; createdAt: Date }>();
  for (const l of logs) if (!last.has(l.targetId)) last.set(l.targetId, l);
  return drafts.flatMap((d) => { const l = last.get(d.id); return l?.action === "COURSE_SUBMIT" ? [{ ...d, submittedAt: l.createdAt }] : []; });
}

/** Tagihan lunas yang belum punya pendaftaran. Paket dicek per kursus isinya; akses yang sengaja dicabut (REVOKED) tidak ikut. */
async function paidWithoutAccess() {
  const paid = await db.order.findMany({
    where: { status: "PAID", paidAt: { gte: new Date(Date.now() - 60 * 24 * HOUR) } },
    orderBy: { paidAt: "desc" },
    take: 200,
    select: { id: true, amount: true, paidAt: true, userId: true, courseId: true, user: { select: { name: true, email: true } }, course: { select: { id: true, title: true, bundleCourseIds: true } } },
  });
  if (!paid.length) return [];
  const enrolled = await db.enrollment.findMany({ where: { userId: { in: paid.map((o) => o.userId) } }, select: { userId: true, courseId: true } });
  const has = new Set(enrolled.map((e) => `${e.userId}:${e.courseId}`));
  return paid.filter((o) => unlockedCourseIds(o.course).some((id) => !has.has(`${o.userId}:${id}`)));
}

export async function reviewQueue() {
  const [drafts, pending, noAccess] = await Promise.all([
    submittedDrafts(),
    db.order.findMany({ where: stalePending(), orderBy: { createdAt: "asc" }, take: 50, select: { id: true, amount: true, createdAt: true, user: { select: { name: true, email: true } }, course: { select: { title: true } } } }),
    paidWithoutAccess(),
  ]);
  return { drafts, pending, noAccess, total: drafts.length + pending.length + noAccess.length };
}

/** Hitungan untuk lencana menu; sama dengan isi halaman Perlu ditinjau. */
export async function reviewCount() {
  const [drafts, pending, noAccess] = await Promise.all([submittedDrafts(), db.order.count({ where: stalePending() }), paidWithoutAccess()]);
  return drafts.length + pending + noAccess.length;
}
