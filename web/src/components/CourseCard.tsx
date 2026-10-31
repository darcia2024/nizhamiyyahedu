import type { CourseCard as C } from "@/lib/queries";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";
import { Thumb } from "@/components/Thumb";

/**
 * Sampul kelas untuk dashboard. Dengan thumbnail resmi (16:9) tampil gambarnya; tanpa itu, sampul teks cadangan.
 * Kartu katalog dan beranda memakai KitabCard.
 */
export function Cover({ c, flag, sizes = "(max-width: 700px) 92vw, 380px" }: { c: Pick<C, "field" | "titleAr" | "title" | "level"> & { image?: string | null }; flag?: string; sizes?: string }) {
  if (c.image) {
    return (
      <div className="cover has-thumb">
        <Thumb className="cover-thumb" src={c.image} sizes={sizes} />
        {flag && <span className="flag">{flag}</span>}
      </div>
    );
  }
  const tone = FIELD_TONE[c.field];
  return (
    <div className={`cover c-${tone}`}>
      <div className="top"><span>{FIELD_LABEL[c.field]}</span><span>{LEVEL_LABEL[c.level]}</span></div>
      <p className="ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</p>
      {flag && <span className="flag">{flag}</span>}
    </div>
  );
}
