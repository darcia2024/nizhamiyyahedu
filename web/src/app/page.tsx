import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { ArrowRight, CirclePlay, Compass, Search } from "lucide-react";
import { PlanShowcase } from "@/components/PlanShowcase";
import { StepsShowcase } from "@/components/StepsShowcase";
import { SocialGallery } from "@/components/SocialGallery";
import { MarhalahPath } from "@/components/MarhalahPath";
import { PublicShell } from "@/components/PublicChrome";
import { LearningMockup } from "@/components/LearningMockup";
import { getContent } from "@/lib/content";
import { buildMarhalahMap, getPublishedCourses, getTeachersForHome } from "@/lib/queries";
import { initials } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [home, faq, courses, teachers, copy] = await Promise.all([
    getContent("home.main"), getContent("faq.items"), getPublishedCourses(), getTeachersForHome(), getContent("site.copy"),
  ]);
  const map = buildMarhalahMap(courses);
  const featured = courses.slice(0, 6);
  const previewCourse = courses.find((course) => course.hasFreePreview);

  return (
    <PublicShell landing>
      <section className="landing-hero gutter" aria-labelledby="hero-h">
        <div className="wrap landing-hero-inner">
          <div className="landing-copy hero-enter">
            <p className="hero-eyebrow">Nizhamiyyah Edu <span aria-hidden="true">/</span> {home.eyebrow}</p>
            <h1 id="hero-h">{home.title}<br /><span>{copy.heroAccent}</span></h1>
            <p className="landing-lead">{home.sub}</p>
            <div className="landing-actions">
              <Link className="landing-btn primary" href="/kursus">{copy.heroPrimary} <ArrowRight size={17} /></Link>
              {previewCourse ? <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> {copy.heroPreview}</Link> : <Link className="landing-btn secondary" href="/#jenjang"><Compass size={17} /> Lihat jenjang</Link>}
            </div>
            <p className="hero-search-note">{home.note}</p>
          </div>
          <div className="mockup-enter"><LearningMockup /><p className="hero-preview-caption"><span>01 / Ruang belajar</span><span>Contoh tampilan LMS</span></p></div>
        </div>
      </section>

      <section className="landing-surface">
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

        <section className="journey-section gutter" aria-labelledby="alur-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">{copy.journeyKicker}</p><h2 id="alur-h">{copy.journeyTitle}</h2></div><div><p>{copy.journeyText}</p></div></div>
            <StepsShowcase steps={home.steps} courses={featured} />
          </div>
        </section>

        {map.fields.length > 0 && <section id="jenjang" className="path-section gutter" aria-labelledby="jenjang-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">{copy.pathKicker}</p><h2 id="jenjang-h">{copy.pathTitle}</h2></div><div><p>{copy.pathText}</p><Link className="landing-text-link" href="/kursus">Jelajahi semua kursus <ArrowRight size={16} /></Link></div></div>
            <MarhalahPath map={map} />
          </div>
        </section>}

        <section id="katalog" className="catalog-showcase gutter" aria-labelledby="katalog-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">{copy.catalogKicker}</p><h2 id="katalog-h">{copy.catalogTitle}</h2></div><div><p>{copy.catalogText}</p></div></div>
            {featured.length ? <div data-reveal><PlanShowcase courses={featured} /><p className="plan-more"><Link className="landing-text-link" href="/kursus">Lihat semua kursus <ArrowRight size={16} /></Link></p></div> : <div className="empty-state"><h3>Kursus sedang disiapkan</h3><p className="muted">Jadwal kursus terbaru akan segera dipublikasikan.</p></div>}
          </div>
        </section>

        <section className="lesson-feature gutter" aria-labelledby="contoh-h"><div className="wrap lesson-panel" data-reveal><div className="lesson-copy"><p className="landing-kicker">{home.bandEyebrow}</p><h2 id="contoh-h">{home.bandTitle}</h2><p>{home.bandText}</p>{previewCourse && <Link className="landing-btn primary" href={`/kursus/${previewCourse.slug}/pratinjau`}>Buka pelajaran gratis <ArrowRight size={17} /></Link>}</div><figure className="new-matan-card"><span>Cuplikan matan</span><p className="ar" lang="ar" dir="rtl">{home.bandAr}</p><figcaption>{home.bandCaption}</figcaption></figure></div></section>

        {teachers.length > 0 && <section id="pengajar" className="teacher-section gutter" aria-labelledby="pengajar-h"><div className="wrap"><div className="landing-section-head" data-reveal><p className="landing-kicker">{copy.teacherKicker}</p><h2 id="pengajar-h">{copy.teacherTitle}</h2></div><div className="teachers new-teachers">{teachers.map((teacher) => <article key={teacher.id} className="teacher" data-reveal><div className="av" aria-hidden="true">{initials(teacher.displayName)}</div><div><h3>{teacher.displayName}</h3>{teacher.alumni && <p className="small muted">{teacher.alumni}</p>}{teacher.sanad && <p className="small">{teacher.sanad}</p>}<p className="small bio">{teacher.bio}</p></div></article>)}</div></div></section>}

        <SocialGallery />

        <section id="faq" className="faq-section gutter" aria-labelledby="faq-h"><div className="wrap faq-layout"><div data-reveal><p className="landing-kicker">{copy.faqKicker}</p><h2 id="faq-h">{copy.faqTitle}</h2><p>{copy.faqText}</p></div><div className="faq" data-reveal>{faq.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<span className="plus" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div></section>
        <section className="cta-band gutter" aria-labelledby="cta-h"><div className="wrap cta-inner" data-reveal><h2 id="cta-h">{copy.ctaTitle}<br /><span>{copy.ctaAccent}</span></h2><p>{copy.ctaText}</p><div className="landing-actions"><Link className="landing-btn primary" href="/kursus">Lihat katalog <ArrowRight size={17} /></Link>{previewCourse && <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> {copy.heroPreview}</Link>}</div></div></section>
      </section>
    </PublicShell>
  );
}
