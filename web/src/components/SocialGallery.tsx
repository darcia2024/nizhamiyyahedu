import Image from "next/image";
import { getContent } from "@/lib/content";
import { ArrowRight } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { socialImage, socialPostUrl } from "@/lib/social";
import { SocialRail } from "./SocialRail";

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
export async function SocialGallery() {
  const [copy, posts] = await Promise.all([getContent("site.copy"), getContent("social.posts")]);
  const instagramUrl = `https://www.instagram.com/${copy.instagramHandle}/`;
  if (!posts.length) return null;
  return (
    <section id="sosmed" className="social-section gutter" aria-labelledby="sosmed-h">
      <div className="wrap">
        <div className="social-intro" data-reveal>
          <div className="social-heading">
            <p className="landing-kicker">{copy.socialKicker}</p>
            <h2 id="sosmed-h">{copy.socialTitle}</h2>
          </div>
          <div className="social-summary">
            <p>{copy.socialText}</p>
            <a className="social-follow" href={instagramUrl} target="_blank" rel="noopener noreferrer">
              <span className="social-follow-icon"><InstagramGlyph size={19} /></span>
              <span><small>Ikuti di Instagram</small>@{copy.instagramHandle}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        <SocialRail label="Postingan terbaru Nizhamiyyah Edu">
          {posts.map((p, i) => (
            <li key={p.code} data-reveal style={{ ["--delay" as string]: `${(i % 4) * 70}ms` }}>
              <a className="social-card" href={socialPostUrl(p.code)} target="_blank" rel="noopener noreferrer" aria-label={`Buka di Instagram: ${p.alt}`}>
                <Image src={withBase(p.image ?? socialImage(p.code))} alt={p.alt} width={512} height={640} sizes="(max-width: 640px) 76vw, (max-width: 1100px) 36vw, 280px" loading="lazy" />
                <span className="social-over">
                  <span><InstagramGlyph size={16} /> Lihat postingan</span>
                  <small>{p.date}</small>
                </span>
              </a>
            </li>
          ))}
        </SocialRail>
        <p className="social-scroll-hint" aria-hidden="true">Geser untuk melihat kegiatan lainnya <ArrowRight size={15} /></p>
      </div>
    </section>
  );
}
