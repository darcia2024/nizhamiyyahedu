import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicChrome";
import { LessonView } from "@/components/LessonView";
import { db } from "@/lib/db";

export const metadata = { title: "Pelajaran pratinjau" };

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({ where: { slug }, include: { teacher: { select: { displayName: true } } } });
  if (!course || course.status !== "PUBLISHED" || course.archivedAt) notFound();
  const lesson = await db.lesson.findFirst({ where: { courseId: course.id, isFreePreview: true, status: "PUBLISHED" } });
  if (!lesson) {
    return (
      <PublicShell>
        <div className="err-page gutter"><div>
          <h1>Belum ada pelajaran pratinjau</h1>
          <p className="muted">Kursus ini belum menyediakan pelajaran gratis. Lihat silabus lengkapnya di halaman kursus.</p>
          <Link className="btn btn-primary" href={`/kursus/${slug}`}>Kembali ke kursus</Link>
        </div></div>
      </PublicShell>
    );
  }
  return (
    <PublicShell>
      <div className="gutter app" style={{ padding: "24px max(16px,4vw) 64px", minHeight: 0 }}>
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <nav className="breadcrumb" style={{ padding: 0 }}><Link href="/kursus">Katalog</Link> › <Link href={`/kursus/${slug}`}>{course.title}</Link> › Pratinjau</nav>
          <LessonView
            mode="guest"
            course={{ slug, title: course.title, field: course.field, teacherName: course.teacher?.displayName ?? null }}
            lesson={lesson}
            lessons={[{ id: lesson.id, title: lesson.title, position: lesson.position, durationMin: lesson.durationMin }]}
            completed={new Set()}
            basePath={`/kursus/${slug}/pratinjau`}
          />
        </div>
      </div>
    </PublicShell>
  );
}
