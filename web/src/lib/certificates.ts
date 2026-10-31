import { db } from "@/lib/db";
import { certificateNo, courseFinished } from "@/lib/learning";

/** Nomor sertifikat yang sah berbentuk NZ-2026-3F9A12CC; dipakai untuk menolak masukan aneh sebelum menyentuh database. */
export const CERT_CODE_RE = /^NZ-\d{4}-[0-9A-F]{8}$/;

export const isCertificateCode = (s: string) => CERT_CODE_RE.test(s);

/** Nama di sertifikat: nama akun, atau bagian depan email bila akun belum punya nama. */
export function holderName(user: { name: string | null; email: string }): string {
  return (user.name?.trim() || user.email.split("@")[0]).slice(0, 120);
}

/**
 * Terbitkan sertifikat untuk siswa dan kelas, idempoten: bila sudah ada, yang lama dikembalikan apa adanya
 * (nama dan tanggal tidak berubah). Hanya terbit bila enrollment ACTIVE dan semua pelajaran tayang sudah selesai;
 * selain itu mengembalikan alasannya.
 */
export async function issueCertificate(user: { id: string; name: string | null; email: string }, courseId: string) {
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (existing) return { ok: true as const, certificate: existing };

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { teacher: { select: { displayName: true } }, lessons: { where: { status: "PUBLISHED" }, select: { id: true, durationMin: true } } },
  });
  if (!course) return { ok: false as const, reason: "no-course" as const };

  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (enr?.status !== "ACTIVE") return { ok: false as const, reason: "not-enrolled" as const };

  const done = await db.lessonProgress.findMany({
    where: { userId: user.id, completedAt: { not: null }, lessonId: { in: course.lessons.map((l) => l.id) } },
    select: { completedAt: true },
  });
  if (!courseFinished(course.lessons.length, done.length)) return { ok: false as const, reason: "unfinished" as const, total: course.lessons.length, done: done.length };

  const finishedAt = new Date(Math.max(...done.map((d) => d.completedAt!.getTime())));
  const data = {
    code: certificateNo(user.id, course.id, finishedAt),
    userId: user.id,
    courseId: course.id,
    holderName: holderName(user),
    courseTitle: course.title,
    courseTitleAr: course.titleAr,
    teacherName: course.teacher?.displayName ?? null,
    lessonCount: course.lessons.length,
    totalMin: course.lessons.reduce((a, l) => a + (l.durationMin ?? 0), 0),
    finishedAt,
  };
  // Dua tab yang terbuka bersamaan sama-sama lolos pengecekan di atas: yang kalah balapan memakai baris pemenang.
  const certificate = await db.certificate.upsert({ where: { userId_courseId: { userId: user.id, courseId } }, create: data, update: {} });
  return { ok: true as const, certificate };
}
