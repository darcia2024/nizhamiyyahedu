import Link from "next/link";
import { PublicShell } from "@/components/PublicChrome";
import { CourseCardView } from "@/components/CourseCard";
import { getContent } from "@/lib/content";
import { buildMarhalahMap, getPublishedCourses, getTeachersForHome } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL, LEVEL_NOTE } from "@/lib/constants";
import { initials } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [home, faq, courses, teachers] = await Promise.all([
    getContent("home.main"),
    getContent("faq.items"),
    getPublishedCourses(),
    getTeachersForHome(),
  ]);
  const map = buildMarhalahMap(courses);
  const featured = courses.slice(0, 6);
  const previewCourse=courses.find(c=>c.hasFreePreview);

  return (
    <PublicShell>
      <section className="hero gutter" aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-copy">
            <p className="eyebrow">{home.eyebrow}</p>
            <h1 id="hero-h">{home.title}</h1>
            <p className="lead">{home.sub}</p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/kursus" data-testid="cta-katalog">Lihat katalog kursus</Link>
              <Link className="btn btn-ghost" href="/#jenjang" data-testid="cta-jenjang">Cari jenjang yang cocok</Link>
            </div>
            <p className="small muted">{home.note}</p>
          </div>

          {map.fields.length > 0 && (
            <aside id="jenjang" className="map-card" aria-label="Peta jenjang belajar" style={{ ["--cols" as string]: map.fields.length }}>
              <h2>Peta marhalah</h2>
              <div className="stage-grid" role="table" aria-label="Kursus per jenjang dan bidang ilmu">
                <div role="row" className="stage-row"><span className="th" role="columnheader">Jenjang</span>
                {map.fields.map((f) => <span key={f} className="th" role="columnheader">{FIELD_LABEL[f]}</span>)}</div>
                {map.levels.map((l) => (
                  <Row key={l} level={l} fields={map.fields} cell={map.cell} />
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="band-white gutter" aria-labelledby="alur-h">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 id="alur-h" className="serif" style={{ fontWeight: 600, fontSize: 26 }}>Dari daftar sampai belajar, tiga langkah</h2>
          <ol className="steps">
            {home.steps.map((s, i) => (
              <li key={i}>
                <span className="n" aria-hidden="true">{i + 1}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <b style={{ fontSize: 17 }}>{s.title}</b>
                  <span className="muted">{s.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="katalog" className="sec gutter" aria-labelledby="katalog-h">
        <div className="wrap">
          <div className="sec-head">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 id="katalog-h" className="t serif">Katalog kursus</h2>
              <p className="muted">Terbuka untuk semua pengunjung. Login baru dibutuhkan saat mendaftar.</p>
            </div>
            <Link className="btn btn-ghost sm" href="/kursus">Lihat semua kursus</Link>
          </div>
          {featured.length ? (
            <div className="grid-cards">{featured.map((c) => <CourseCardView key={c.id} c={c} />)}</div>
          ) : (
            <div className="empty-state">
              <h3 className="serif" style={{ fontSize: 22 }}>Kursus sedang disiapkan</h3>
              <p className="muted">Jadwal kursus terbaru akan segera dipublikasikan. Anda tetap bisa membuat akun dan bersiap.</p>
              <Link className="btn btn-primary" href="/masuk">Masuk ke dashboard</Link>
            </div>
          )}
        </div>
      </section>

      <section className="gutter" aria-labelledby="contoh-h" style={{ paddingBottom: 72 }}>
        <div className="wrap band-dark on-dark">
          <div style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <p className="eyebrow">{home.bandEyebrow}</p>
            <h2 id="contoh-h">{home.bandTitle}</h2>
            <p style={{ lineHeight: 1.6 }}>{home.bandText}</p>
            {previewCourse && <Link className="btn btn-cream" style={{ alignSelf: "flex-start" }} href={`/kursus/${previewCourse.slug}/pratinjau`}>Coba pelajaran pratinjau</Link>}
          </div>
          <figure className="matan-quote">
            <p className="ar" lang="ar" dir="rtl">{home.bandAr}</p>
            <figcaption style={{ color: "#C9D6CE", fontSize: 15, lineHeight: 1.6 }}>{home.bandCaption}</figcaption>
          </figure>
        </div>
      </section>

      {teachers.length > 0 && (
        <section id="pengajar" className="gutter" aria-labelledby="pengajar-h" style={{ paddingBottom: 72 }}>
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h2 id="pengajar-h" className="t serif" style={{ fontWeight: 600, fontSize: 36, lineHeight: 1.15 }}>Pengajar</h2>
            <div className="teachers">
              {teachers.map((t) => (
                <article key={t.id} className="teacher">
                  <div className="av" aria-hidden="true">{initials(t.displayName)}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <h3>{t.displayName}</h3>
                    {t.alumni && <p className="small muted">{t.alumni}</p>}
                    {t.sanad && <p className="small">{t.sanad}</p>}
                    <p className="small" style={{ lineHeight: 1.55 }}>{t.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="faq" className="band-white gutter" aria-labelledby="faq-h" style={{ paddingBlock: 64, borderBottom: 0 }}>
        <div className="faq">
          <h2 id="faq-h" className="serif" style={{ fontWeight: 600, fontSize: 32, marginBottom: 20 }}>Tanya jawab</h2>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {faq.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary>{f.q}<span className="plus" aria-hidden="true">+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function Row({ level, fields, cell }: { level: keyof typeof LEVEL_LABEL; fields: ReturnType<typeof buildMarhalahMap>["fields"]; cell: ReturnType<typeof buildMarhalahMap>["cell"] }) {
  return (
    <div role="row" className="stage-row">
      <div role="rowheader"><b>{LEVEL_LABEL[level]}</b><small>{LEVEL_NOTE[level]}</small></div>
      {fields.map((f) => {
        const c = cell(f, level);
        return c ? (
          <div key={f} role="cell"><Link className="cell" href={`/kursus/${c.slug}`}>
            <span className="ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</span>
            <small>{c.title}</small>
          </Link></div>
        ) : (
          <div key={f} role="cell"><span className="empty">Segera</span></div>
        );
      })}
    </div>
  );
}
