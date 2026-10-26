import { notFound, redirect } from "next/navigation";
import { requireUser, canManageCourse } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";

/** Pintu masuk kursus: arahkan ke pelajaran lanjutan (siswa) atau pelajaran pertama (pratinjau pengajar/admin). */
export default async function CourseEntry({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/kursus/${slug}`);
  const course = await db.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) notFound();

  const progress = (await getUserProgress(user.id)).find((p) => p.courseId === course.id);
  if (progress) {
    const target = progress.resumeLessonId ?? (await db.lesson.findFirst({ where: { courseId: course.id, status: "PUBLISHED" }, orderBy: { position: "asc" }, select: { id: true } }))?.id;
    if (target) redirect(`/dashboard/kursus/${slug}/pelajaran/${target}`);
    redirect("/dashboard/kursus");
  }
  if (await canManageCourse(user, course.id)) {
    const first = await db.lesson.findFirst({ where: { courseId: course.id }, orderBy: { position: "asc" }, select: { id: true } });
    if (first) redirect(`/dashboard/kursus/${slug}/pelajaran/${first.id}`);
    redirect(`/dashboard/kelola/${course.id}`);
  }
  redirect(`/kursus/${slug}`);
}
