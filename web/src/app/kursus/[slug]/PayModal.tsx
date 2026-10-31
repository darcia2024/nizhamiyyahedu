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
          <div className="pay-frame">
            {!loaded && <p className="pay-loading" role="status">Memuat halaman pembayaran…</p>}
            <iframe title="Halaman pembayaran" src={payUrl} onLoad={() => setLoaded(true)} allow="payment; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
          <footer className="pay-foot">
            <span className="pay-wait" role="status"><i aria-hidden="true" /> Menunggu pembayaran. Kelas terbuka otomatis setelah lunas.</span>
            <a href={payUrl} target="_blank" rel="noopener noreferrer">Tidak tampil, atau mau bayar di aplikasi e-wallet? Buka di tab baru <ExternalLink size={13} aria-hidden="true" /></a>
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
