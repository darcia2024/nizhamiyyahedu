import { db } from "@/lib/db";
import { ActionForm, Field, InlineAction } from "@/components/ActionForm";
import { deleteVoucher, saveVoucher, setVoucherActive } from "@/app/actions/admin-vouchers";
import { dateWib } from "@/lib/format";
import { parseEmailList } from "@/lib/vouchers";
import { Empty, ManageHeading } from "./ManageUI";

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
      <ManageHeading title="Voucher" text="Buat kode diskon untuk pembeli. Diskon dihitung dari harga kursus, dan diskon 100% langsung membuka kelas tanpa lewat Mayar." />
      <section className="card pad">
        <h2>Buat voucher</h2>
        <ActionForm action={saveVoucher} submit="Buat voucher">
          <Field name="code" label="Kode voucher" maxLength={30} placeholder="Contoh: MURIDLAMA" hint="Kosongkan untuk dibuatkan kode acak." />
          <Field name="percent" label="Diskon (%)" type="number" min={1} max={100} placeholder="50" hint="1 sampai 100. Isi 100 untuk gratis." />
          <Field name="courseId" label="Berlaku untuk" type="select" defaultValue="" options={[{ value: "", label: "Semua kursus" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]} />
          <Field name="maxUses" label="Kuota pemakaian" type="number" min={1} hint="Kosongkan kalau tidak dibatasi. Satu akun hanya bisa memakai sekali." />
          <div className="field"><label htmlFor="voucher-expires">Berlaku sampai</label><input id="voucher-expires" className="input" type="date" name="expiresAt" /><span className="hint">Sampai akhir hari itu (WIB). Kosongkan kalau tidak ada batas.</span></div>
          <Field name="allowedEmails" label="Khusus email tertentu" type="textarea" rows={2} full placeholder="murid1@gmail.com, murid2@gmail.com" hint="Kosongkan kalau boleh dipakai siapa saja yang tahu kodenya." />
        </ActionForm>
      </section>
      {vouchers.length ? (
        <div className="card table-box">
          <table className="t responsive-table">
            <thead><tr><th>Kode</th><th>Diskon</th><th>Berlaku untuk</th><th>Terpakai</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {vouchers.map((v) => {
                const expired = Boolean(v.expiresAt && v.expiresAt.getTime() < now);
                const emails = parseEmailList(v.allowedEmails).length;
                return (
                  <tr key={v.id}>
                    <td data-label="Kode"><b className="table-title">{v.code}</b>{v.expiresAt && <small className="muted">Sampai {dateWib(v.expiresAt)}</small>}</td>
                    <td data-label="Diskon">{v.percent}%</td>
                    <td data-label="Berlaku untuk">{v.course?.title ?? "Semua kursus"}{emails > 0 && <small className="muted">Khusus {emails} email</small>}</td>
                    <td data-label="Terpakai">{paidBy.get(v.id) ?? 0}{v.maxUses !== null ? ` dari ${v.maxUses}` : ""}</td>
                    <td data-label="Status"><span className={`badge ${!v.active || expired ? "off" : "ok"}`}>{!v.active ? "Nonaktif" : expired ? "Kedaluwarsa" : "Aktif"}</span></td>
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
