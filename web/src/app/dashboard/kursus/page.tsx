import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/CourseCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getUserProgress } from "@/lib/progress";
import { dateTimeWib, rupiah } from "@/lib/format";
import { effectiveStatus } from "@/lib/orders";

export const metadata = { title: "Kursus saya" };

export default async function MyCourses() {
  const user = await requireUser("/dashboard/kursus");
  const [progress, orders] = await Promise.all([
    getUserProgress(user.id),
    db.order.findMany({ where: { userId: user.id, status: "PENDING" }, include: { course: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const pending = orders.filter((o) => effectiveStatus(o) === "PENDING");

  return (
    <AppShell user={user} active="kursus">
      <h1>Kursus saya</h1>
      {pending.length > 0 && (
        <section aria-labelledby="menunggu-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="menunggu-h">Menunggu pembayaran</h2>
          {pending.map((o) => (
            <div key={o.id} className="card status-banner wait">
              <div className="txt"><b>{o.course.title}</b><div className="small muted">{rupiah(o.amount)} · berlaku sampai {dateTimeWib(o.expiresAt)}</div></div>
              <Link className="btn btn-primary sm" href={`/dashboard/pembayaran/${o.id}`}>Lihat status</Link>
            </div>
          ))}
        </section>
      )}
      {progress.length ? (
        <div className="grid-cards">
          {progress.map((p) => {
            const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <article key={p.courseId} className="course-card">
                <Cover c={p} />
                <div className="cc-body">
                  <h3><Link href={`/dashboard/kursus/${p.slug}`}>{p.title}</Link></h3>
                  <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres ${p.title}`}><div style={{ width: `${pct}%` }} /></div>
                  <span className="small muted num">{p.done} dari {p.total} pelajaran · {pct}%</span>
                  <div className="cc-foot"><span>{p.finished ? "Selesai" : `Berikutnya: pelajaran ${p.resumePosition ?? "-"}`}</span><b style={{ fontSize: 14 }}>{p.finished ? "Tinjau" : "Lanjutkan"} →</b></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Belum ada kursus</h2>
          <p className="muted">Pilih kursus di katalog untuk mulai belajar.</p>
          <Link className="btn btn-primary" href="/kursus">Buka katalog</Link>
        </div>
      )}
    </AppShell>
  );
}
