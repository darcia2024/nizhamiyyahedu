import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SOCIAL_POSTS, socialImage, socialPostUrl } from "@/lib/social";

/** Glyph Instagram sederhana (lucide-react v1 tidak lagi menyertakan ikon merek). */
export function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
    </svg>
  );
}

/** Galeri postingan Instagram. Setiap kartu membuka postingan aslinya di tab baru. */
export function SocialGallery() {
  return (
    <section id="sosmed" className="social-section gutter" aria-labelledby="sosmed-h">
      <div className="wrap">
        <div className="landing-section-head split" data-reveal>
          <div>
            <p className="landing-kicker">Sosial media</p>
            <h2 id="sosmed-h">Intip kegiatan kami<br />di Instagram.</h2>
          </div>
          <div>
            <p>Kelas, nadwah ilmiah, dan kabar terbaru dari Nizhamiyyah Edu di Mesir. Ikuti supaya nggak ketinggalan jadwal berikutnya.</p>
            <a className="landing-btn primary social-follow" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <InstagramGlyph size={18} /> Ikuti @{INSTAGRAM_HANDLE} <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ul className="social-grid">
          {SOCIAL_POSTS.map((p, i) => (
            <li key={p.code} data-reveal style={{ ["--delay" as string]: `${(i % 4) * 70}ms` }}>
              <a className="social-card" href={socialPostUrl(p.code)} target="_blank" rel="noopener noreferrer" aria-label={`Buka di Instagram: ${p.alt}`}>
                <Image src={withBase(socialImage(p.code))} alt="" width={512} height={640} sizes="(max-width: 640px) 46vw, (max-width: 1100px) 30vw, 270px" loading="lazy" />
                <span className="social-over"><InstagramGlyph size={18} /><small>{p.date}</small></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
