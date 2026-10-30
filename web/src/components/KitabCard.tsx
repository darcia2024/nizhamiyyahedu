import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { CourseCard } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, isPlaceholder, rupiah } from "@/lib/format";
import { mediaSrc } from "@/lib/base-path";

// Nama pengajar dipendekkan: "Ust. Afrozul Mukhoiyirin, Lc., Dipl." -> "Ust. Afrozul Mukhoiyirin".
const shortName = (n: string) => n.split(",")[0].trim();

/** Sampul cadangan bila kelas belum punya foto kitab: bingkai emas dan judul Arab. */
function KitabCover({ ar, label, foot }: { ar: string; label?: string; foot?: string }) {
  return (
    <span className="kb-book">
      {label && <span className="kb-book-label">{label}</span>}
      <span className="kb-book-ar" lang="ar" dir="rtl">{ar}</span>
      <span className="kb-rule" />
      {foot && <span className="kb-book-foot">{foot}</span>}
    </span>
  );
}

/**
 * Kartu kelas dengan foto asli: kitab yang dikaji dan pengajarnya, dipotong dari poster resmi.
 * Paket bundling melebar dengan kitab-kitab isinya dan harga normal dicoret.
 * `all` dipakai untuk mencari kelas isi paket (harga normal, foto, pengajar).
 */
export function KitabCard({ c, all, wide = false }: { c: CourseCard; all: CourseCard[]; wide?: boolean }) {
  const items = c.bundleOf.map((id) => all.find((x) => x.id === id)).filter((x): x is CourseCard => !!x);
  const bundle = items.length > 0;
  const normal = items.reduce((a, i) => a + i.priceRupiah, 0);
  const save = bundle ? normal - c.priceRupiah : 0;
  const people = (bundle ? items : [c]).filter((i) => !isPlaceholder(i.teacherName)).map((i) => ({ name: i.teacherName as string, photo: i.teacherPhoto }));
  const hours = hoursLabel(c.totalMin)?.replace("± ", "±");
  const free = c.priceRupiah === 0;
  const books = (bundle ? items : [c]).filter((i) => i.image);

  return (
    <article className={`kb-card${bundle ? " is-bundle" : ""}${wide ? " wide" : ""}`} data-testid="course-card">
      <div className={`kb-media${c.teacherPhoto && !bundle ? " has-person" : ""}`} aria-hidden="true">
        {books.length > 0
          ? <span className="kb-books">{books.map((b) => <img key={b.id} className="kb-kitab" src={mediaSrc(b.image as string)} alt="" loading="lazy" />)}</span>
          : <KitabCover ar={c.titleAr ?? c.title} label={FIELD_LABEL[c.field]} foot={`Marhalah ${LEVEL_LABEL[c.level]}`} />}
        {!bundle && c.teacherPhoto && <img className="kb-person" src={mediaSrc(c.teacherPhoto)} alt="" loading="lazy" />}
        {bundle && <span className="kb-ribbon">{items.length} kelas sekaligus</span>}
      </div>

      <div className="kb-body">
        <p className="kb-kicker">{bundle ? `Paket ${items.map((i) => FIELD_LABEL[i.field]).join(" + ")}` : `Ilmu ${FIELD_LABEL[c.field]}`}</p>
        <h3><Link href={`/kursus/${c.slug}`}>{c.title}</Link></h3>
        <p className="kb-meta">{c.lessonCount} pertemuan{hours && ` · ${hours} rekaman`}</p>

        {bundle ? (
          <ul className="kb-people">
            {people.map((p) => (
              <li key={p.name}>
                {p.photo ? <img src={mediaSrc(p.photo)} alt="" width={36} height={36} loading="lazy" /> : <span className="kb-noface" />}
                {shortName(p.name)}
              </li>
            ))}
          </ul>
        ) : people[0] && <p className="kb-teacher">{people[0].name}</p>}
        {bundle && c.description && <p className="kb-desc">{c.description}</p>}

        {c.hasFreePreview && !bundle && (
          <Link className="kb-free" href={`/kursus/${c.slug}/pratinjau`}><Play size={12} fill="currentColor" aria-hidden="true" /> Tonton pertemuan 1 gratis</Link>
        )}

        <div className="kb-foot">
          <p className="kb-price">
            {save > 0 && <s>{rupiah(normal)}</s>}
            <b>{rupiah(c.priceRupiah)}</b>
            {save > 0 ? <em>hemat {rupiah(save)}</em> : !free && <small>sekali bayar</small>}
          </p>
          <span className="kb-go" aria-hidden="true">{bundle ? "Lihat paket" : "Lihat kelas"} <ArrowRight size={16} /></span>
        </div>
      </div>
    </article>
  );
}

/** Daftar kartu: paket bundling melebar dan (kecuali urutan dipilih user) ditaruh paling atas. */
export function KitabGrid({ courses, all, bundleFirst = true }: { courses: CourseCard[]; all: CourseCard[]; bundleFirst?: boolean }) {
  const ordered = bundleFirst ? [...courses.filter((c) => c.bundleOf.length), ...courses.filter((c) => !c.bundleOf.length)] : courses;
  return (
    <div className="kb-grid">
      {ordered.map((c) => <KitabCard key={c.id} c={c} all={all} wide={c.bundleOf.length > 0} />)}
    </div>
  );
}
