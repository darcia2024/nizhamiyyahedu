import type { Metadata } from "next";
import Link from "next/link";
import { RetryButton } from "./RetryButton";

// Disimpan service worker saat aplikasi dipasang; tampil kalau halaman yang dibuka belum pernah tersimpan dan HP sedang offline.
export const dynamic = "force-static";
export const metadata: Metadata = { title: "Sedang offline", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <main id="isi" className="offline-page">
      <div className="offline-card">
        {/* SVG inline, bukan gambar, supaya tetap tampil tanpa jaringan. */}
        <span className="offline-mark" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" stroke="#F2E6C4" strokeWidth="3.4"><path d="M16 16h32v32H16z" /><path d="m32 9 23 23-23 23L9 32z" /></svg>
        </span>
        <h1>Lagi nggak ada sinyal</h1>
        <p>Halaman ini belum tersimpan di HP kamu. Sambungkan internet lagi, nanti langsung kebuka.</p>
        <RetryButton />
        <Link className="offline-link" href="/kursus">Buka katalog yang tersimpan</Link>
      </div>
    </main>
  );
}
