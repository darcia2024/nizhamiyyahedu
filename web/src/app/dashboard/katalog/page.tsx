import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { KitabGrid } from "@/components/KitabCard";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { filterCourses, getPublishedCourses } from "@/lib/queries";

export const metadata = { title: "Katalog kelas" };
export const dynamic = "force-dynamic";

/**
 * Katalog di dalam dashboard: pilih kelas lalu bayar tanpa keluar dari akun. Detail kelas, pratinjau gratis, dan
 * pembayaran semuanya tampil sebagai pop-up di atas halaman ini. Kelas yang sudah dimiliki ditandai.
 */
export default async function DashboardCatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("/dashboard/katalog");
  if (user.role === "ADMIN") redirect("/kursus");
  const { q } = await searchParams;

  const [all, enrollments, orders] = await Promise.all([
    getPublishedCourses(),
    db.enrollment.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { courseId: true } }),
    db.order.findMany({ where: { userId: user.id, status: "PENDING", expiresAt: { gt: new Date() } }, select: { courseId: true } }),
  ]);
  const courses = q?.trim() ? filterCourses(all, { q }) : all;
  const owned = enrollments.map((e) => e.courseId);
  const pending = orders.map((o) => o.courseId);

  return (
    <AppShell user={user} active="katalog">
      <div className="page-hd">
        <h1>Katalog kelas</h1>
        <p className="muted" style={{ marginTop: 6, maxWidth: "40em" }}>
          Pilih kelas yang mau kamu tambah. Bayar langsung dari sini lewat QRIS, virtual account, atau e-wallet, dan kelasnya terbuka otomatis setelah lunas.
        </p>
        {q?.trim() && <p className="small muted" style={{ marginTop: 10 }}>Hasil untuk “{q}” · <Link href="/dashboard/katalog">Tampilkan semua</Link></p>}
      </div>
      {courses.length ? (
        <KitabGrid courses={courses} all={all} owned={owned} pending={pending} compact dashboard />
      ) : (
        <div className="empty-state"><h2 className="serif" style={{ fontSize: 22 }}>{q?.trim() ? "Tidak ada kelas yang cocok" : "Kelas sedang disiapkan"}</h2><p className="muted">{q?.trim() ? "Coba kata kunci lain." : "Jadwal kelas terbaru akan segera dipublikasikan."}</p></div>
      )}
    </AppShell>
  );
}
