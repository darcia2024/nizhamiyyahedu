"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { startCheckout, enrollFree, previewVoucher } from "./actions";
import { FieldError, SubmitButton } from "@/components/SubmitButton";
import { idle } from "@/lib/action";
import { withBase } from "@/lib/base-path";
import { rupiah } from "@/lib/format";
import type { PayData, VoucherPreview } from "@/lib/pay";
import { PayModal } from "./PayModal";

export type BuyState =
  | { kind: "guest"; loginHref: string }
  | { kind: "free" }
  | { kind: "paid" }
  | { kind: "pending"; payUrl: string; until: string; orderId: string }
  | { kind: "enrolled"; href: string }
  | { kind: "manage"; manageHref: string; previewHref: string };

type Props = {
  courseId: string;
  /** Alamat belajar setelah lunas: kelas satuan ke kelasnya, paket ke daftar kelas. */
  learnHref: string;
  title: string;
  titleAr: string | null;
  priceLabel: string;
  /** Paket: harga normal (dicoret) dan label hemat. */
  normalLabel?: string;
  saveLabel?: string;
  isFree: boolean;
  isBundle?: boolean;
  priceNumber: number;
  facts: string[];
  state: BuyState;
  autoOpen: boolean;
  whatsappDefault: string;
};

export function BuyPanel(p: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [co, coAction] = useActionState(startCheckout, idle);
  const [fr, frAction] = useActionState(enrollFree, idle);
  // Dikontrol agar isian tidak terhapus saat form di-reset setelah action mengembalikan error.
  const [wa, setWa] = useState(p.whatsappDefault);
  const [agree, setAgree] = useState(false);
  // Tagihan yang sedang dibayar di pop-up (halaman bayar Mayar tampil di dalam website ini).
  const [pay, setPay] = useState<PayData | null>(null);
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherPreview | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();

  useEffect(() => {
    if (p.autoOpen && p.state.kind === "paid") dialog.current?.showModal();
  }, [p.autoOpen, p.state.kind]);

  // Tagihan berhasil dibuat: tutup ringkasan, buka pop-up pembayaran. Voucher 100% langsung masuk kelas.
  useEffect(() => {
    if (!co.ok || !co.data) return;
    dialog.current?.close();
    if (co.data.free) window.location.assign(withBase(p.learnHref));
    else setPay(co.data);
  }, [co, p.learnHref]);

  const applyVoucher = () => {
    if (!code.trim()) { setVoucherError("Isi dulu kode vouchernya."); return; }
    startChecking(async () => {
      const r = await previewVoucher(p.courseId, code);
      if (r.ok && r.data) { setVoucher(r.data); setVoucherError(null); }
      else { setVoucher(null); setVoucherError(r.ok ? "Voucher tidak bisa dipakai." : r.error); }
    });
  };
  const removeVoucher = () => { setVoucher(null); setCode(""); setVoucherError(null); };
  const totalLabel = voucher ? (voucher.amount > 0 ? rupiah(voucher.amount) : "Rp 0") : p.priceLabel;
  const payLabel = voucher?.amount === 0 ? "Ambil kelas dengan voucher" : `Bayar ${totalLabel} lewat Mayar`;

  const fe = !co.ok ? co.fieldErrors ?? {} : {};
  const coError = !co.ok && !Object.keys(fe).length ? co.error : undefined;

  const action = (() => {
    const s = p.state;
    switch (s.kind) {
      case "guest":
        return <Link className="btn btn-primary block" href={s.loginHref} data-testid="buy-guest">{p.isFree ? "Daftar gratis" : "Daftar dan bayar"}</Link>;
      case "free":
        return (
          <form action={frAction}>
            <input type="hidden" name="courseId" value={p.courseId} />
            <SubmitButton className="btn btn-primary block" pendingText="Mendaftarkan…" testId="buy-free">Daftar gratis</SubmitButton>
            {!fr.ok && <p className="err" role="alert" style={{ marginTop: 8 }}>{fr.error}</p>}
          </form>
        );
      case "paid":
        return <button type="button" className="btn btn-primary block" onClick={() => dialog.current?.showModal()} data-testid="buy-paid">Bayar {p.priceLabel} lewat Mayar</button>;
      case "pending":
        return (
          <>
            <div className="alert info-box" role="status">Tagihan menunggu pembayaran, berlaku sampai {s.until}.</div>
            <button type="button" className="btn btn-primary block" onClick={() => setPay({ orderId: s.orderId, payUrl: s.payUrl })} data-testid="buy-pending">Lanjutkan bayar</button>
            <p className="small muted">Punya kode voucher? <Link href={`/dashboard/pembayaran/${s.orderId}`}>Batalkan dulu tagihan ini</Link>, lalu pesan lagi dengan vouchernya.</p>
          </>
        );
      case "enrolled":
        return <Link className="btn btn-primary block" href={s.href} data-testid="buy-enrolled">Lanjutkan belajar</Link>;
      case "manage":
        return (
          <>
            <Link className="btn btn-primary block" href={s.manageHref}>Kelola kursus</Link>
            <Link className="btn btn-ghost block" href={s.previewHref}>Lihat sebagai user (pratinjau)</Link>
          </>
        );
    }
  })();

  const barLabel = p.state.kind === "enrolled" ? "Lanjutkan belajar" : p.state.kind === "pending" ? "Lanjutkan bayar" : p.state.kind === "manage" ? "Kelola" : p.isFree ? "Daftar gratis" : "Daftar";
  const barNode = (() => {
    const s = p.state;
    if (s.kind === "guest") return <Link className="btn btn-cream" href={s.loginHref}>{barLabel}</Link>;
    if (s.kind === "paid") return <button type="button" className="btn btn-cream" onClick={() => dialog.current?.showModal()}>{barLabel}</button>;
    if (s.kind === "pending") return <button type="button" className="btn btn-cream" onClick={() => setPay({ orderId: s.orderId, payUrl: s.payUrl })}>{barLabel}</button>;
    if (s.kind === "enrolled") return <Link className="btn btn-cream" href={s.href}>{barLabel}</Link>;
    if (s.kind === "manage") return <Link className="btn btn-cream" href={s.manageHref}>{barLabel}</Link>;
    return (
      <form action={frAction}>
        <input type="hidden" name="courseId" value={p.courseId} />
        <SubmitButton className="btn btn-cream" pendingText="…">{barLabel}</SubmitButton>
      </form>
    );
  })();

  return (
    <>
      <aside className="buy-card" aria-label="Pendaftaran">
        <div>
          {p.normalLabel && <s className="kd-was num">{p.normalLabel}</s>}
          <div className="price num">{p.priceLabel}</div>
          {p.saveLabel && <span className="kd-hemat">{p.saveLabel}</span>}
          {!p.isFree && <p className="small muted">{p.isBundle ? "Sekali bayar, semua kelas di paket terbuka" : "Sekali bayar, akses selamanya"}</p>}
        </div>
        <ul className="ticks">
          {p.facts.map((f) => <li key={f}><Check size={16} aria-hidden="true" /><span>{f}</span></li>)}
        </ul>
        {action}
        {!p.isFree && <p className="small muted">QRIS, virtual account, dan e-wallet lewat Mayar. <Link href="/syarat">Syarat</Link> · <Link href="/refund">Refund</Link></p>}
      </aside>

      <div className="buy-bar on-dark" role="region" aria-label="Pendaftaran">
        <b className="num">{p.priceLabel}</b>
        {barNode}
      </div>

      {pay && (
        <PayModal key={pay.orderId} orderId={pay.orderId} payUrl={pay.payUrl} title={p.title} priceLabel={pay.amount ? rupiah(pay.amount) : p.priceLabel} learnHref={p.learnHref} onClose={() => setPay(null)} />
      )}

      {p.state.kind === "paid" && (
        <dialog ref={dialog} className="sheet" aria-labelledby="co-title">
          <form action={coAction} className="sheet-in" noValidate>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <h2 id="co-title" className="serif" style={{ fontSize: 22, fontWeight: 600 }}>Ringkasan pembayaran</h2>
                <p className="muted small">{p.title}</p>
              </div>
              <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => dialog.current?.close()}>✕</button>
            </div>
            <div className="sum-box">
              <div><span>{p.isBundle ? "Harga paket" : "Harga kursus"}</span><span className="num">{p.priceLabel}</span></div>
              {voucher && <div><span>Voucher {voucher.code} ({voucher.percent}%)</span><span className="num">− {rupiah(p.priceNumber - voucher.amount)}</span></div>}
              <div><span>Biaya layanan</span><span>Rp 0</span></div>
              <div><span>Total</span><span className="num">{totalLabel}</span></div>
            </div>
            <input type="hidden" name="courseId" value={p.courseId} />
            <input type="hidden" name="voucher" value={voucher?.code ?? ""} />
            <div className="field">
              <label htmlFor="voucher-code">Kode voucher (kalau ada)</label>
              <div className="voucher-row">
                <input id="voucher-code" className="input" value={code} maxLength={40} autoComplete="off" autoCapitalize="characters" readOnly={Boolean(voucher)}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setVoucherError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!voucher) applyVoucher(); } }}
                  aria-invalid={voucherError || fe.voucher ? true : undefined} aria-describedby={voucherError || fe.voucher ? "voucher-err" : undefined} data-testid="voucher-input" />
                {voucher
                  ? <button type="button" className="btn btn-ghost" onClick={removeVoucher}>Hapus</button>
                  : <button type="button" className="btn btn-ghost" onClick={applyVoucher} disabled={checking} aria-busy={checking} data-testid="voucher-apply">{checking ? "Mengecek…" : "Pakai"}</button>}
              </div>
              {voucher && <span className="hint" role="status">Voucher dipakai, hemat {voucher.percent}%.</span>}
              <FieldError id="voucher-err" message={voucherError ?? fe.voucher} />
            </div>
            <div className="field">
              <label htmlFor="wa">Nomor WhatsApp</label>
              <input id="wa" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" className="input" value={wa} onChange={(e) => setWa(e.target.value)}
                placeholder="0812 3456 7890" aria-invalid={fe.whatsapp ? true : undefined} aria-describedby={fe.whatsapp ? "wa-err" : "wa-hint"} data-testid="wa-input" />
              {!fe.whatsapp && <span id="wa-hint" className="hint">Dipakai untuk menghubungi bila ada kendala pembayaran.</span>}
              <FieldError id="wa-err" message={fe.whatsapp} />
            </div>
            <div>
              <label className="check">
                <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-describedby={fe.agree ? "agree-err" : undefined} />
                <span>Saya menyetujui <Link href="/syarat" target="_blank">Syarat dan ketentuan</Link> serta <Link href="/refund" target="_blank">Kebijakan refund</Link>.</span>
              </label>
              <FieldError id="agree-err" message={fe.agree} />
            </div>
            {coError && <div className="alert err-box" role="alert">{coError}</div>}
            <SubmitButton className="btn btn-primary block" pendingText="Membuat tagihan…" testId="pay-submit">{payLabel}</SubmitButton>
            <p className="small muted">{voucher?.amount === 0 ? "Tidak ada yang perlu dibayar. Kelas langsung terbuka." : "QRIS, virtual account, dan e-wallet lewat Mayar. Kelas terbuka otomatis setelah lunas."}</p>
          </form>
        </dialog>
      )}
    </>
  );
}
