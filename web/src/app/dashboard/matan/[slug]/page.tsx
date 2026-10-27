import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MatanStudy, type MatanSection } from "@/components/MatanStudy";
import { parseMatan } from "@/components/Markdown";
import { requireUser, canManageCourse } from "@/lib/auth-guard";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = await db.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: c ? `Matan ${c.title}` : "Matan" };
}

export default async function MatanCoursePage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/dashboard/matan/${slug}`);
  const course = await db.course.findUnique({ where: { slug }, select: { id: true, title: true, titleAr: true } });
  if (!course) notFound();

  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (enr?.status !== "ACTIVE" && !(await canManageCourse(user, course.id))) redirect(`/kursus/${slug}`);

  const lessons = await db.lesson.findMany({
    where: { courseId: course.id, status: "PUBLISHED", matan: { not: null } },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true, matan: true },
  });
  const sections: MatanSection[] = lessons
    .map((l) => ({ lessonId: l.id, title: l.title, position: l.position, blocks: parseMatan(l.matan) }))
    .filter((s) => s.blocks.length > 0);
  if (sections.length === 0) redirect("/dashboard/matan");

  return (
    <AppShell user={user} active="matan">
      <div className="page-hd">
        <Link href="/dashboard/matan" className="small muted" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronLeft size={16} aria-hidden="true" /> Semua matan</Link>
        <h1>{course.title}</h1>
        {course.titleAr && <span className="ar" lang="ar" dir="rtl" style={{ fontSize: 24, color: "var(--muted-text)", textAlign: "left" }}>{course.titleAr}</span>}
      </div>
      <MatanStudy slug={slug} sections={sections} />
    </AppShell>
  );
}
