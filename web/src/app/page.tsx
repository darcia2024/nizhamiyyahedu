import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { ArrowRight, BookOpenCheck, CirclePlay, Compass, GraduationCap, Search, ShieldCheck } from "lucide-react";
import { PlanShowcase } from "@/components/PlanShowcase";
import { StepsShowcase } from "@/components/StepsShowcase";
import { SocialGallery } from "@/components/SocialGallery";
import { MarhalahPath } from "@/components/MarhalahPath";
import { PublicShell } from "@/components/PublicChrome";
import { CourseCardView } from "@/components/CourseCard";
import { LandingMotion } from "@/components/LandingMotion";
import { LearningMockup } from "@/components/LearningMockup";
import { getContent } from "@/lib/content";
import { buildMarhalahMap, getPublishedCourses, getTeachersForHome } from "@/lib/queries";
import { initials } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [home, faq, courses, teachers] = await Promise.all([
    getContent("home.main"), getContent("faq.items"), getPublishedCourses(), getTeachersForHome(),
  ]);
  const map = buildMarhalahMap(courses);
  const featured = courses.slice(0, 6);
  const previewCourse = courses.find((course) => course.hasFreePreview);

  return (
    <PublicShell landing>
      <LandingMotion />
      <section className="landing-hero gutter" aria-labelledby="hero-h">
        <div className="wrap landing-hero-inner">
          <div className="landing-copy hero-enter">
            <p className="landing-pill"><span>Baru</span> Belajar kitab dalam satu ruang <ArrowRight size={13} /></p>
            <h1 id="hero-h">Belajar kitab.<br /><span className="hl-line"><span className="hl">Dibuat lebih terarah.</span></span></h1>
            <p className="landing-lead">Kurikulum berjenjang, matan yang gampang diikuti, dan progres yang selalu tersimpan. Belajar dari dasar sampai paham, sesuai ritme kamu.</p>
            <form className="hero-search" action={withBase("/kursus")} method="get" role="search">
              <Search size={20} aria-hidden="true" />
              <label htmlFor="hero-q" className="sr-only">Cari kursus atau kitab</label>
              <input id="hero-q" name="q" type="search" minLength={2} maxLength={80} placeholder="Cari kitab, misalnya Ajurrumiyyah" autoComplete="off" />
              <button type="submit">Cari</button>
            </form>
            <p className="hero-search-note">Katalog dan silabus terbuka tanpa login.</p>
            <div className="landing-actions">
              <Link className="landing-btn primary" href="/kursus">Mulai belajar <ArrowRight size={17} /></Link>
              {previewCourse ? <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> Coba pelajaran</Link> : <Link className="landing-btn secondary" href="/#jenjang"><Compass size={17} /> Lihat jenjang</Link>}
            </div>
            <div className="landing-proof"><span><ShieldCheck size={16} /> Silabus terbuka</span><span><BookOpenCheck size={16} /> Progres tersimpan</span><span><GraduationCap size={16} /> Belajar berjenjang</span></div>
          </div>
          <div className="mockup-enter"><LearningMockup /></div>
        </div>
      </section>

      <section className="landing-surface">
        <div className="wrap trust-strip" data-reveal>
          <p>Belajar lebih tenang dengan alur yang jelas</p>
          <div><span>Matan &amp; terjemah</span><i /><span>Video penjelasan</span><i /><span>Progres belajar</span><i /><span>Akses fleksibel</span></div>
        </div>

        <section className="journey-section gutter" aria-labelledby="alur-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">Cara belajar</p><h2 id="alur-h">Dari pilih kitab sampai naik marhalah, tiga langkah.</h2></div><div><p>Nggak perlu bingung mulai dari mana. Tiap langkah punya satu tujuan, dan bisa kamu intip dulu sebelum daftar.</p></div></div>
            <StepsShowcase steps={home.steps} courses={featured} matan={home.bandAr} />
          </div>
        </section>

        {map.fields.length > 0 && <section id="jenjang" className="path-section gutter" aria-labelledby="jenjang-h">
          <div className="wrap">
            <div className="landing-section-head split" data-reveal><div><p className="landing-kicker">Peta belajar</p><h2 id="jenjang-h">Naik jenjang tanpa<br />kehilangan arah.</h2></div><div><p>Kursus dikelompokkan per bidang ilmu dan tingkat kesulitan. Mulai dari fondasi, naik kalau sudah siap.</p><Link className="landing-text-link" href="/kursus">Jelajahi semua kursus <ArrowRight size={16} /></Link></div></div>
            <MarhalahPath map={map} />
          </div>
        </section>}

        <section id="katalog" className="catalog-showcase gutter" aria-labelledby="katalog-h">
          <div className="wrap">
            <div className="landing-section-head center" data-reveal><p className="landing-kicker">Pilihan kursus</p><h2 id="katalog-h">Pilih kitab yang pas<br />buat level kamu.</h2><p>Bandingin isi, jumlah pelajaran, dan harganya. Silabus lengkap bisa dibuka dulu tanpa login.</p></div>
            {featured.length ? <div data-reveal><PlanShowcase courses={featured} /><p className="plan-more"><Link className="landing-text-link" href="/kursus">Lihat semua kursus <ArrowRight size={16} /></Link></p></div> : <div className="empty-state"><h3>Kursus sedang disiapkan</h3><p className="muted">Jadwal kursus terbaru akan segera dipublikasikan.</p></div>}
          </div>
        </section>

        <section className="lesson-feature gutter" aria-labelledby="contoh-h"><div className="wrap lesson-panel" data-reveal><div className="lesson-copy"><p className="landing-kicker">{home.bandEyebrow}</p><h2 id="contoh-h">{home.bandTitle}</h2><p>{home.bandText}</p>{previewCourse && <Link className="landing-btn primary" href={`/kursus/${previewCourse.slug}/pratinjau`}>Buka pelajaran gratis <ArrowRight size={17} /></Link>}</div><figure className="new-matan-card"><span>Cuplikan matan</span><p className="ar" lang="ar" dir="rtl">{home.bandAr}</p><figcaption>{home.bandCaption}</figcaption><i aria-hidden="true"><CirclePlay size={22} fill="currentColor" /></i></figure></div></section>

        {teachers.length > 0 && <section id="pengajar" className="teacher-section gutter" aria-labelledby="pengajar-h"><div className="wrap"><div className="landing-section-head" data-reveal><p className="landing-kicker">Pengajar</p><h2 id="pengajar-h">Dibimbing oleh orang<br />yang memahami kitabnya.</h2></div><div className="teachers new-teachers">{teachers.map((teacher) => <article key={teacher.id} className="teacher" data-reveal><div className="av" aria-hidden="true">{initials(teacher.displayName)}</div><div><h3>{teacher.displayName}</h3>{teacher.alumni && <p className="small muted">{teacher.alumni}</p>}{teacher.sanad && <p className="small">{teacher.sanad}</p>}<p className="small bio">{teacher.bio}</p></div></article>)}</div></div></section>}

        <SocialGallery />

        <section id="faq" className="faq-section gutter" aria-labelledby="faq-h"><div className="wrap faq-layout"><div data-reveal><p className="landing-kicker">Masih penasaran?</p><h2 id="faq-h">Pertanyaan yang sering ditanyakan.</h2><p>Jawaban singkat sebelum kamu mulai belajar.</p></div><div className="faq" data-reveal>{faq.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<span className="plus" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div></section>
        <section className="cta-band gutter" aria-labelledby="cta-h"><div className="wrap cta-inner" data-reveal><h2 id="cta-h">Mulai dari satu kitab.<br /><span>Lanjut sesuai ritme kamu.</span></h2><p>Intip silabusnya, coba satu pelajaran gratis, baru putuskan.</p><div className="landing-actions"><Link className="landing-btn primary" href="/kursus">Lihat katalog <ArrowRight size={17} /></Link>{previewCourse && <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> Coba pelajaran</Link>}</div></div></section>
      </section>
    </PublicShell>
  );
}
