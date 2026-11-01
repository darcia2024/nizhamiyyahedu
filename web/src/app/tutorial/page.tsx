import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "@/styles/tutorial.css";
import { requireRole } from "@/lib/auth-guard";
import { withBase } from "@/lib/base-path";
import { GUIDES } from "./guides";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tutorial superadmin", robots: { index: false, follow: false } };

export default async function TutorialPage() {
  await requireRole(["ADMIN"], "/tutorial");
  return (
    <main id="isi" className="tutorial gutter">
      <div className="tutorial-wrap">
        <Link className="btn btn-ghost sm" href="/admin"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke panel</Link>
        <header className="tutorial-head">
          <p className="eyebrow">Tutorial superadmin</p>
          <h1>Cara mengatur website</h1>
          <p>Assalamu&apos;alaikum, Sidi. Di halaman ini saya tunjukkan cara mengatur website langkah demi langkah, supaya Sidi bisa mengerjakannya sendiri tanpa perlu menunggu orang lain.</p>
          <p>Tidak perlu dibaca berurutan. Pilih saja yang sedang Sidi butuhkan dari daftar di bawah. Gambarnya diambil dari panel yang asli, dan bagian yang perlu ditekan saya beri kotak merah. Nama, email, dan angka pendapatan sengaja saya samarkan.</p>
        </header>
        <nav className="card pad tutorial-toc" aria-label="Daftar isi tutorial">
          <h2>Mau mengerjakan apa, Sidi?</h2>
          <ol>{GUIDES.map((g) => <li key={g.id}><a href={`#${g.id}`}>{g.title}</a></li>)}</ol>
        </nav>
        {GUIDES.map((g, i) => (
          <section className="card pad tutorial-guide" id={g.id} key={g.id}>
            <p className="eyebrow">Bagian {i + 1}</p>
            <h2>{g.title}</h2>
            <p>{g.intro}</p>
            <ol className="tutorial-steps">
              {g.steps.map((s) => (
                <li key={s.text}>
                  <p>{s.text}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.shot && <img className="help-shot" src={withBase(`/tutorial/${s.shot}.jpg`)} alt={s.alt ?? ""} width={800} height={528} loading="lazy" />}
                </li>
              ))}
            </ol>
            {g.note && <p className="alert tutorial-note"><strong>Perlu diingat:</strong> {g.note}</p>}
            {g.href && <Link className="btn btn-ghost sm" href={g.href}>Buka halamannya <ArrowRight size={16} aria-hidden="true" /></Link>}
          </section>
        ))}
        <p className="tutorial-end">Kalau ada yang masih membingungkan atau ada tampilan yang berbeda dari gambar di sini, kabari saya saja, Sidi. Semoga bermanfaat.</p>
      </div>
    </main>
  );
}
