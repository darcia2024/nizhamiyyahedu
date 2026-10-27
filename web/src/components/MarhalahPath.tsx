import Link from "next/link";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL, LEVEL_NOTE } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import type { buildMarhalahMap } from "@/lib/queries";

type MapData = ReturnType<typeof buildMarhalahMap>;

/** Peta belajar: tiga jenjang berurutan, tiap jenjang berisi satu kursus per bidang ilmu (atau "Segera hadir"). */
export function MarhalahPath({ map }: { map: MapData }) {
  return (
    <div className="lv-grid">
      {map.levels.map((level, i) => (
        <section key={level} className="lv" data-reveal style={{ ["--delay" as string]: `${i * 90}ms` }} aria-label={`Jenjang ${LEVEL_LABEL[level]}`}>
          <header className="lv-head"><h3>{LEVEL_LABEL[level]}</h3><p>{LEVEL_NOTE[level]}</p></header>
          <ul className="lv-list">
            {map.fields.map((field) => {
              const c = map.cell(field, level);
              return (
                <li key={field}>
                  {c ? (
                    <Link className="lv-row" href={`/kursus/${c.slug}`}>
                      <span className={`lv-dot c-${FIELD_TONE[field]}`} aria-hidden="true" />
                      <span className="lv-txt"><b>{c.title}</b><small>{FIELD_LABEL[field]} · {c.priceRupiah === 0 ? "Gratis" : rupiah(c.priceRupiah)}</small></span>
                      {c.titleAr && <span className="lv-ar ar" lang="ar" dir="rtl">{c.titleAr}</span>}
                    </Link>
                  ) : (
                    <div className="lv-row empty">
                      <span className="lv-dot" aria-hidden="true" />
                      <span className="lv-txt"><b>Segera hadir</b><small>{FIELD_LABEL[field]}</small></span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}