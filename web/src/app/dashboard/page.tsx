import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/CourseCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { getPublishedCourses } from "@/lib/queries";
import { dateTimeWib, firstName, hoursLabel, rupiah } from "@/lib/format";
import { FIELD_LABEL, FIELD_TONE } from "@/lib/constants";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const user = await requireUser("/dashboard");
  const sp = await searchParams;
  const [progress, pending, catalog, doneRows] = await Promise.all([
    getUserProgress(user.id),
    db.order.findFirst({
      where: { userId: user.id, status: "PENDING", expiresAt: { gt: new Date() } },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getPublishedCourses(),
    db.lessonProgress.findMany({ where: { userId: user.id, completedAt: { not: null } }, include: { lesson: { select: { durationMin: true } } } }),
  ]);

  const doneLessons = doneRows.length;
  const learnedMin = doneRows.reduce((a, r) => a + (r.lesson.durationMin ?? 0), 0);
  const hero = progress.find((p) => !p.finished) ?? progress[0];
  const others = progress.filter((p) => p !== hero).slice(0, 3);
  const enrolledIds = new Set(progress.map((p) => p.courseId));
  const suggestions = catalog.filter((c) => !enrolledIds.has(c.id)).sort((a, b) => a.priceRupiah - b.priceRupiah).slice(0, 3);

  return (
    <AppShell user={user} active="dashboard">
      <div className="cols">
        <div className="center">
          {sp.akses === "ditolak" && <div className="alert err-box" role="alert">Anda tidak punya akses ke halaman itu.</div>}
          {pending && (
            <div className="card status-banner wait" role="status" data-testid="pending-banner">
              <Clock size={22} aria-hidden="true" />
              <div className="txt">
                <b>Pembayaran {pending.course.title} masih menunggu</b>
                <div className="small muted">Berlaku sampai {dateTimeWib(pending.expiresAt)}. Kelas terbuka otomatis setelah lunas.</div>
              </div>
              <Link className="pill-dark" href={`/dashboard/pembayaran/${pending.id}`}>Lihat status<i><ArrowRight size={14} aria-hidden="true" /></i></Link>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h1>Assalamu&apos;alaikum, {firstName(user.name)}</h1>
            <span className="small muted">{progress.length ? "Lanjutkan perjalanan keilmuan Anda." : "Mulai perjalanan keilmuan Anda dari katalog."}</span>
          </div>

          {hero ? (
            <section className="card continue" aria-labelledby="lanjut-h">
              <Cover c={{ field: hero.field, titleAr: hero.titleAr, title: hero.title, level: hero.level }} />
              <div className="info">
                <h2 id="lanjut-h" className="sr-only">Lanjutkan belajar</h2>
                <span className={`tag f-${FIELD_TONE[hero.field]}`} style={{ alignSelf: "flex-start" }}>{FIELD_LABEL[hero.field]}</span>
                <b style={{ fontSize: 20, letterSpacing: "-.02em" }}>{hero.title}</b>
                {hero.finished ? (
                  <p className="muted">Alhamdulillah, semua pelajaran kursus ini sudah selesai.</p>
                ) : (
                  <p className="muted">Pelajaran {hero.resumePosition}: {hero.resumeTitle}</p>
                )}
                <div className="progress" role="progressbar" aria-valuenow={hero.total ? Math.round((hero.done / hero.total) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Progres kursus"><div style={{ width: `${hero.total ? (hero.done / hero.total) * 100 : 0}%` }} /></div>
                <span className="small muted num">{hero.done} dari {hero.total} pelajaran selesai</span>
                <Link className="pill-dark" style={{ alignSelf: "flex-start" }} href={hero.resumeLessonId ? `/dashboard/kursus/${hero.slug}/pelajaran/${hero.resumeLessonId}` : `/dashboard/kursus/${hero.slug}`} data-testid="continue">
                  {hero.finished ? "Tinjau kursus" : "Lanjutkan belajar"}<i><ArrowRight size={14} aria-hidden="true" /></i>
                </Link>
              </div>
            </section>
          ) : (
            <section className="empty-state" aria-labelledby="mulai-h">
              <h2 id="mulai-h" className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Belum ada kursus yang diikuti</h2>
              <p className="muted">Mulai dari kursus marhalah ula. Beberapa kursus gratis dan bisa langsung diikuti.</p>
              <Link className="btn btn-primary" href="/kursus">Buka katalog kursus</Link>
            </section>
          )}

          {others.length > 0 && (
            <section aria-labelledby="lain-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="sec-hd"><h2 id="lain-h">Kursus lain</h2><Link href="/dashboard/kursus">Lihat semua</Link></div>
              <div className="card dash-list" style={{ padding: "4px 18px 10px" }}>
                {others.map((c) => (
                  <Link key={c.courseId} href={c.resumeLessonId ? `/dashboard/kursus/${c.slug}/pelajaran/${c.resumeLessonId}` : `/dashboard/kursus/${c.slug}`}>
                    <span className={`tag f-${FIELD_TONE[c.field]}`}>{FIELD_LABEL[c.field]}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.title}</span>
                    <span className="small muted num">{c.done}/{c.total}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!progress.length && suggestions.length > 0 && (
            <section aria-labelledby="rek-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 id="rek-h">Mulai dari sini</h2>
              <div className="card dash-list" style={{ padding: "4px 18px 10px" }}>
                {suggestions.map((c) => (
                  <Link key={c.id} href={`/kursus/${c.slug}`}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.title}</span>
                    <b className="num">{rupiah(c.priceRupiah)}</b>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="right" aria-label="Ringkasan">
          <h2>Statistik</h2>
          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat" style={{ background: "var(--shell)" }}><b className="num" data-testid="stat-active">{progress.length}</b><span>Kursus aktif</span></div>
            <div className="stat" style={{ background: "var(--shell)" }}><b className="num">{doneLessons}</b><span>Pelajaran selesai</span></div>
            <div className="stat" style={{ background: "var(--shell)", gridColumn: "1 / -1" }}><b className="num">{learnedMin ? hoursLabel(learnedMin).replace("± ", "") : "0 jam"}</b><span>Waktu belajar tercatat</span></div>
          </div>
          {progress.some((p) => p.teacherName) && (
            <>
              <h2>Pengajar Anda</h2>
              <div className="dash-list">
                {Array.from(new Set(progress.map((p) => p.teacherName).filter(Boolean))).slice(0, 4).map((t) => (
                  <div key={t}><span className="avatar sm" aria-hidden="true">U</span><b style={{ fontWeight: 500 }}>{t}</b></div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
