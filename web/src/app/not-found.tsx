import Link from "next/link";
import { PublicShell } from "@/components/PublicChrome";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="err-page gutter">
        <div>
          <p className="eyebrow">Kode 404</p>
          <h1>Halaman tidak ditemukan</h1>
          <p className="muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan. Silakan kembali ke beranda atau telusuri katalog kursus.</p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/">Ke beranda</Link>
            <Link className="btn btn-ghost" href="/kursus">Lihat katalog</Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
