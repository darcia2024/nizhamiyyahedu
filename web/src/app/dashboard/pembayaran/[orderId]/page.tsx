import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PollRefresh } from "../PollRefresh";
import { EmbedNotify } from "../EmbedNotify";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { effectiveStatus, syncOrderWithMayar } from "@/lib/orders";
import { ORDER_LABEL } from "@/lib/constants";
import { dateTimeWib, rupiah } from "@/lib/format";
import "@/styles/pay-modal.css";

export const metadata = { title: "Status pembayaran" };

export default async function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requireUser(`/dashboard/pembayaran/${orderId}`);
  const find = () => db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { course: true } });
  let order = await find();
  if (!order) notFound(); // order orang lain atau id ngawur: tidak ada status palsu

  // Mayar mengarahkan pembeli ke sini sesaat setelah bayar, kadang sebelum webhook tiba: tanya langsung ke Mayar.
  if (order.status === "PENDING") {
    try {
      await syncOrderWithMayar(order);
      order = (await find()) ?? order;
    } catch (e) {
      console.error("[pembayaran] gagal sinkron ke Mayar", e);
    }
  }

  const status = effectiveStatus(order);
  const retry = `/kursus/${order.course.slug}?lanjut=1`;
  // Tampil di dalam pop-up pembayaran (iframe): versi ringkas tanpa kerangka situs, dan kabari halaman induk.
  const embedded = (await headers()).get("sec-fetch-dest") === "iframe";

  if (embedded) {
    return (
      <main className="pay-embed" data-testid="order-status" data-status={status}>
        <EmbedNotify orderId={order.id} status={status} />
        {status === "PAID" ? <CheckCircle2 size={44} className="ok" aria-hidden="true" /> : status === "PENDING" ? <Clock size={40} className="wait" aria-hidden="true" /> : <XCircle size={40} className="bad" aria-hidden="true" />}
        <h1>
          {status === "PAID" && "Pembayaran diterima"}
          {status === "PENDING" && "Memastikan pembayaranmu…"}
          {status === "EXPIRED" && "Tagihan kedaluwarsa"}
          {status === "FAILED" && "Pembayaran gagal"}
          {status === "CANCELLED" && "Pembayaran dibatalkan"}
        </h1>
        <p>
          {status === "PAID" && "Kelasnya sudah terbuka. Sebentar lagi jendela ini beralih ke tombol mulai belajar."}
          {status === "PENDING" && "Biasanya cuma beberapa detik. Jangan tutup jendela ini."}
          {(status === "EXPIRED" || status === "FAILED" || status === "CANCELLED") && "Nggak ada dana yang terpotong. Tutup jendela ini lalu coba bayar lagi."}
        </p>
        {status === "PENDING" && <PollRefresh />}
      </main>
    );
  }

  return (
    <AppShell user={user} active="pembayaran">
      <h1>Status pembayaran</h1>
      <section className={`card status-banner ${status === "PAID" ? "ok" : status === "PENDING" ? "wait" : status === "EXPIRED" ? "off" : "bad"}`} role="status" data-testid="order-status" data-status={status}>
        {status === "PAID" ? <CheckCircle2 size={26} aria-hidden="true" /> : status === "PENDING" ? <Clock size={26} aria-hidden="true" /> : <XCircle size={26} aria-hidden="true" />}
        <div className="txt">
          <b style={{ fontSize: 17 }}>
            {status === "PAID" && "Pembayaran diterima. Kelas sudah terbuka."}
            {status === "PENDING" && "Menunggu pembayaran"}
            {status === "EXPIRED" && "Tagihan kedaluwarsa."}
            {(status === "FAILED" || status === "CANCELLED") && (status === "FAILED" ? "Pembayaran gagal." : "Pembayaran dibatalkan.")}
          </b>
          <div className="small muted">
            {status === "PENDING" && `Berlaku sampai ${dateTimeWib(order.expiresAt)}. Halaman ini memeriksa status otomatis.`}
            {status === "PAID" && order.paidAt && `Dibayar ${dateTimeWib(order.paidAt)}.`}
            {status === "EXPIRED" && "Batas waktu pembayaran sudah lewat. Kamu bisa bikin tagihan baru."}
            {(status === "FAILED" || status === "CANCELLED") && "Nggak ada dana yang terpotong dari tagihan ini. Coba lagi ya."}
          </div>
        </div>
        {status === "PAID" && <Link className="btn btn-primary" href={`/dashboard/kursus/${order.course.slug}`}>Mulai belajar</Link>}
        {status === "PENDING" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {order.payUrl && <a className="btn btn-primary" href={order.payUrl}>Lanjutkan bayar</a>}
            <PollRefresh />
          </div>
        )}
        {status === "EXPIRED" && <Link className="btn btn-primary" href={retry}>Bayar ulang</Link>}
        {(status === "FAILED" || status === "CANCELLED") && <Link className="btn btn-primary" href={retry}>Coba lagi</Link>}
      </section>

      <section className="card pad" aria-labelledby="rinci-h">
        <h2 id="rinci-h" style={{ marginBottom: 12 }}>Rincian</h2>
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 24px", margin: 0 }}>
          <dt className="muted">Kursus</dt><dd style={{ margin: 0, fontWeight: 600 }}>{order.course.title}</dd>
          <dt className="muted">Nominal</dt><dd style={{ margin: 0 }} className="num">{rupiah(order.amount)}</dd>
          <dt className="muted">Status</dt><dd style={{ margin: 0 }}>{ORDER_LABEL[status]}</dd>
          <dt className="muted">Dibuat</dt><dd style={{ margin: 0 }}>{dateTimeWib(order.createdAt)}</dd>
        </dl>
      </section>
    </AppShell>
  );
}
