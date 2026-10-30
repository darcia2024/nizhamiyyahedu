import type { Metadata } from "next";
import Link from "next/link";
import { RetryButton } from "./RetryButton";
import { withBase } from "@/lib/base-path";

// Disimpan service worker saat aplikasi dipasang; tampil kalau halaman yang dibuka belum pernah tersimpan dan HP sedang offline.
export const dynamic = "force-static";
export const metadata: Metadata = { title: "Sedang offline", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <main id="isi" className="offline-page">
      <div className="offline-card">
        {/* Ikon aplikasi sudah disimpan service worker sejak dipasang, jadi tetap tampil tanpa jaringan. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="offline-mark" src={withBase("/icon-192.png")} alt="" width={76} height={76} />
        <h1>Lagi nggak ada sinyal</h1>
        <p>Halaman ini belum tersimpan di HP kamu. Sambungkan internet lagi, nanti langsung kebuka.</p>
        <RetryButton />
        <Link className="offline-link" href="/kursus">Buka katalog yang tersimpan</Link>
      </div>
    </main>
  );
}
