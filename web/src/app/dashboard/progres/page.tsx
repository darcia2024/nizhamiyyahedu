import Link from "next/link";
import { Award, CircleCheck, Clock, Flame, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { activityByDay, courseFinished, streakDays } from "@/lib/learning";
import { dateWib, hoursLabel } from "@/lib/format";
import { FIELD_LABEL, FIELD_TONE } from "@/lib/constants";

export const metadata = { title: "Progres" };

const DAY = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "short", day: "numeric", month: "short" });

export default async function ProgressPage() {
  const user = await requireUser("/dashboard/progres");
  const [progress, rows] = await Promise.all([
    getUserProgress(user.id),
    db.lessonProgress.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { title: true, position: true, durationMin: true, course: { select: { slug: true, title: true } } } } },
    }),
  ]);

  const done = rows.filter((r) => r.completedAt).sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  const learnedMin = done.reduce((a, r) => a + (r.lesson.durationMin ?? 0), 0);
  const events = rows.flatMap((r) => [r.lastOpenedAt, ...(r.completedAt ? [r.completedAt] : [])]);
  const streak = streakDays(events);
  const activity = activityByDay(events, 14);
  const peak = Math.max(1, ...activity.map((a) => a.count));
  const finished = progress.filter((p) => courseFinished(p.total, p.done)).length;

  return (
    <AppShell user={user} active="progres">
      <div className="page-hd">
        <h1>Progres belajar</h1>
        <span className="muted">Pantau sampai mana kamu belajar dan seberapa rutin.</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-top"><span className="kpi-ic"><Flame size={20} aria-hidden="true" /></span></div><b data-testid="stat-streak">{streak} hari</b><span className="lbl">Beruntun belajar</span></div>
        <div className="kpi"><div className="kpi-top"><span className="kpi-ic"><CircleCheck size={20} aria-hidden="true" /></span></div><b>{done.length}</b><span className="lbl">Pelajaran selesai</span></div>
        <div className="kpi"><div className="kpi-top"><span className="kpi-ic"><Clock size={20} aria-hidden="true" /></span></div><b>{learnedMin ? hoursLabel(learnedMin).replace("± ", "") : "0 jam"}</b><span className="lbl">Waktu belajar tercatat</span></div>
        <div className="kpi"><div className="kpi-top"><span className="kpi-ic"><Award size={20} aria-hidden="true" /></span><Link href="/dashboard/sertifikat">Lihat detail</Link></div><b>{finished}</b><span className="lbl">Kursus selesai</span></div>
      </div>

      <section className="card pad" aria-labelledby="akt-h">
        <div className="sec-hd"><h2 id="akt-h">Aktivitas 14 hari terakhir</h2><span className="small muted">Tinggi batang = jumlah pelajaran dibuka atau diselesaikan</span></div>
        <div className="act-chart" role="img" aria-label={`Aktivitas 14 hari terakhir, beruntun ${streak} hari`}>
          {activity.map((a) => (
            <div key={a.key} className="act-col" title={`${a.key}: ${a.count} aktivitas`}>
              <span className={`act-bar${a.count ? " on" : ""}`} style={{ height: `${a.count ? 12 + (a.count / peak) * 68 : 6}px` }} />
              <small>{a.key.slice(8)}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="dash-grid">
        <section className="card pad stack" aria-labelledby="krs-h">
          <h2 id="krs-h">Progres per kursus</h2>
          {progress.length === 0 ? (
            <p className="muted">Belum ada kursus yang diikuti. <Link href="/kursus">Lihat katalog</Link>.</p>
          ) : (
            progress.map((p) => {
              const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <div key={p.courseId} className="prog-row">
                  <div className="prog-hd">
                    <span className={`tag f-${FIELD_TONE[p.field]}`}>{FIELD_LABEL[p.field]}</span>
                    <b>{p.title}</b>
                    <span className="small muted num">{p.done}/{p.total}</span>
                  </div>
                  <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres ${p.title}`}><div style={{ width: `${pct}%` }} /></div>
                  <div className="prog-ft">
                    <span className="small muted">{courseFinished(p.total, p.done) ? "Selesai" : p.remainingMin ? `Sisa ${hoursLabel(p.remainingMin).replace("± ", "")}` : `${pct}%`}</span>
                    <Link href={p.resumeLessonId ? `/dashboard/kursus/${p.slug}/pelajaran/${p.resumeLessonId}` : `/dashboard/kursus/${p.slug}`} className="small">{courseFinished(p.total, p.done) ? "Tinjau" : "Lanjutkan"} <ArrowRight size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /></Link>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="card pad" aria-labelledby="rwy-h" style={{ padding: "18px 20px 8px" }}>
          <h2 id="rwy-h">Riwayat selesai</h2>
          {done.length === 0 ? (
            <p className="muted" style={{ paddingBottom: 12 }}>Belum ada pelajaran yang selesai.</p>
          ) : (
            <div className="dash-list" style={{ background: "transparent", padding: 0 }}>
              {done.slice(0, 8).map((r) => (
                <Link key={r.lessonId} href={`/dashboard/kursus/${r.lesson.course.slug}/pelajaran/${r.lessonId}`}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontWeight: 500, display: "block" }}>{r.lesson.title}</b>
                    <small>{r.lesson.course.title}</small>
                  </span>
                  <span className="small muted" title={dateWib(r.completedAt!)}>{DAY.format(r.completedAt!)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
