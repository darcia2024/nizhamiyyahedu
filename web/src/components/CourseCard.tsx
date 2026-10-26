import Link from "next/link";
import type { CourseCard as C } from "@/lib/queries";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, rupiah } from "@/lib/format";

export function Cover({ c, flag }: { c: Pick<C, "field" | "titleAr" | "title" | "level">; flag?: string }) {
  const tone = FIELD_TONE[c.field];
  return (
    <div className={`cover c-${tone}`}>
      <svg className="star" aria-hidden="true" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".6">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </svg>
      <div className="top"><span>{FIELD_LABEL[c.field]}</span><span>{LEVEL_LABEL[c.level]}</span></div>
      <p className="ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</p>
      {flag && <span className="flag">{flag}</span>}
    </div>
  );
}

export function CourseCardView({ c, flag }: { c: C; flag?: string }) {
  const tone = FIELD_TONE[c.field];
  return (
    <article className="course-card" data-testid="course-card">
      <Cover c={c} flag={flag} />
      <div className="cc-body">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className={`tag f-${tone}`}>{FIELD_LABEL[c.field]}</span>
          <span className="tag plain">{LEVEL_LABEL[c.level]}</span>
        </div>
        <h3><Link href={`/kursus/${c.slug}`}>{c.title}</Link></h3>
        {c.description && <p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>}
        <p className="small" style={{ color: "var(--ink-2)" }}>
          {c.teacherName ?? "Pengajar"} · {c.lessonCount} pelajaran{c.totalMin ? ` · ${hoursLabel(c.totalMin)}` : ""}
        </p>
        <div className="cc-foot">
          <b className="num">{rupiah(c.priceRupiah)}</b>
          <span aria-hidden="true">Lihat silabus →</span>
        </div>
      </div>
    </article>
  );
}
