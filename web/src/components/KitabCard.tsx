import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import type { CourseCard } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, isPlaceholder, rupiah } from "@/lib/format";

// Nama pengajar dipendekkan untuk paket: "Ust. Afrozul Mukhoiyirin, Lc., Dipl." -> "Ust. Afrozul Mukhoiyirin".
const shortName = (n: string) => n.split(",")[0].trim();

/** Sampul kitab: bingkai ganda emas, judul Arab di tengah, seperti sampul matan yang dicetak. */
function KitabCover({ ar, label, foot, small = false }: { ar: string; label?: string; foot?: string; small?: boolean }) {
  return (
    <span className={`kb-book${small ? " small" : ""}`}>
      <span className="kb-corner tl" /><span className="kb-corner tr" /><span className="kb-corner bl" /><span className="kb-corner br" />
      {label && <span className="kb-book-label">{label}</span>}
      <span className="kb-book-ar" lang="ar" dir="rtl">{ar}</span>
      <span className="kb-rule" />
      {foot && <span className="kb-book-foot">{foot}</span>}
    </span>
  );
}

/**
 * Kartu kelas bergaya sampul kitab. Paket bundling tampil sebagai dua kitab berdampingan
 * dengan harga normal dicoret, kelas satuan sebagai satu sampul.
 * `all` dipakai untuk mencari kelas isi paket (harga normal, sampul, pengajar).
 */
export function KitabCard({ c, all, wide = false }: { c: CourseCard; all: CourseCard[]; wide?: boolean }) {
  const items = c.bundleOf.map((id) => all.find((x) => x.id === id)).filter((x): x is CourseCard => !!x);
  const bundle = items.length > 0;
  const normal = items.reduce((a, i) => a + i.priceRupiah, 0);
  const save = bundle ? normal - c.priceRupiah : 0;
  const teachers = (bundle ? items.map((i) => i.teacherName) : [c.teacherName]).filter((t): t is string => !isPlaceholder(t));
  const hours = hoursLabel(c.totalMin);
  const free = c.priceRupiah === 0;

  return (
    <article className={`kb-card${bundle ? " is-bundle" : ""}${wide ? " wide" : ""}`} data-testid="course-card">
      <div className="kb-cover" aria-hidden="true">
        {bundle ? (
          <span className="kb-stack">
            {items.slice(0, 2).map((i) => <KitabCover key={i.id} small ar={i.titleAr ?? i.title} label={FIELD_LABEL[i.field]} />)}
          </span>
        ) : (
          <KitabCover ar={c.titleAr ?? c.title} label={`Ilmu ${FIELD_LABEL[c.field]}`} foot={`Marhalah ${LEVEL_LABEL[c.level]}`} />
        )}
        {bundle && <span className="kb-ribbon">{items.length} kelas sekaligus</span>}
      </div>

      <div className="kb-body">
        <p className="kb-kicker">
          {bundle ? `Paket · ${items.map((i) => FIELD_LABEL[i.field]).join(" + ")}` : `Kelas online · ${c.lessonCount} pertemuan`}
          {hours && <span> · {hours.replace("± ", "±")}</span>}
        </p>
        <h3><Link href={`/kursus/${c.slug}`}>{c.title}</Link></h3>
        {teachers.length > 0 && <p className="kb-teacher">bersama {bundle ? teachers.map(shortName).join(" & ") : teachers[0]}</p>}
        {c.description && <p className="kb-desc">{c.description}</p>}

        {c.hasFreePreview && !bundle && (
          <Link className="kb-free" href={`/kursus/${c.slug}/pratinjau`}><Play size={13} fill="currentColor" aria-hidden="true" /> Tonton pertemuan 1 gratis</Link>
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
