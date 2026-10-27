import Link from "next/link";
import { BookText, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { parseMatan } from "@/components/Markdown";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { FIELD_LABEL, FIELD_TONE } from "@/lib/constants";

export const metadata = { title: "Matan" };

export default async function MatanIndexPage() {
  const user = await requireUser("/dashboard/matan");
  const progress = await getUserProgress(user.id);
  const lessons = progress.length
    ? await db.lesson.findMany({
        where: { courseId: { in: progress.map((p) => p.courseId) }, status: "PUBLISHED", matan: { not: null } },
        select: { courseId: true, matan: true },
      })
    : [];
  const stats = new Map<string, { lessons: number; blocks: number }>();
  for (const l of lessons) {
    const n = parseMatan(l.matan).length;
    if (!n) continue;
    const s = stats.get(l.courseId) ?? { lessons: 0, blocks: 0 };
    s.lessons += 1; s.blocks += n;
    stats.set(l.courseId, s);
  }
  const courses = progress.filter((p) => stats.has(p.courseId));

  return (
    <AppShell user={user} active="matan">
      <div className="page-hd">
        <h1>Matan</h1>
        <span className="muted">Latihan membaca dan menghafal matan dari kursus yang kamu ikuti.</span>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <BookText size={28} aria-hidden="true" />
          <h2>Belum ada matan untuk dilatih</h2>
          <p className="muted">Matan muncul di sini begitu kamu terdaftar di kursus yang pelajarannya memuat teks Arab.</p>
          <Link className="btn btn-primary" href="/kursus">Lihat katalog</Link>
        </div>
      ) : (
        <div className="matan-grid">
          {courses.map((c) => {
            const s = stats.get(c.courseId)!;
            return (
              <Link key={c.courseId} href={`/dashboard/matan/${c.slug}`} className="card matan-card">
                <span className={`tag f-${FIELD_TONE[c.field]}`}>{FIELD_LABEL[c.field]}</span>
                {c.titleAr && <span className="ar matan-card-ar" lang="ar" dir="rtl">{c.titleAr}</span>}
                <b>{c.title}</b>
                <span className="small muted">{s.lessons} pelajaran bermatan · {s.blocks} kalimat</span>
                <span className="matan-card-go">Mulai latihan <ArrowRight size={15} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
