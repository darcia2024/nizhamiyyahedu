"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { startCheckout, enrollFree } from "./actions";
import { FieldError, SubmitButton } from "@/components/SubmitButton";
import { idle } from "@/lib/action";

export type BuyState =
  | { kind: "guest"; loginHref: string }
  | { kind: "free" }
  | { kind: "paid" }
  | { kind: "pending"; payUrl: string; until: string }
  | { kind: "enrolled"; href: string }
  | { kind: "manage"; manageHref: string; previewHref: string };

type Props = {
  courseId: string;
  title: string;
  titleAr: string | null;
  priceLabel: string;
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

  useEffect(() => {
    if (p.autoOpen && p.state.kind === "paid") dialog.current?.showModal();
  }, [p.autoOpen, p.state.kind]);

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
            <a className="btn btn-primary block" href={s.payUrl} data-testid="buy-pending">Lanjutkan bayar</a>
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
    if (s.kind === "pending") return <a className="btn btn-cream" href={s.payUrl}>{barLabel}</a>;
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
          <div className="price num">{p.priceLabel}</div>
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
              <div><span>Biaya layanan</span><span>Rp 0</span></div>
              <div><span>Total</span><span className="num">{p.priceLabel}</span></div>
            </div>
            <input type="hidden" name="courseId" value={p.courseId} />
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
            <SubmitButton className="btn btn-primary block" pendingText="Membuat tagihan…" testId="pay-submit">Bayar {p.priceLabel} lewat Mayar</SubmitButton>
            <p className="small muted">QRIS, virtual account, dan e-wallet lewat Mayar. Kelas terbuka otomatis setelah lunas.</p>
          </form>
        </dialog>
      )}
    </>
  );
}
