import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { KitabGrid } from "@/components/KitabCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getPublishedCourses } from "@/lib/queries";

export const metadata = { title: "Katalog kelas" };
export const dynamic = "force-dynamic";

/** Katalog di dalam dashboard: pilih kelas lalu bayar, tanpa keluar dari akun. Kelas yang sudah dimiliki ditandai. */
export default async function DashboardCatalogPage() {
  const user = await requireUser("/dashboard/katalog");
  if (user.role === "ADMIN") redirect("/kursus");

  const [courses, enrollments, orders] = await Promise.all([
    getPublishedCourses(),
    db.enrollment.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { courseId: true } }),
    db.order.findMany({ where: { userId: user.id, status: "PENDING", expiresAt: { gt: new Date() } }, select: { courseId: true } }),
  ]);
  const owned = enrollments.map((e) => e.courseId);
  const pending = orders.map((o) => o.courseId);

  return (
    <AppShell user={user} active="katalog">
      <div className="page-hd">
        <h1>Katalog kelas</h1>
        <p className="muted" style={{ marginTop: 6, maxWidth: "40em" }}>
          Pilih kelas yang mau kamu tambah. Bayar langsung dari sini lewat QRIS, virtual account, atau e-wallet, dan kelasnya terbuka otomatis setelah lunas.
        </p>
      </div>
      {courses.length ? (
        <KitabGrid courses={courses} all={courses} owned={owned} pending={pending} compact />
      ) : (
        <div className="empty-state"><h2 className="serif" style={{ fontSize: 22 }}>Kelas sedang disiapkan</h2><p className="muted">Jadwal kelas terbaru akan segera dipublikasikan.</p></div>
      )}
    </AppShell>
  );
}
