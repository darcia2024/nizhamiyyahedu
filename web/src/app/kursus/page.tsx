import Link from "next/link";
import { withBase } from "@/lib/base-path";
import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicChrome";
import { KitabGrid } from "@/components/KitabCard";
import { filterCourses, getPublishedCourses } from "@/lib/queries";
import { FIELDS, FIELD_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Katalog kursus",
  description: "Semua kursus kitab Nizhamiyyah Edu. Lihat silabus, pengajar, dan harga tanpa login.",
  alternates: { canonical: "/kursus" },
};

type SP = { q?: string; bidang?: string; jenjang?: string; gratis?: string; urut?: string; hal?: string };
const PAGE = 12;

function href(sp: SP, patch: Partial<SP>) {
  const m = { ...sp, ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/kursus?${s}` : "/kursus";
}

export default async function KatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await getPublishedCourses();
  const filtered = filterCourses(all, {
    q: sp.q,
    field: FIELDS.includes(sp.bidang as never) ? sp.bidang : undefined,
    level: LEVELS.includes(sp.jenjang as never) ? sp.jenjang : undefined,
    free: sp.gratis === "1",
    sort: sp.urut,
  });
  const page = Math.max(1, Number(sp.hal) || 1);
  const shown = filtered.slice(0, page * PAGE);
  const usedFields = FIELDS.filter((f) => all.some((c) => c.field === f));
  const base: SP = { q: sp.q, bidang: sp.bidang, jenjang: sp.jenjang, gratis: sp.gratis, urut: sp.urut };
  const hasFilter = Boolean(sp.q || sp.bidang || sp.jenjang || sp.gratis);

  return (
    <PublicShell>
      <section className="lv-band gutter" aria-labelledby="katalog-h">
        <div className="lv-pattern" aria-hidden="true" />
        <p className="lv-watermark" lang="ar" dir="rtl" aria-hidden="true">خزانة الكتب</p>
        <div className="wrap lv-band-inner">
          <p className="star-kicker">Khizanah kitab Nizhamiyyah</p>
          <h1 id="katalog-h">Katalog kursus</h1>
          <p role="status">{filtered.length} kursus · silabus dan pengajarnya bisa dilihat tanpa login</p>
        </div>
      </section>
      <div className="gutter">
        <div className="wrap">

          <form className="filters" method="get" action={withBase("/kursus")} role="search">
            <div className="searchbox">
              <label className="sr-only" htmlFor="q">Cari kursus atau kitab</label>
              <input id="q" name="q" type="search" className="input" placeholder="Cari kursus atau kitab…" defaultValue={sp.q ?? ""} minLength={2} maxLength={80} />
              {sp.bidang && <input type="hidden" name="bidang" value={sp.bidang} />}
              {sp.jenjang && <input type="hidden" name="jenjang" value={sp.jenjang} />}
              {sp.gratis && <input type="hidden" name="gratis" value={sp.gratis} />}
              <button className="btn btn-primary sm" type="submit">Cari</button>
            </div>
            <div className="filter-row" role="group" aria-label="Saring bidang ilmu">
              <Link className="chip" href={href(base, { bidang: undefined, hal: undefined })} aria-current={!sp.bidang ? "true" : undefined}>Semua</Link>
              {usedFields.map((f) => (
                <Link key={f} className="chip" href={href(base, { bidang: f, hal: undefined })} aria-current={sp.bidang === f ? "true" : undefined}>{FIELD_LABEL[f]}</Link>
              ))}
              {(sp.gratis || all.some((c) => c.priceRupiah === 0)) && <Link className="chip" href={href(base, { gratis: sp.gratis ? undefined : "1", hal: undefined })} aria-current={sp.gratis ? "true" : undefined}>Gratis</Link>}
            </div>
            <div className="filter-row" role="group" aria-label="Saring jenjang">
              <span className="small muted">Jenjang:</span>
              <Link className="chip" href={href(base, { jenjang: undefined })} aria-current={!sp.jenjang ? "true" : undefined}>Semua</Link>
              {LEVELS.map((l) => (
                <Link key={l} className="chip" href={href(base, { jenjang: l })} aria-current={sp.jenjang === l ? "true" : undefined}>{LEVEL_LABEL[l]}</Link>
              ))}
              <span className="small muted" style={{ marginLeft: 8 }}>Urut:</span>
              {[["", "Terbaru"], ["murah", "Harga termurah"], ["mahal", "Harga tertinggi"]].map(([v, l]) => (
                <Link key={v} className="chip" href={href(base, { urut: v || undefined })} aria-current={(sp.urut ?? "") === v ? "true" : undefined}>{l}</Link>
              ))}
            </div>
          </form>

          {shown.length ? (
            <div style={{ paddingBottom: 72 }}><KitabGrid courses={shown} all={all} bundleFirst={!sp.urut} /></div>
          ) : (
            <div className="empty-state" style={{ marginBottom: 72 }}>
              <h2 className="serif" style={{ fontSize: 22 }}>{hasFilter ? "Tidak ada kursus yang cocok" : "Kursus sedang disiapkan"}</h2>
              <p className="muted">{hasFilter ? "Coba kata kunci lain atau hapus filter." : "Jadwal kursus terbaru akan segera dipublikasikan."}</p>
              {hasFilter && <Link className="btn btn-primary" href="/kursus">Hapus filter</Link>}
            </div>
          )}
          {filtered.length > shown.length && (
            <p style={{ textAlign: "center", paddingBottom: 72 }}>
              <Link className="btn btn-ghost" href={href(base, { hal: String(page + 1) })}>Muat lebih banyak</Link>
            </p>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
