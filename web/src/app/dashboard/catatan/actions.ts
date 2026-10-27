"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { fail, type ActionResult } from "@/lib/action";
import { NOTE_MAX, normalizeNote } from "@/lib/learning";

/** Pelajaran yang boleh dicatat: tayang, dan pemilik catatan terdaftar aktif di kursusnya. */
async function noteableLesson(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, status: true, course: { select: { slug: true } } },
  });
  if (!lesson || lesson.status !== "PUBLISHED") return null;
  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: lesson.courseId } } });
  return enr?.status === "ACTIVE" ? lesson : null;
}

function refresh(slug: string, lessonId: string) {
  revalidatePath("/dashboard/catatan");
  revalidatePath(`/dashboard/kursus/${slug}/pelajaran/${lessonId}`);
}

/** Simpan catatan pribadi. Isi kosong berarti catatan dihapus. */
export async function saveNote(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const lessonId = String(fd.get("lessonId") ?? "");
  const body = normalizeNote(String(fd.get("body") ?? ""));
  if (body.length > NOTE_MAX) return fail(`Catatan terlalu panjang. Maksimal ${NOTE_MAX.toLocaleString("id-ID")} karakter.`, { body: `Maksimal ${NOTE_MAX.toLocaleString("id-ID")} karakter.` });
  const lesson = await noteableLesson(user.id, lessonId);
  if (!lesson) return fail("Kamu belum punya akses ke pelajaran ini.");

  if (!body) {
    await db.lessonNote.deleteMany({ where: { userId: user.id, lessonId } });
    refresh(lesson.course.slug, lessonId);
    return { ok: true, message: "Catatan dikosongkan dan dihapus." };
  }
  await db.lessonNote.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { body },
    create: { userId: user.id, lessonId, body },
  });
  refresh(lesson.course.slug, lessonId);
  return { ok: true, message: "Catatan tersimpan." };
}

/** Hapus catatan milik sendiri. Tidak butuh akses aktif, supaya catatan lama tetap bisa dibersihkan. */
export async function deleteNote(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const lessonId = String(fd.get("lessonId") ?? "");
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { course: { select: { slug: true } } } });
  await db.lessonNote.deleteMany({ where: { userId: user.id, lessonId } });
  refresh(lesson?.course.slug ?? "", lessonId);
  return { ok: true, message: "Catatan dihapus." };
}
