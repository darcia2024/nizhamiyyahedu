"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, TriangleAlert, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { PAY_MESSAGE } from "@/lib/pay";
import "@/styles/pay-modal.css";

type Status = "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "CANCELLED";

const POLL_MS = 4000;
const POLL_MAX = 300; // sekitar 20 menit, lebih lama dari ini cukup buka lagi dari tombol "Lanjutkan bayar"

/**
 * Pop-up pembayaran: halaman bayar Mayar tampil di dalam website ini (iframe), pengguna tidak berpindah halaman.
 * Status dicek berkala ke server (yang bertanya ke Mayar); begitu lunas, isi pop-up berganti jadi tombol mulai belajar.
 */
export function PayModal({ orderId, payUrl, title, priceLabel, learnHref, onClose }: {
  orderId: string;
  payUrl: string;
  title: string;
  priceLabel: string;
  learnHref: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("PENDING");
  const [loaded, setLoaded] = useState(false);
  // blocked: iframe tidak bisa dipakai (dilarang Mayar, atau aturan keamanan halaman ini masih versi lama); refresh: sarankan muat ulang.
  const [embed, setEmbed] = useState<{ blocked: boolean; reason: string | null; refresh?: boolean }>({ blocked: false, reason: null });

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  useEffect(() => {
    if (status !== "PENDING") return;
    let n = 0;
    let stop = false;
    const t = setInterval(async () => {
      n += 1;
      if (n > POLL_MAX) { clearInterval(t); return; }
      try {
        // Tiap 3 kali (±12 detik) minta server bertanya langsung ke Mayar; sisanya cukup baca database.
        const res = await fetch(withBase(`/api/orders/${orderId}${n % 3 === 0 ? "?check=1" : ""}`), { cache: "no-store" });
        if (!res.ok || stop) return;
        const j = (await res.json()) as { status?: Status };
        if (j.status && j.status !== "PENDING" && !stop) setStatus(j.status);
      } catch { /* jaringan putus sebentar: coba lagi di putaran berikutnya */ }
    }, POLL_MS);
    return () => { stop = true; clearInterval(t); };
  }, [orderId, status]);

  // Server memeriksa dulu apakah Mayar mengizinkan halamannya di-iframe; kalau tidak, langsung pakai jendela cadangan.
  useEffect(() => {
    let off = false;
    fetch(withBase(`/api/orders/${orderId}?probe=1`), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { embed?: { embeddable?: boolean; reason?: string | null } } | null) => {
        if (!off && j?.embed && j.embed.embeddable === false) setEmbed({ blocked: true, reason: j.embed.reason ?? "Halaman pembayaran tidak bisa ditampilkan di sini." });
      })
      .catch(() => undefined);
    return () => { off = true; };
  }, [orderId]);

  // Browser melaporkan bila aturan keamanan halaman ini sendiri yang memblokir iframe (halaman dimuat sebelum aturan baru berlaku).
  useEffect(() => {
    const on = (e: SecurityPolicyViolationEvent) => {
      if (!/^(frame-src|child-src)/.test(e.violatedDirective)) return;
      setEmbed({ blocked: true, refresh: true, reason: "Halaman ini belum memuat aturan keamanan terbaru. Muat ulang halaman (Ctrl+Shift+R), lalu klik bayar lagi." });
    };
    document.addEventListener("securitypolicyviolation", on);
    return () => document.removeEventListener("securitypolicyviolation", on);
  }, []);

  /** Jendela pembayaran kecil di tengah layar; pop-up ini tetap terbuka dan menunggu lunas. */
  const openWindow = () => {
    const w = 480, h = 780;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
    const win = window.open(payUrl, "mayar-pay", `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
    if (!win) window.open(payUrl, "_blank", "noopener,noreferrer"); // jendela pop-up diblokir browser: buka sebagai tab biasa
  };
  // Halaman balasan Mayar (di dalam iframe) memberi tahu induknya begitu statusnya berubah, jadi tidak perlu menunggu putaran berikutnya.
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; orderId?: string; status?: Status } | null;
      if (!d || d.type !== PAY_MESSAGE || d.orderId !== orderId || !d.status || d.status === "PENDING") return;
      setStatus(d.status);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [orderId]);

  useEffect(() => { if (status === "PAID") router.refresh(); }, [status, router]);

  return (
    <dialog ref={ref} className="pay-modal" aria-labelledby="pay-h" onClose={onClose}>
      <header className="pay-head">
        <div>
          <h2 id="pay-h">Pembayaran</h2>
          <p>{title} · <b className="num">{priceLabel}</b></p>
        </div>
        <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => ref.current?.close()}><X size={18} aria-hidden="true" /></button>
      </header>

      {status === "PENDING" && (
        <>
          {embed.blocked ? (
            <div className="pay-fallback" data-testid="pay-fallback">
              <TriangleAlert size={36} aria-hidden="true" className="bad" />
              <h3>Lanjutkan di jendela pembayaran</h3>
              <p>{embed.reason}</p>
              <button type="button" className="btn btn-primary" onClick={openWindow}>Buka jendela pembayaran <ExternalLink size={15} aria-hidden="true" /></button>
              {embed.refresh && <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Muat ulang halaman</button>}
              <p className="small">Pop-up ini tetap di sini dan otomatis berganti begitu pembayaranmu lunas.</p>
            </div>
          ) : (
            <div className="pay-frame">
              {!loaded && <p className="pay-loading" role="status">Memuat halaman pembayaran…</p>}
              <iframe title="Halaman pembayaran" src={payUrl} onLoad={() => setLoaded(true)} allow="payment; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          )}
          <footer className="pay-foot">
            <span className="pay-wait" role="status"><i aria-hidden="true" /> Menunggu pembayaran. Kelas terbuka otomatis setelah lunas.</span>
            {!embed.blocked && <button type="button" className="pay-link" onClick={openWindow}>Tidak tampil, atau mau bayar di aplikasi e-wallet? Buka jendela pembayaran <ExternalLink size={13} aria-hidden="true" /></button>}
          </footer>
        </>
      )}

      {status === "PAID" && (
        <div className="pay-done" data-testid="pay-paid">
          <CheckCircle2 size={44} aria-hidden="true" className="ok" />
          <h3>Pembayaran diterima</h3>
          <p>Terima kasih. Kelasnya sudah terbuka dan bisa langsung kamu tonton.</p>
          <Link className="btn btn-primary" href={learnHref} onClick={() => ref.current?.close()}>Mulai belajar</Link>
        </div>
      )}

      {(status === "EXPIRED" || status === "FAILED" || status === "CANCELLED") && (
        <div className="pay-done">
          <TriangleAlert size={40} aria-hidden="true" className="bad" />
          <h3>{status === "EXPIRED" ? "Tagihan kedaluwarsa" : status === "FAILED" ? "Pembayaran gagal" : "Pembayaran dibatalkan"}</h3>
          <p>Nggak ada dana yang terpotong dari tagihan ini. Tutup jendela ini lalu klik bayar lagi untuk membuat tagihan baru.</p>
          <button type="button" className="btn btn-primary" onClick={() => ref.current?.close()}>Tutup</button>
        </div>
      )}
    </dialog>
  );
}
