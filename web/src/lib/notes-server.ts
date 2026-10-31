import { db } from "@/lib/db";

/** Kelas hanya boleh ditautkan ke catatan bila pengguna terdaftar aktif di sana. null = tanpa kelas, undefined = tidak valid. */
export async function ownedCourseId(userId: string, courseId: unknown): Promise<string | null | undefined> {
  if (courseId === null || courseId === "") return null;
  if (typeof courseId !== "string") return undefined;
  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { status: true } });
  return enr?.status === "ACTIVE" ? courseId : undefined;
}