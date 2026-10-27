import Link from "next/link";
import { ArrowRight, BookOpenCheck, CirclePlay, Compass, GraduationCap, Layers3, Search, ShieldCheck } from "lucide-react";
import { PlanShowcase } from "@/components/PlanShowcase";
import { PublicShell } from "@/components/PublicChrome";
import { CourseCardView } from "@/components/CourseCard";
import { LandingMotion } from "@/components/LandingMotion";
import { LearningMockup } from "@/components/LearningMockup";
import { getContent } from "@/lib/content";
import { buildMarhalahMap, getPublishedCourses, getTeachersForHome } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL, LEVEL_NOTE } from "@/lib/constants";
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
            <p className="landing-lead">Kurikulum berjenjang, matan yang mudah diikuti, dan progres yang selalu tersimpan. Belajar dari dasar sampai paham, sesuai ritme Anda.</p>
            <form className="hero-search" action="/kursus" method="get" role="search">
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
          <div className="mockup-enter"><LearningMockup courses={featured} /></div>
        </div>
      </section>

      <section className="landing-surface">
        <div className="wrap trust-strip" data-reveal>
          <p>Belajar lebih tenang dengan alur yang jelas</p>
          <div><span>Matan &amp; terjemah</span><i /><span>Video penjelasan</span><i /><span>Progres belajar</span><i /><span>Akses fleksibel</span></div>
        </div>

        <section className="journey-section gutter" aria-labelledby="alur-h">
          <div className="wrap">
            <div className="landing-section-head" data-reveal><p className="landing-kicker">Satu ruang belajar</p><h2 id="alur-h">Dari pilih kitab sampai<br />lanjut ke marhalah berikutnya.</h2><p>Tidak perlu menebak harus mulai dari mana. Setiap langkah dibuat sederhana dan saling terhubung.</p></div>
            <ol className="journey-grid">{home.steps.map((step, index) => <li key={step.title} data-reveal style={{ ["--delay" as string]: `${index * 90}ms` }}><span className="journey-no">0{index + 1}</span><div className={`journey-icon ji-${index}`} aria-hidden="true">{index === 0 ? <Compass /> : index === 1 ? <BookOpenCheck /> : <Layers3 />}</div><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
          </div>
        </section>

        {map.fields.length > 0 && <section id="jenjang" className="path-section gutter" aria-labelledby="jenjang-h">
          <div className="wrap path-panel" data-reveal>
            <div className="path-copy"><p className="landing-kicker">Peta belajar</p><h2 id="jenjang-h">Naik jenjang tanpa kehilangan arah.</h2><p>Kursus disusun berdasarkan bidang ilmu dan tingkat kesulitan. Mulai dari fondasi, lalu lanjut saat sudah siap.</p><Link className="landing-text-link" href="/kursus">Jelajahi semua kursus <ArrowRight size={16} /></Link></div>
            <div className="map-card landing-map" aria-label="Peta jenjang belajar" style={{ ["--cols" as string]: map.fields.length }}><div className="stage-grid" role="table" aria-label="Kursus per jenjang dan bidang ilmu"><div role="row" className="stage-row"><span className="th" role="columnheader">Jenjang</span>{map.fields.map((field) => <span key={field} className="th" role="columnheader">{FIELD_LABEL[field]}</span>)}</div>{map.levels.map((level) => <Row key={level} level={level} fields={map.fields} cell={map.cell} />)}</div></div>
          </div>
        </section>}

        <section id="katalog" className="catalog-showcase gutter" aria-labelledby="katalog-h">
          <div className="wrap">
            <div className="landing-section-head center" data-reveal><p className="landing-kicker">Pilihan kursus</p><h2 id="katalog-h">Pilih kitab yang sesuai<br />dengan level Anda.</h2><p>Bandingkan isi, jumlah pelajaran, dan harga. Silabus lengkap bisa dibuka dulu tanpa login.</p></div>
            {featured.length ? <div data-reveal><PlanShowcase courses={featured} /><p className="plan-more"><Link className="landing-text-link" href="/kursus">Lihat semua kursus <ArrowRight size={16} /></Link></p></div> : <div className="empty-state"><h3>Kursus sedang disiapkan</h3><p className="muted">Jadwal kursus terbaru akan segera dipublikasikan.</p></div>}
          </div>
        </section>

        <section className="lesson-feature gutter" aria-labelledby="contoh-h"><div className="wrap lesson-panel" data-reveal><div className="lesson-copy"><p className="landing-kicker">{home.bandEyebrow}</p><h2 id="contoh-h">{home.bandTitle}</h2><p>{home.bandText}</p>{previewCourse && <Link className="landing-btn primary" href={`/kursus/${previewCourse.slug}/pratinjau`}>Buka pelajaran gratis <ArrowRight size={17} /></Link>}</div><figure className="new-matan-card"><span>Cuplikan matan</span><p className="ar" lang="ar" dir="rtl">{home.bandAr}</p><figcaption>{home.bandCaption}</figcaption><i aria-hidden="true"><CirclePlay size={22} fill="currentColor" /></i></figure></div></section>

        {teachers.length > 0 && <section id="pengajar" className="teacher-section gutter" aria-labelledby="pengajar-h"><div className="wrap"><div className="landing-section-head" data-reveal><p className="landing-kicker">Pengajar</p><h2 id="pengajar-h">Dibimbing oleh orang<br />yang memahami kitabnya.</h2></div><div className="teachers new-teachers">{teachers.map((teacher) => <article key={teacher.id} className="teacher" data-reveal><div className="av" aria-hidden="true">{initials(teacher.displayName)}</div><div><h3>{teacher.displayName}</h3>{teacher.alumni && <p className="small muted">{teacher.alumni}</p>}{teacher.sanad && <p className="small">{teacher.sanad}</p>}<p className="small bio">{teacher.bio}</p></div></article>)}</div></div></section>}

        <section id="faq" className="faq-section gutter" aria-labelledby="faq-h"><div className="wrap faq-layout"><div data-reveal><p className="landing-kicker">Masih ingin tahu?</p><h2 id="faq-h">Pertanyaan yang sering ditanyakan.</h2><p>Jawaban singkat sebelum Anda mulai belajar.</p></div><div className="faq" data-reveal>{faq.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<span className="plus" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div></section>
        <section className="cta-band gutter" aria-labelledby="cta-h"><div className="wrap cta-inner" data-reveal><h2 id="cta-h">Mulai dari satu kitab.<br /><span>Lanjut sesuai ritme Anda.</span></h2><p>Lihat silabusnya, coba satu pelajaran gratis, lalu putuskan.</p><div className="landing-actions"><Link className="landing-btn primary" href="/kursus">Lihat katalog <ArrowRight size={17} /></Link>{previewCourse && <Link className="landing-btn secondary" href={`/kursus/${previewCourse.slug}/pratinjau`}><CirclePlay size={17} /> Coba pelajaran</Link>}</div></div></section>
      </section>
    </PublicShell>
  );
}

function Row({ level, fields, cell }: { level: keyof typeof LEVEL_LABEL; fields: ReturnType<typeof buildMarhalahMap>["fields"]; cell: ReturnType<typeof buildMarhalahMap>["cell"] }) {
  return <div role="row" className="stage-row"><div role="rowheader"><b>{LEVEL_LABEL[level]}</b><small>{LEVEL_NOTE[level]}</small></div>{fields.map((field) => { const course = cell(field, level); return course ? <div key={field} role="cell"><Link className="cell" href={`/kursus/${course.slug}`}><span className="ar" lang="ar" dir="rtl">{course.titleAr ?? course.title}</span><small>{course.title}</small></Link></div> : <div key={field} role="cell"><span className="empty">Segera</span></div>; })}</div>;
}
