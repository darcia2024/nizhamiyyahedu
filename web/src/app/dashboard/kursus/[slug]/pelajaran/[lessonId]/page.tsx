import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LessonView } from "@/components/LessonView";
import { requireUser, canManageCourse } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { FIELD_LABEL, type Field } from "@/lib/constants";
import { getContent } from "@/lib/content";
import { whatsappLink } from "@/lib/learning";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const l = await db.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
  return { title: l?.title ?? "Pelajaran" };
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const user = await requireUser(`/dashboard/kursus/${slug}/pelajaran/${lessonId}`);

  const course = await db.course.findUnique({ where: { slug }, include: { teacher: { select: { displayName: true } } } });
  if (!course) notFound();

  const manager = await canManageCourse(user, course.id);
  const enr = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  const student = enr?.status === "ACTIVE";
  if (!student && !manager) redirect(`/kursus/${slug}`);
  const mode = manager ? "preview" : "student";

  const [lesson, lessons, prog] = await Promise.all([
    db.lesson.findUnique({ where: { id: lessonId } }),
    db.lesson.findMany({
      where: { courseId: course.id, ...(mode === "student" ? { status: "PUBLISHED" } : {}) },
      orderBy: { position: "asc" },
      select: { id: true, title: true, position: true, durationMin: true },
    }),
    mode === "student" ? db.lessonProgress.findMany({ where: { userId: user.id, lesson: { courseId: course.id } } }) : Promise.resolve([]),
  ]);
  if (!lesson || lesson.courseId !== course.id) notFound();
  if (mode === "student" && lesson.status !== "PUBLISHED") notFound();

  if (mode === "student") {
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { lastOpenedAt: new Date() },
      create: { userId: user.id, lessonId },
    });
  }
  const completed = new Set(prog.filter((p) => p.completedAt).map((p) => p.lessonId));
  const [note, contact] = await Promise.all([mode === "student" ? db.lessonNote.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } }) : Promise.resolve(null), getContent("contact.main")]);
  const askUrl = mode === "student" ? whatsappLink(contact.whatsapp, `Assalamu'alaikum, saya ${user.name ?? "siswa"}. Mau tanya soal kursus "${course.title}", pelajaran ${lesson.position}: ${lesson.title}.`) : null;

  return (
    <AppShell user={user} active="kursus" activeCourse={slug}>
      <div className="topbar" style={{ marginTop: -8 }}>
        <Link href="/dashboard" className="icon-btn" aria-label="Kembali ke dashboard"><ChevronLeft size={18} aria-hidden="true" /></Link>
        <div className="grow" style={{ display: "flex", flexDirection: "column" }}>
          <span className="small muted">Kursus saya · {FIELD_LABEL[course.field as Field]}</span>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{course.title}</span>
        </div>
      </div>
      <LessonView
        mode={mode}
        course={{ slug, title: course.title, field: course.field, teacherName: course.teacher?.displayName ?? null }}
        lesson={lesson}
        lessons={lessons}
        completed={completed}
        note={note?.body ?? ""}
        askUrl={askUrl}
        basePath={`/dashboard/kursus/${slug}/pelajaran`}
      />
    </AppShell>
  );
}
