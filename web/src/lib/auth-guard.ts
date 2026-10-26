import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  whatsapp: string | null;
  createdAt: Date;
};

/** Satu kali query per request (Q1, F2). Peran dibaca dari DB sehingga perubahan peran langsung berlaku. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const u = await db.user.findUnique({ where: { id } });
  return u ? ({ ...u, role: u.role as Role } as CurrentUser) : null;
});

export function safeCallback(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u0020]/.test(path)) return fallback;
  try {
    const parsed = new URL(path, "https://internal.invalid");
    if (parsed.origin !== "https://internal.invalid") return fallback;
    const decoded = decodeURIComponent(path);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f]/.test(decoded)) return fallback;
  } catch { return fallback; }
  return path;
}

export async function requireUser(returnTo = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?callbackUrl=${encodeURIComponent(safeCallback(returnTo))}`);
  return user;
}

export async function requireRole(roles: Role[], returnTo = "/dashboard"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!roles.includes(user.role)) redirect("/dashboard?akses=ditolak");
  return user;
}

/** Admin selalu lolos; pengajar hanya untuk kursus miliknya (lewat TeacherProfile.userId). */
export async function canManageCourse(user: CurrentUser, courseId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TEACHER") return false;
  const c = await db.course.findUnique({
    where: { id: courseId },
    select: { teacher: { select: { userId: true } } },
  });
  return c?.teacher?.userId === user.id;
}

export async function requireCourseOwner(courseId: string): Promise<CurrentUser> {
  const user = await requireRole(["TEACHER", "ADMIN"], "/dashboard/kelola");
  if (!(await canManageCourse(user, courseId))) redirect("/dashboard/kelola?akses=ditolak");
  return user;
}
