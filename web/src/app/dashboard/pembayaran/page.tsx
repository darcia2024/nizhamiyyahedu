import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { effectiveStatus } from "@/lib/orders";
import { ORDER_LABEL, ORDER_BADGE as badgeClass } from "@/lib/constants";
import { dateTimeWib, rupiah } from "@/lib/format";

export const metadata = { title: "Pembayaran" };

export default async function PaymentsPage() {
  const user = await requireUser("/dashboard/pembayaran");
  const orders = await db.order.findMany({ where: { userId: user.id }, include: { course: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <AppShell user={user} active="pembayaran">
      <h1>Pembayaran</h1>
      {orders.length ? (
        <div className="card table-box">
          <table className="t">
            <thead><tr><th>Tanggal</th><th>Kursus</th><th>Nominal</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>
              {orders.map((o) => {
                const s = effectiveStatus(o);
                return (
                  <tr key={o.id}>
                    <td>{dateTimeWib(o.createdAt)}</td>
                    <td style={{ fontWeight: 500 }}>{o.course.title}</td>
                    <td className="num">{rupiah(o.amount)}</td>
                    <td><span className={`badge ${badgeClass[s]}`}>{ORDER_LABEL[s]}</span></td>
                    <td className="right-align"><Link className="btn btn-ghost sm" href={`/dashboard/pembayaran/${o.id}`}>Detail</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><h2 className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Belum ada pembayaran</h2><p className="muted">Riwayat tagihan Anda akan muncul di sini.</p><Link className="btn btn-primary" href="/kursus">Buka katalog</Link></div>
      )}
    </AppShell>
  );
}
