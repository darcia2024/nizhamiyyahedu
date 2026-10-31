import Link from "next/link";
import Image from "next/image";
import { withBase } from "@/lib/base-path";
import { ArrowRight, CirclePlay, Compass, MapPin, Search } from "lucide-react";
import { PlanShowcase } from "@/components/PlanShowcase";
import { StepsShowcase } from "@/components/StepsShowcase";
import { SocialGallery } from "@/components/SocialGallery";
import { MarhalahPath } from "@/components/MarhalahPath";
import { PublicShell } from "@/components/PublicChrome";
import { LearningMockup } from "@/components/LearningMockup";
import { getContent } from "@/lib/content";
import { socialImage, socialPostUrl } from "@/lib/social";
import { buildMarhalahMap, getPublishedCourses, getTeachersForHome } from "@/lib/queries";
import { initials } from "@/lib/format";
import "@/styles/landing-live.css";
import "@/styles/lesson-band.css";

export const revalidate = 300;

/** Placeholder seperti "[Nama Ustadz]" belum layak tampil di beranda. */
const isPlaceholder = (s: string | null | undefined) => !s || s.includes("[");

export default async function HomePage() {
  const [home, faq, courses, teachers, copy, posts] = await Promise.all([
    getContent("home.main"), getContent("faq.items"), getPublishedCourses(), getTeachersForHome(), getContent("site.copy"), getContent("social.posts"),
  ]);
  const map = buildMarhalahMap(courses);
  const featured = courses.slice(0, 6);
  const previewCourse = courses.find((course) => course.hasFreePreview);
  // Kelas satuan yang punya pertemuan gratis; paket tidak punya pratinjau sendiri.
  const freeRows = courses.filter((course) => course.hasFreePreview && !course.bundleOf.length);
  const board = posts.slice(0, 3);
  const ticker = copy.tickerItems.split("|").map((s) => s.trim()).filter(Boolean);
  const realTeachers = teachers.filter((t) => !isPlaceholder(t.displayName));

  return (
    <PublicShell landing>
      <section className="lv-hero gutter" aria-labelledby="hero-h">
        <div className="lv-pattern" aria-hidden="true" />
        <p className="lv-watermark" lang="ar" dir="rtl" aria-hidden="true">دار النظامية</p>
        <div className="wrap lv-hero-grid">
          <div className="lv-hero-copy hero-enter">
            <p className="lv-place"><MapPin size={15} aria-hidden="true" /> {copy.heroPlace}<span>{home.eyebrow}</span></p>
            <h1 id="hero-h">{home.title}<br /><span>{copy.heroAccent}</span></h1>
            <p className="lv-lead">{home.sub}</p>
            <div className="landing-actions">
              <Link className="landing-btn primary" href="/kursus">{copy.heroPrimary} <ArrowRight size={17} /></Link>
              {previewCourse ? <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> {copy.heroPreview}</Link> : <Link className="landing-btn secondary" href="/#jenjang"><Compass size={17} /> {copy.heroPath}</Link>}
            </div>
            <p className="lv-note">{home.note}</p>
          </div>

          {board.length > 0 && (
            <div className="lv-board mockup-enter" aria-label={copy.boardLabel}>
              <span className="lv-board-label"><span className="lv-live" aria-hidden="true" />{copy.boardLabel}</span>
              {board.map((p, i) => (
                <a key={p.code} className={`lv-poster p${i}`} href={socialPostUrl(p.code)} target="_blank" rel="noopener noreferrer" aria-label={`Buka di Instagram: ${p.alt}`}>
                  <Image src={withBase(p.image ?? socialImage(p.code))} alt={p.alt} width={512} height={640} sizes="(max-width: 760px) 46vw, 300px" priority={i === 0} />
                  <span className="lv-poster-date">{p.date}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {ticker.length > 0 && (
        <div className="lv-ticker" aria-label="Kegiatan Nizhamiyyah">
          <div className="lv-ticker-track">
            {[0, 1].map((loop) => (
              <ul key={loop} aria-hidden={loop === 1 ? true : undefined}>
                {ticker.map((t, i) => <li key={`${loop}-${i}`}><span className="lv-star" aria-hidden="true" />{t}</li>)}
              </ul>
            ))}
          </div>
        </div>
      )}

      <section className="landing-surface">
        <SocialGallery />

        <section className="discovery-strip gutter" aria-label="Cari kitab">
          <div className="wrap discovery-inner">
            <div><span className="landing-kicker">{copy.searchKicker}</span><p>{copy.searchTitle}</p></div>
            <form className="discovery-search" action={withBase("/kursus")} method="get" role="search">
              <Search size={19} aria-hidden="true" /><label htmlFor="hero-q" className="sr-only">Cari kursus atau kitab</label>
              <input id="hero-q" name="q" type="search" minLength={2} maxLength={80} placeholder={copy.searchPlaceholder} autoComplete="off" />
              <button type="submit" aria-label="Cari kursus"><ArrowRight size={20} aria-hidden="true" /></button>
            </form>
          </div>
        </section>

        <section className="journey-section lv-journey gutter" aria-labelledby="alur-h">
          <div className="wrap lv-journey-grid">
            <div className="lv-journey-copy">
              <div className="landing-section-head" data-reveal><p className="landing-kicker">{copy.journeyKicker}</p><h2 id="alur-h">{copy.journeyTitle}</h2><p>{copy.journeyText}</p></div>
              <StepsShowcase steps={home.steps} courses={featured} linkLabel={copy.stepsLink} />
            </div>
            <figure className="lv-journey-shot" data-reveal><LearningMockup /><figcaption>{copy.heroCaption}</figcaption></figure>
          </div>
        </section>

        {map.fields.length > 0 && <section id="jenjang" className="path-section lv-path gutter" aria-labelledby="jenjang-h">
          <div className="wrap">
            <div className="landing-section-head center" data-reveal><p className="landing-kicker">{copy.pathKicker}</p><h2 id="jenjang-h">{copy.pathTitle}</h2><p>{copy.pathText}</p></div>
            <MarhalahPath map={map} notes={{ ULA: copy.levelUlaNote, WUSTHA: copy.levelWusthaNote, ULYA: copy.levelUlyaNote }} />
            <p className="lv-center-link"><Link className="landing-text-link" href="/kursus">{copy.pathLink} <ArrowRight size={16} /></Link></p>
          </div>
        </section>}

        <section id="katalog" className="catalog-showcase gutter" aria-labelledby="katalog-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">{copy.catalogKicker}</p><h2 id="katalog-h">{copy.catalogTitle}</h2></div><div><p>{copy.catalogText}</p></div></div>
            {featured.length ? <div data-reveal><PlanShowcase courses={featured} all={courses} /><p className="plan-more"><Link className="landing-text-link" href="/kursus">{copy.catalogLink} <ArrowRight size={16} /></Link></p></div> : <div className="empty-state"><h3>{copy.catalogEmptyTitle}</h3><p className="muted">{copy.catalogEmptyText}</p></div>}
          </div>
        </section>

        <section className="lf gutter" aria-labelledby="contoh-h">
          <div className="wrap lf-grid" data-reveal>
            <div className="lf-copy">
              <p className="landing-kicker">{home.bandEyebrow}</p>
              <h2 id="contoh-h">{home.bandTitle}</h2>
              <p>{home.bandText}</p>
              {freeRows.length > 0 && (
                <ul className="lf-rows" aria-label="Pertemuan yang bisa ditonton gratis">
                  {freeRows.map((c) => (
                    <li key={c.id}>
                      <Link href={`/kursus/${c.slug}/pratinjau`}>
                        <span className="lf-name">{c.title}</span>
                        <span className="lf-meta">Pertemuan 1{c.previewMin ? ` · ${c.previewMin} menit` : ""}</span>
                        <span className="lf-go">{copy.lessonButton} <ArrowRight size={16} aria-hidden="true" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <figure className="lf-matan"><span>{copy.lessonLabel}</span><p className="ar" lang="ar" dir="rtl">{home.bandAr}</p><figcaption>{home.bandCaption}</figcaption></figure>
          </div>
        </section>

        {realTeachers.length > 0 && <section id="pengajar" className="teacher-section gutter" aria-labelledby="pengajar-h"><div className="wrap"><div className="landing-section-head" data-reveal><p className="landing-kicker">{copy.teacherKicker}</p><h2 id="pengajar-h">{copy.teacherTitle}</h2></div><div className="teachers new-teachers">{realTeachers.map((teacher) => <article key={teacher.id} className="teacher" data-reveal><div className="av" aria-hidden="true">{initials(teacher.displayName)}</div><div><h3>{teacher.displayName}</h3>{teacher.alumni && !isPlaceholder(teacher.alumni) && <p className="small muted">{teacher.alumni}</p>}{teacher.sanad && !isPlaceholder(teacher.sanad) && <p className="small">{teacher.sanad}</p>}{!isPlaceholder(teacher.bio) && <p className="small bio">{teacher.bio}</p>}</div></article>)}</div></div></section>}

        <section id="faq" className="faq-section gutter" aria-labelledby="faq-h"><div className="wrap faq-layout"><div data-reveal><p className="landing-kicker">{copy.faqKicker}</p><h2 id="faq-h">{copy.faqTitle}</h2><p>{copy.faqText}</p></div><div className="faq" data-reveal>{faq.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<span className="plus" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div></section>
        <section className="cta-band gutter" aria-labelledby="cta-h"><div className="wrap cta-inner" data-reveal><h2 id="cta-h">{copy.ctaTitle}<br /><span>{copy.ctaAccent}</span></h2><p>{copy.ctaText}</p><div className="landing-actions"><Link className="landing-btn primary" href="/kursus">{copy.ctaButton} <ArrowRight size={17} /></Link>{previewCourse && <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> {copy.heroPreview}</Link>}</div></div></section>
      </section>
    </PublicShell>
  );
}
