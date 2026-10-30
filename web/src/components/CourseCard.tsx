import type { CourseCard as C } from "@/lib/queries";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";

// Sampul kecil untuk ruang belajar (dashboard). Kartu katalog dan beranda memakai KitabCard.
export function Cover({ c, flag }: { c: Pick<C, "field" | "titleAr" | "title" | "level">; flag?: string }) {
  const tone = FIELD_TONE[c.field];
  return (
    <div className={`cover c-${tone}`}>
      <div className="top"><span>{FIELD_LABEL[c.field]}</span><span>{LEVEL_LABEL[c.level]}</span></div>
      <p className="ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</p>
      {flag && <span className="flag">{flag}</span>}
    </div>
  );
}
