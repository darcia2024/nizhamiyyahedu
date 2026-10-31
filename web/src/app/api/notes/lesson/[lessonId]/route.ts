import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { readJson, sameOrigin } from "@/lib/origin";
import { NOTE_MAX, cleanBody } from "@/lib/notes";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const err = (status: number, message: string) => NextResponse.json({ ok: false, error: message }, { status, headers: noStore });

type Ctx = { params: Promise<{ lessonId: string }> };

/** Menulis catatan pelajaran butuh akses aktif ke kursusnya (aturan yang sama dengan form di halaman pelajaran). */
async function canWrite(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true, status: true } });
  if (!lesson || lesson.status !== "PUBLISHED") return false;
  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: lesson.courseId } }, select: { status: true } });
  return enr?.status === "ACTIVE";
}

/** Simpan isi dan/atau sematan catatan pelajaran. Isi kosong berarti catatannya dihapus. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return err(403, "Permintaan ditolak.");
  const user = await getCurrentUser();
  if (!user) return err(401, "Sesimu sudah berakhir. Masuk lagi dulu ya.");
  if (!(await rateLimit(`note:${user.id}`, 180, 60))) return err(429, "Terlalu cepat. Tunggu sebentar.");
  const { lessonId } = await params;

  const json = await readJson(req);
  if (!json) return err(400, "Data tidak valid.");

  if ("body" in json) {
    const body = cleanBody(json.body, NOTE_MAX);
    if (body === null) return err(400, `Catatan pelajaran maksimal ${NOTE_MAX.toLocaleString("id-ID")} karakter.`);
    if (!(await canWrite(user.id, lessonId))) return err(403, "Kamu belum punya akses ke pelajaran ini.");
    if (!body) {
      await db.lessonNote.deleteMany({ where: { userId: user.id, lessonId } });
      return NextResponse.json({ ok: true, deleted: true }, { headers: noStore });
    }
    const note = await db.lessonNote.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { body, ...("pinned" in json ? { pinned: json.pinned === true } : {}) },
      create: { userId: user.id, lessonId, body, pinned: json.pinned === true },
      select: { updatedAt: true },
    });
    return NextResponse.json({ ok: true, updatedAt: note.updatedAt.toISOString() }, { headers: noStore });
  }

  if ("pinned" in json) {
    // Menyematkan catatan yang sudah ada tidak butuh akses aktif (catatan lama tetap bisa dirapikan).
    const res = await db.lessonNote.updateMany({ where: { userId: user.id, lessonId }, data: { pinned: json.pinned === true } });
    if (!res.count) return err(404, "Catatan tidak ditemukan.");
    return NextResponse.json({ ok: true }, { headers: noStore });
  }
  return err(400, "Tidak ada yang diubah.");
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return err(403, "Permintaan ditolak.");
  const user = await getCurrentUser();
  if (!user) return err(401, "Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const { lessonId } = await params;
  await db.lessonNote.deleteMany({ where: { userId: user.id, lessonId } });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
