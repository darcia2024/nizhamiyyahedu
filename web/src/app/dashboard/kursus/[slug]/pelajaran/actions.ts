"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";

/** Toggle idempoten. Hanya siswa dengan enrollment ACTIVE; mode pratinjau tidak pernah sampai ke sini. */
export async function toggleComplete(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return;
  const lessonId = String(fd.get("lessonId") ?? "");
  const want = fd.get("done") === "1";
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true, status: true, course: { select: { slug: true } } } });
  if (!lesson || lesson.status !== "PUBLISHED") return;
  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } } });
  if (enr?.status !== "ACTIVE") return;
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completedAt: want ? new Date() : null },
    create: { userId: user.id, lessonId, completedAt: want ? new Date() : null },
  });
  revalidatePath(`/dashboard/kursus/${lesson.course.slug}`, "layout");
  revalidatePath("/dashboard");
}
