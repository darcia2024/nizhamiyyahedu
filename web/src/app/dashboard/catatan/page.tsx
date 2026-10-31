import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import type { NoteItem } from "@/lib/notes";
import { NotesApp } from "./NotesApp";

export const metadata = { title: "Catatan" };
export const dynamic = "force-dynamic";

/**
 * Aplikasi catatan. Catatan bebas (Note) dan catatan per pelajaran (LessonNote) dimuat bersama dan tampil di satu daftar.
 * `?n=<id>` membuka satu catatan, `?baru=1` langsung membuka catatan baru.
 */
export default async function NotesPage({ searchParams }: { searchParams: Promise<{ n?: string; baru?: string }> }) {
  const user = await requireUser("/dashboard/catatan");
  const sp = await searchParams;

  const [free, lessonNotes, enrollments] = await Promise.all([
    db.note.findMany({ where: { userId: user.id }, include: { course: { select: { title: true } } }, orderBy: { updatedAt: "desc" }, take: 500 }),
    db.lessonNote.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { title: true, position: true, course: { select: { id: true, title: true, slug: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    db.enrollment.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { course: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  const items: NoteItem[] = [
    ...free.map((n): NoteItem => ({
      cid: `n:${n.id}`, kind: "free", serverId: n.id, title: n.title, body: n.body, pinned: n.pinned,
      updatedAt: n.updatedAt.toISOString(), courseId: n.courseId, courseTitle: n.course?.title ?? null,
    })),
    ...lessonNotes.map((n): NoteItem => ({
      cid: `l:${n.lessonId}`, kind: "lesson", serverId: n.lessonId, title: "", body: n.body, pinned: n.pinned,
      updatedAt: n.updatedAt.toISOString(), courseId: n.lesson.course.id, courseTitle: n.lesson.course.title,
      lesson: { title: n.lesson.title, position: n.lesson.position, courseSlug: n.lesson.course.slug },
    })),
  ];
  const courses = enrollments.map((e) => e.course);

  return (
    <AppShell user={user} active="catatan">
      <NotesApp initial={items} courses={courses} initialKey={sp.n ?? null} startNew={sp.baru === "1"} />
    </AppShell>
  );
}
