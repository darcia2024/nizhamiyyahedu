import Link from "next/link";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL, LEVEL_NOTE } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import type { buildMarhalahMap } from "@/lib/queries";

type MapData = ReturnType<typeof buildMarhalahMap>;

/** Peta belajar: tiga jenjang berurutan, tiap jenjang memuat satu kursus per bidang ilmu (atau "Segera"). */
export function MarhalahPath({ map }: { map: MapData }) {
  return (
    <ol className="lv-grid" aria-label="Jenjang belajar">
      {map.levels.map((level, i) => (
        <li key={level} className="lv" data-reveal style={{ ["--delay" as string]: `${i * 90}ms` }}>
          <div className="lv-head">
            <span className="lv-no" aria-hidden="true">{i + 1}</span>
            <div><h3>{LEVEL_LABEL[level]}</h3><p>{LEVEL_NOTE[level]}</p></div>
          </div>
          <ul className="lv-tiles">
            {map.fields.map((field) => {
              const c = map.cell(field, level);
              return (
                <li key={field}>
                  {c ? (
                    <Link className={`tile c-${FIELD_TONE[field]}`} href={`/kursus/${c.slug}`}>
                      <svg className="star" aria-hidden="true" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".4">
                        <rect x="5" y="5" width="14" height="14" /><rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
                      </svg>
                      <span className="tile-top"><span>{FIELD_LABEL[field]}</span><span>{c.priceRupiah === 0 ? "Gratis" : rupiah(c.priceRupiah)}</span></span>
                      <span className="tile-ar ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</span>
                      <span className="tile-title">{c.title}</span>
                    </Link>
                  ) : (
                    <div className="tile empty"><span className="tile-top"><span>{FIELD_LABEL[field]}</span></span><span className="tile-soon">Segera hadir</span></div>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
