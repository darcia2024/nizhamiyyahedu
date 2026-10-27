import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, CircleCheck, Clock, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/CourseCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { getPublishedCourses } from "@/lib/queries";
import { dateTimeWib, firstName, hoursLabel, initials, rupiah } from "@/lib/format";
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

  const avg = progress.length ? Math.round((progress.reduce((a, p) => a + (p.total ? p.done / p.total : 0), 0) / progress.length) * 100) : 0;
  const teachers = Array.from(new Set(progress.map((p) => p.teacherName).filter(Boolean))).slice(0, 4);

  return (
    <AppShell user={user} active="dashboard">
      {sp.akses === "ditolak" && <div className="alert err-box" role="alert">Kamu nggak punya akses ke halaman itu.</div>}
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

      <div className="page-hd">
        <h1>Assalamu&apos;alaikum, {firstName(user.name)}</h1>
        <span className="muted">{progress.length ? "Lanjutkan perjalanan keilmuanmu." : "Mulai perjalanan keilmuanmu dari katalog."}</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-ic"><BookOpen size={20} aria-hidden="true" /></span><Link href="/dashboard/kursus">Lihat detail <ChevronRight size={15} aria-hidden="true" /></Link></div>
          <b data-testid="stat-active">{progress.length}</b><span className="lbl">Kursus aktif</span>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-ic"><CircleCheck size={20} aria-hidden="true" /></span></div>
          <b>{doneLessons}</b><span className="lbl">Pelajaran selesai</span>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-ic"><Clock size={20} aria-hidden="true" /></span></div>
          <b>{learnedMin ? hoursLabel(learnedMin).replace("± ", "") : "0 jam"}</b><span className="lbl">Waktu belajar tercatat</span>
        </div>
        <div className="kpi">
          <div className="kpi-top"><span className="kpi-ic"><TrendingUp size={20} aria-hidden="true" /></span><Link href="/dashboard/kursus">Lihat detail <ChevronRight size={15} aria-hidden="true" /></Link></div>
          <b>{avg}%</b><span className="lbl">Rata-rata progres kursus</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="stack">
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
        </div>

        <div className="stack">
          {others.length > 0 && (
            <section aria-labelledby="lain-h" className="card pad" style={{ padding: "18px 20px 8px" }}>
              <div className="sec-hd"><h2 id="lain-h">Kursus lain</h2><Link href="/dashboard/kursus">Lihat semua</Link></div>
              <div className="dash-list" style={{ background: "transparent", padding: 0 }}>
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
            <section aria-labelledby="rek-h" className="card pad" style={{ padding: "18px 20px 8px" }}>
              <h2 id="rek-h">Mulai dari sini</h2>
              <div className="dash-list" style={{ background: "transparent", padding: 0 }}>
                {suggestions.map((c) => (
                  <Link key={c.id} href={`/kursus/${c.slug}`}>
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.title}</span>
                    <b className="num">{rupiah(c.priceRupiah)}</b>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {teachers.length > 0 && (
            <section aria-labelledby="guru-h" className="card pad" style={{ padding: "18px 20px 8px" }}>
              <h2 id="guru-h">Pengajarmu</h2>
              <div className="dash-list" style={{ background: "transparent", padding: 0 }}>
                {teachers.map((t) => (
                  <div key={t}><span className="avatar sm" aria-hidden="true">{initials(t?.replace(/[^\p{L}\s]/gu, ""))}</span><b style={{ fontWeight: 500 }}>{t}</b></div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}