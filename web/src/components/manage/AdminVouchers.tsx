import { db } from "@/lib/db";
import { InlineAction } from "@/components/ActionForm";
import { deleteVoucher, setVoucherActive } from "@/app/actions/admin-vouchers";
import { dateTimeWib, rupiah } from "@/lib/format";
import { discountLabel, parseEmailList } from "@/lib/vouchers";
import { Empty, ManageHeading } from "./ManageUI";
import { VoucherForm } from "./VoucherForm";

export async function AdminVouchers() {
  const [vouchers, courses, paid] = await Promise.all([
    db.voucher.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { course: { select: { title: true } }, _count: { select: { orders: true } } } }),
    db.course.findMany({ where: { archivedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.order.groupBy({ by: ["voucherId"], where: { status: "PAID", voucherId: { not: null } }, _count: true }),
  ]);
  const paidBy = new Map(paid.map((p) => [p.voucherId, p._count]));
  const now = Date.now();
  return (
    <>
      <ManageHeading title="Voucher" text="Buat kode diskon untuk pembeli. Kalau harga jadi Rp 0, kelas langsung terbuka tanpa lewat Mayar." />
      <section className="card pad">
        <h2>Buat diskon</h2>
        <VoucherForm courses={courses} />
      </section>
      {vouchers.length ? (
        <div className="card table-box">
          <table className="t responsive-table">
            <thead><tr><th>Nama dan kode</th><th>Besaran</th><th>Untuk</th><th>Terpakai</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {vouchers.map((v) => {
                const expired = Boolean(v.expiresAt && v.expiresAt.getTime() < now);
                const waiting = Boolean(v.startsAt && v.startsAt.getTime() > now);
                const used = paidBy.get(v.id) ?? 0;
                const emails = parseEmailList(v.allowedEmails).length;
                const status = !v.active ? "Nonaktif" : expired ? "Kedaluwarsa" : v.maxUses !== null && used >= v.maxUses ? "Kuota habis" : waiting ? "Belum mulai" : "Aktif";
                return (
                  <tr key={v.id}>
                    <td data-label="Kode"><b className="table-title">{v.code}</b>{v.name && <small className="muted">{v.name}</small>}{v.expiresAt && <small className="muted">Sampai {dateTimeWib(v.expiresAt)}</small>}</td>
                    <td data-label="Besaran">{discountLabel(v)}{v.minPurchase ? <small className="muted">Min. {rupiah(v.minPurchase)}</small> : null}</td>
                    <td data-label="Untuk">{v.course?.title ?? "Semua produk"}<small className="muted">{emails ? `Khusus ${emails} email` : "Semua pelanggan"}</small></td>
                    <td data-label="Terpakai">{used}{v.maxUses !== null ? ` dari ${v.maxUses}` : ""}<small className="muted">{v.singleUse ? "Sekali pakai per akun" : "Berulang"}</small></td>
                    <td data-label="Status"><span className={`badge ${status === "Aktif" ? "ok" : status === "Belum mulai" ? "wait" : "off"}`}>{status}</span></td>
                    <td data-label="Aksi">
                      <div className="row-actions" style={{ alignItems: "flex-start" }}>
                        <InlineAction action={setVoucherActive} fields={{ id: v.id, active: v.active ? "0" : "1" }} label={v.active ? "Nonaktifkan" : "Aktifkan"} />
                        {v._count.orders === 0 && <InlineAction action={deleteVoucher} fields={{ id: v.id }} label="Hapus" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty title="Belum ada voucher" text="Voucher yang dibuat akan tampil di sini." />}
    </>
  );
}
