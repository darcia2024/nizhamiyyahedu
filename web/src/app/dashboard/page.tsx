import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, LineChart, Check, ChevronRight, CircleCheck, Clock, Flame, NotebookPen, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/CourseCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { getPublishedCourses } from "@/lib/queries";
import { activityByDay, streakDays } from "@/lib/learning";
import { dateTimeWib, firstName, hoursLabel, rupiah } from "@/lib/format";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";
import "@/styles/dashboard.css";

export const metadata = { title: "Ruang belajarmu" };
const DAY = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "short" });

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const user = await requireUser("/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  const sp = await searchParams;
  const now = new Date();
  // Only show learning content from published lessons with active access, including archived courses.
  const accessible = { status: "PUBLISHED", course: { enrollments: { some: { userId: user.id, status: "ACTIVE" } } } };
  const [progress, pending, catalog, rows, notes] = await Promise.all([
    getUserProgress(user.id),
    db.order.findFirst({ where: { userId: user.id, status: "PENDING", expiresAt: { gt: now } }, include: { course: { select: { title: true } } }, orderBy: { createdAt: "desc" } }),
    getPublishedCourses(),
    db.lessonProgress.findMany({ where: { userId: user.id, lesson: accessible }, include: { lesson: { select: { title: true, durationMin: true, course: { select: { title: true, slug: true } } } } } }),
    db.lessonNote.findMany({ where: { userId: user.id, lesson: accessible }, orderBy: { updatedAt: "desc" }, take: 2, include: { lesson: { select: { title: true, course: { select: { title: true, slug: true } } } } } }),
  ]);
  const done = rows.filter((r) => r.completedAt).sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  const learnedMin = done.reduce((a, r) => a + (r.lesson.durationMin ?? 0), 0);
  const hero = progress.find((p) => !p.finished) ?? progress[0];
  const others = progress.filter((p) => p !== hero).slice(0, 3);
  const enrolledIds = new Set(progress.map((p) => p.courseId));
  const suggestions = catalog.filter((c) => !enrolledIds.has(c.id)).sort((a, b) => Number(a.level !== "ULA") - Number(b.level !== "ULA") || a.priceRupiah - b.priceRupiah).slice(0, 3);
  const starter = suggestions[0];
  const pct = hero?.total ? Math.round((hero.done / hero.total) * 100) : 0;
  const heroHref = hero?.resumeLessonId ? `/dashboard/dashboard/katalog/${hero.slug}/pelajaran/${hero.resumeLessonId}` : hero ? `/dashboard/dashboard/katalog/${hero.slug}` : "/dashboard/katalog";
  const heroLesson = hero?.resumeLessonId ? await db.lesson.findUnique({ where: { id: hero.resumeLessonId }, select: { durationMin: true } }) : null;
  const streak = streakDays(rows.flatMap((r) => [r.lastOpenedAt, ...(r.completedAt ? [r.completedAt] : [])]), now);
  const week = activityByDay(done.map((r) => r.completedAt!), 7, now);
  const weekTotal = week.reduce((n, d) => n + d.count, 0);
  const peak = Math.max(1, ...week.map((d) => d.count));
  const finished = progress.filter((p) => p.finished).length;
  const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long" }).format(now);
  // Tanggal hijriah (Umm al-Qura) di samping tanggal masehi, sentuhan kecil yang akrab bagi penuntut ilmu.
  const hijri = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" }).format(now);

  return (
    <AppShell user={user} active="dashboard">
      <div className="learn-home">
        {sp.akses === "ditolak" && <div className="alert err-box" role="alert">Kamu nggak punya akses ke halaman itu.</div>}
        {pending && <div className="card status-banner wait" role="status" data-testid="pending-banner"><Clock size={21} aria-hidden="true" /><div className="txt"><b>Pembayaran {pending.course.title} masih menunggu</b><div className="small muted">Berlaku sampai {dateTimeWib(pending.expiresAt)}.</div></div><Link className="btn btn-ghost sm" href={`/dashboard/pembayaran/${pending.id}`}>Lihat status <ArrowRight size={15} aria-hidden="true" /></Link></div>}

        <header className="lh-welcome">
          <div><p className="lh-eyebrow">RUANG BELAJARMU</p><h1>Assalamu&apos;alaikum, {firstName(user.name)}.</h1><p>{hero ? "Sedikit demi sedikit, yang penting terus memahami." : "Perjalanan belajar yang baik dimulai dari satu kitab."}</p></div>
          <span className="lh-date">{date}<span className="lh-hijri">{hijri}</span></span>
        </header>

        <div className="lh-top-grid">
          {hero ? <section className="lh-feature" aria-labelledby="lanjut-h">
            <div className="lh-feature-copy">
              <p className="lh-eyebrow">{hero.finished ? "ALHAMDULILLAH, TUNTAS" : "LANJUTKAN DARI SINI"}</p>
              <p className="lh-course-meta">{FIELD_LABEL[hero.field]} <span aria-hidden="true">/</span> Marhalah {LEVEL_LABEL[hero.level]}</p>
              <h2 id="lanjut-h">{hero.title}</h2>
              <p className="lh-next">{hero.finished ? "Semua pelajaran sudah kamu selesaikan. Buka lagi kapan pun kamu ingin mengulang." : hero.resumeLessonId ? `Pelajaran ${hero.resumePosition} · ${hero.resumeTitle}` : "Materi sedang disiapkan. Cek silabus untuk melihat pembaruannya."}</p>
              {hero.teacherName && !hero.teacherName.includes("[") && <p className="lh-teacher">Bersama {hero.teacherName}</p>}
              <div className="lh-feature-progress"><div><span>{hero.done} dari {hero.total} pelajaran</span><b>{pct}%</b></div><div className="lh-meter" role="progressbar" aria-label={`Progres ${hero.title}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div></div>
              <div className="lh-feature-actions"><Link className="lh-primary" href={heroHref} data-testid="continue"><Play size={16} fill="currentColor" aria-hidden="true" />{hero.finished ? "Ulangi pelajaran" : "Lanjutkan belajar"}</Link>{heroLesson?.durationMin ? <span><Clock size={14} aria-hidden="true" /> {heroLesson.durationMin} menit</span> : null}</div>
            </div>
          </section> : <section className="lh-feature lh-onboarding" aria-labelledby="mulai-h">
            <div className="lh-feature-copy"><p className="lh-eyebrow">SELAMAT DATANG</p><h2 id="mulai-h">Satu kitab dulu.<br />Bangun kebiasaan baik.</h2><p className="lh-next">Mulai dari marhalah Ula. Kenali isi kitabnya, tonton pratinjaunya, lalu pilih kelas yang pas buat kamu.</p><Link className="lh-primary" href={starter ? `/dashboard/katalog/${starter.slug}` : "/dashboard/katalog"}>Temukan kelas pertamamu <ArrowRight size={16} aria-hidden="true" /></Link><p className="lh-welcome-note">Silabus bisa dibaca tanpa mendaftar.</p></div>
          </section>}

          <aside className="lh-week" aria-labelledby="minggu-h">
            <div className="lh-section-head"><h2 id="minggu-h">{hero ? "Langkah minggu ini" : "Cara mulai belajar"}</h2>{hero && <Flame size={19} aria-hidden="true" />}</div>
            {hero ? <><div className="lh-week-count"><b>{weekTotal}</b><span>pelajaran selesai<br />dalam 7 hari terakhir</span></div><ol className="lh-week-chart" aria-label="Pelajaran selesai per hari">{week.map((d) => <li key={d.key} title={`${d.key}: ${d.count} pelajaran selesai`}><span className={`lh-day-bar${d.count ? " filled" : ""}`} style={{ height: `${d.count ? 12 + (d.count / peak) * 48 : 5}px` }} /><span>{DAY.format(new Date(`${d.key}T12:00:00+07:00`))}</span><span className="sr-only">{d.count} pelajaran selesai</span></li>)}</ol><div className="lh-streak"><span><Flame size={15} aria-hidden="true" />{streak > 0 ? `${streak} hari beruntun belajar` : "Buka satu pelajaran hari ini, yuk."}</span><Link href="/dashboard/progres" aria-label="Lihat progres belajar"><ArrowRight size={18} aria-hidden="true" /></Link></div></> : <><ol className="lh-start-steps"><li><span>01</span><div><b>Pilih kitabnya</b><p>Lihat silabus dan tingkat materinya.</p></div></li><li><span>02</span><div><b>Coba pelajarannya</b><p>Kenali cara pengajar menjelaskan.</p></div></li><li><span>03</span><div><b>Mulai belajarmu</b><p>Catat, pahami, lalu lanjut perlahan.</p></div></li></ol><Link className="lh-text-link" href="/dashboard/katalog">Lihat katalog <ArrowRight size={15} aria-hidden="true" /></Link></>}
          </aside>
        </div>

        {hero && <dl className="lh-stats" aria-label="Ringkasan belajar"><div><BookOpen size={18} aria-hidden="true" /><dt>Kursus aktif</dt><dd data-testid="stat-active">{progress.length}</dd></div><div><CircleCheck size={18} aria-hidden="true" /><dt>Pelajaran selesai</dt><dd>{done.length}</dd></div><div><Clock size={18} aria-hidden="true" /><dt>Durasi materi selesai</dt><dd>{learnedMin ? hoursLabel(learnedMin) : "0 menit"}</dd></div><div><Check size={18} aria-hidden="true" /><dt>Kursus tuntas</dt><dd>{finished}</dd></div></dl>}

        <div className="lh-bottom-grid">
          <div className="lh-main-stack">
            {others.length > 0 ? <section aria-labelledby="lain-h"><div className="lh-section-head"><h2 id="lain-h">Kitab yang kamu pelajari</h2><Link href="/dashboard/kursus">Lihat semua <ArrowRight size={15} aria-hidden="true" /></Link></div><div className="lh-course-list">{others.map((c) => { const percent = c.total ? Math.round((c.done / c.total) * 100) : 0; return <Link key={c.courseId} className="lh-course-row" href={c.resumeLessonId ? `/dashboard/dashboard/katalog/${c.slug}/pelajaran/${c.resumeLessonId}` : `/dashboard/dashboard/katalog/${c.slug}`}><div className={`lh-mini-cover c-${FIELD_TONE[c.field]}`} aria-hidden="true"><span className="ar" lang="ar" dir="rtl">{c.titleAr ?? FIELD_LABEL[c.field]}</span></div><div className="lh-row-copy"><span>{FIELD_LABEL[c.field]} · {LEVEL_LABEL[c.level]}</span><h3>{c.title}</h3><div className="lh-row-progress"><div className="lh-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div><small>{c.done}/{c.total} selesai</small></div></div><ChevronRight size={19} aria-hidden="true" /></Link>; })}</div></section> : suggestions.length > 0 && <section aria-labelledby="rek-h"><div className="lh-section-head"><h2 id="rek-h">{hero ? "Lanjutkan rasa ingin tahumu" : "Mulai dari kitab ini"}</h2><Link href="/dashboard/katalog">Semua kursus <ArrowRight size={15} aria-hidden="true" /></Link></div><div className="lh-recommendations">{suggestions.slice(0, 2).map((c) => <Link key={c.id} className="lh-recommendation" href={`/dashboard/katalog/${c.slug}`}><Cover c={c} /><div><span className="lh-rec-label">{FIELD_LABEL[c.field]} · {LEVEL_LABEL[c.level]}</span><h3>{c.title}</h3><p>{c.description}</p><footer><span>{c.lessonCount} pelajaran</span><b>{rupiah(c.priceRupiah)}</b></footer></div></Link>)}</div></section>}

            <section className="lh-tools" aria-label="Alat belajar"><Link href="/dashboard/progres"><span className="lh-tool-icon"><LineChart size={22} aria-hidden="true" /></span><div><h2>Lihat langkah belajarmu</h2><p>Pantau progres dan pelajaran selesai.</p></div><ArrowRight size={18} aria-hidden="true" /></Link><Link href="/dashboard/catatan"><span className="lh-tool-icon"><NotebookPen size={22} aria-hidden="true" /></span><div><h2>Rangkai pemahamanmu</h2><p>Simpan hal penting dalam catatan.</p></div><ArrowRight size={18} aria-hidden="true" /></Link></section>
          </div>

          <aside className="lh-journal" aria-labelledby="jurnal-h"><div className="lh-section-head"><h2 id="jurnal-h">Jejak belajarmu</h2><NotebookPen size={18} aria-hidden="true" /></div>{notes.length > 0 ? <div className="lh-note-list">{notes.map((n) => <Link key={n.lessonId} href={`/dashboard/dashboard/katalog/${n.lesson.course.slug}/pelajaran/${n.lessonId}#cs-h`}><span className="lh-rec-label">{n.lesson.course.title}</span><p>{n.body}</p><small>{n.lesson.title} <ArrowRight size={13} aria-hidden="true" /></small></Link>)}</div> : done.length > 0 ? <ol className="lh-recent">{done.slice(0, 3).map((r) => <li key={r.lessonId}><span className="lh-recent-check"><Check size={13} aria-hidden="true" /></span><div><Link href={`/dashboard/dashboard/katalog/${r.lesson.course.slug}/pelajaran/${r.lessonId}`}>{r.lesson.title}</Link><small>{r.lesson.course.title}</small></div></li>)}</ol> : <div className="lh-journal-empty"><NotebookPen size={27} strokeWidth={1.4} aria-hidden="true" /><h3>Tempat menyimpan<br />hal yang kamu pahami.</h3><p>Catatan dari setiap pelajaran akan terkumpul di sini. Biar mudah ditemukan waktu mengulang.</p><Link className="lh-text-link" href={hero ? heroHref : "/dashboard/catatan"}>{hero ? "Buka pelajaran" : "Kenali catatan saya"}<ArrowRight size={15} aria-hidden="true" /></Link></div>}{(notes.length > 0 || done.length > 0) && <Link className="lh-text-link" href={notes.length > 0 ? "/dashboard/catatan" : "/dashboard/progres"}>{notes.length > 0 ? "Semua catatan" : "Riwayat belajar"}<ArrowRight size={15} aria-hidden="true" /></Link>}</aside>
        </div>
      </div>
    </AppShell>
  );
}
