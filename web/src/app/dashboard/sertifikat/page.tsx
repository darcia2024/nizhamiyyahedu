import Link from "next/link";
import { Award, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth-guard";
import { getUserProgress } from "@/lib/progress";
import { courseFinished } from "@/lib/learning";
import { FIELD_LABEL, FIELD_TONE } from "@/lib/constants";

export const metadata = { title: "Sertifikat" };

export default async function CertificatesPage() {
  const user = await requireUser("/dashboard/sertifikat");
  const progress = await getUserProgress(user.id);
  const ready = progress.filter((p) => courseFinished(p.total, p.done));
  const pending = progress.filter((p) => !courseFinished(p.total, p.done) && p.total > 0);

  return (
    <AppShell user={user} active="sertifikat">
      <div className="page-hd">
        <h1>Sertifikat</h1>
        <span className="muted">Sertifikat terbit otomatis begitu semua pelajaran sebuah kursus kamu tandai selesai.</span>
      </div>

      {ready.length === 0 && pending.length === 0 && (
        <div className="empty-state">
          <Award size={28} aria-hidden="true" />
          <h2>Belum ada kursus</h2>
          <p className="muted">Ikuti kursus dan selesaikan semua pelajarannya untuk mendapat sertifikat.</p>
          <Link className="btn btn-primary" href="/dashboard/katalog">Lihat katalog</Link>
        </div>
      )}

      {ready.length > 0 && (
        <section className="stack" aria-labelledby="siap-h">
          <h2 id="siap-h">Siap diunduh</h2>
          <div className="matan-grid">
            {ready.map((c) => (
              <div key={c.courseId} className="card matan-card">
                <span className={`tag f-${FIELD_TONE[c.field]}`}>{FIELD_LABEL[c.field]}</span>
                <b>{c.title}</b>
                <span className="small muted">{c.total} pelajaran selesai</span>
                <Link className="btn btn-primary sm" href={`/dashboard/sertifikat/${c.slug}`} data-testid="cert-open"><Award size={16} aria-hidden="true" /> Lihat sertifikat</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="stack" aria-labelledby="blm-h">
          <h2 id="blm-h">Belum selesai</h2>
          <div className="matan-grid">
            {pending.map((c) => {
              const pct = Math.round((c.done / c.total) * 100);
              return (
                <div key={c.courseId} className="card matan-card locked">
                  <span className={`tag f-${FIELD_TONE[c.field]}`}>{FIELD_LABEL[c.field]}</span>
                  <b>{c.title}</b>
                  <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres ${c.title}`}><div style={{ width: `${pct}%` }} /></div>
                  <span className="small muted"><Lock size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Tinggal {c.total - c.done} pelajaran lagi</span>
                  <Link className="btn btn-ghost sm" href={c.resumeLessonId ? `/dashboard/kursus/${c.slug}/pelajaran/${c.resumeLessonId}` : `/dashboard/kursus/${c.slug}`}>Lanjutkan belajar</Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
