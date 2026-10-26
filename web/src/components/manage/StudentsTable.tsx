import Link from "next/link";
import { db } from "@/lib/db";
import { dateWib } from "@/lib/format";

export async function StudentsTable({ courseId, linkUsers }: { courseId: string; linkUsers: boolean }) {
  const [enrollments, lessons] = await Promise.all([
    db.enrollment.findMany({ where: { courseId, status: "ACTIVE" }, include: { user: true }, orderBy: { createdAt: "desc" } }),
    db.lesson.findMany({ where: { courseId, status: "PUBLISHED" }, select: { id: true } }),
  ]);
  const ids = lessons.map((l) => l.id);
  const prog = await db.lessonProgress.findMany({ where: { lessonId: { in: ids }, completedAt: { not: null }, userId: { in: enrollments.map((e) => e.userId) } }, select: { userId: true } });
  const done = new Map<string, number>();
  for (const p of prog) done.set(p.userId, (done.get(p.userId) ?? 0) + 1);

  if (!enrollments.length) return <div className="empty-state"><h2 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Belum ada siswa</h2><p className="muted">User yang mendaftar akan muncul di sini beserta progresnya.</p></div>;
  return (
    <div className="card table-box">
      <div className="pad"><a className="btn btn-ghost sm" href={`/api/courses/${courseId}/users`}>Unduh progres CSV</a></div>
      <table className="t">
        <thead><tr><th>User</th><th>Email</th><th>Sumber</th><th>Bergabung</th><th>Progres</th></tr></thead>
        <tbody>
          {enrollments.map((e) => {
            const d = done.get(e.userId) ?? 0;
            const pct = ids.length ? Math.round((d / ids.length) * 100) : 0;
            return (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{linkUsers ? <Link href={`/admin/pengguna/${e.userId}`}>{e.user.name ?? e.user.email}</Link> : (e.user.name ?? "—")}</td>
                <td>{e.user.email}</td>
                <td><span className="badge">{e.source === "PAID" ? "Bayar" : e.source === "FREE" ? "Gratis" : "Manual"}</span></td>
                <td>{dateWib(e.createdAt)}</td>
                <td style={{ minWidth: 150 }}>
                  <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progres siswa"><div style={{ width: `${pct}%` }} /></div>
                  <span className="small muted num">{d}/{ids.length} · {pct}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
