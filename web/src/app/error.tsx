"use client";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="err-page gutter">
      <div>
        <p className="eyebrow">Terjadi kesalahan</p>
        <h1>Ada yang tidak beres</h1>
        <p className="muted">Maaf, halaman ini gagal dimuat. Coba lagi sebentar. Jika berulang, hubungi admin dan sebutkan kode di bawah.</p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>Coba lagi</button>
          <Link className="btn btn-ghost" href="/">Ke beranda</Link>
        </div>
        {error.digest && <p className="small muted">Kode rujukan: {error.digest}</p>}
      </div>
    </div>
  );
}
