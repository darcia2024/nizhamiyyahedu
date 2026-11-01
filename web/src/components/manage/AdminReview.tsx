import Link from "next/link";
import { reviewQueue } from "@/lib/admin-review";
import { dateTimeWib, rupiah } from "@/lib/format";
import { InlineAction } from "@/components/ActionForm";
import { recheckOrder, manualGrantOrder, setCourseStatus } from "@/app/actions/manage";
import { Empty, ManageHeading } from "./ManageUI";

export async function AdminReview() {
  const q = await reviewQueue();
  return (
    <>
      <ManageHeading title="Perlu ditinjau" text="Semua yang menunggu keputusan kamu, dalam satu layar." />
      {!q.total && <Empty title="Semua beres" text="Tidak ada kursus yang diajukan, tagihan menggantung, atau akses yang belum terbuka." />}
      {q.drafts.length > 0 && (
        <section className="card pad">
          <h2>Kursus diajukan ({q.drafts.length})</h2>
          {q.drafts.map((c) => (
            <div className="access-row" key={c.id}>
              <div><Link href={`/admin/kursus/${c.id}`}>{c.title}</Link><p className="small muted">{c.teacher?.displayName ?? "Tanpa pengajar"} · diajukan {dateTimeWib(c.submittedAt)}</p></div>
              <InlineAction action={setCourseStatus} fields={{ id: c.id, to: "PUBLISHED" }} label="Tayangkan" className="btn btn-primary sm" />
            </div>
          ))}
        </section>
      )}
      {q.noAccess.length > 0 && (
        <section className="card pad">
          <h2>Lunas tetapi akses belum terbuka ({q.noAccess.length})</h2>
          {q.noAccess.map((o) => (
            <div className="access-row" key={o.id}>
              <div><Link href={`/admin/pembayaran/${o.id}`}>{o.user.name ?? o.user.email}</Link><p className="small muted">{o.course.title} · {rupiah(o.amount)} · dibayar {o.paidAt ? dateTimeWib(o.paidAt) : "-"}</p></div>
              <InlineAction action={manualGrantOrder} fields={{ orderId: o.id, reason: "Lunas tetapi akses belum aktif (antrean tinjau)" }} label="Buka akses" className="btn btn-primary sm" />
            </div>
          ))}
        </section>
      )}
      {q.pending.length > 0 && (
        <section className="card pad">
          <h2>Tagihan menggantung ({q.pending.length})</h2>
          <p className="small muted">Belum dibayar lebih dari satu jam dan belum kedaluwarsa. Cek ke Mayar kalau user bilang sudah bayar.</p>
          {q.pending.map((o) => (
            <div className="access-row" key={o.id}>
              <div><Link href={`/admin/pembayaran/${o.id}`}>{o.user.name ?? o.user.email}</Link><p className="small muted">{o.course.title} · {rupiah(o.amount)} · dibuat {dateTimeWib(o.createdAt)}</p></div>
              <InlineAction action={recheckOrder} fields={{ orderId: o.id }} label="Cek ke Mayar" />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
