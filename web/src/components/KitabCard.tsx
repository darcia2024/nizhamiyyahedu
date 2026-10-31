import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import type { CourseCard } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, isPlaceholder, rupiah } from "@/lib/format";
import { Thumb } from "@/components/Thumb";

// Nama pengajar dipendekkan: "Ust. Afrozul Mukhoiyirin, Lc., Dipl." -> "Ust. Afrozul Mukhoiyirin".
const shortName = (n: string) => n.split(",")[0].trim();

/** Status kelas bagi pengguna yang sedang login (hanya di katalog dashboard). */
export type OwnState = "owned" | "pending";

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
 * Kartu kelas dengan thumbnail resmi 16:9 (tanpa thumbnail: sampul teks cadangan).
 * Paket bundling melebar dengan thumbnail kelas-kelas isinya bertumpuk dan harga normal dicoret.
 * `all` dipakai untuk mencari kelas isi paket (harga normal, foto, pengajar).
 * `state` (katalog dashboard): "owned" = sudah dimiliki, tombolnya membuka kelas; "pending" = tagihan belum dibayar.
 * `partial` = paket yang sebagian isinya sudah dimiliki.
 */
export function KitabCard({ c, all, wide = false, state, partial = 0, dashboard = false }: { c: CourseCard; all: CourseCard[]; wide?: boolean; state?: OwnState; partial?: number; dashboard?: boolean }) {
  const items = c.bundleOf.map((id) => all.find((x) => x.id === id)).filter((x): x is CourseCard => !!x);
  const bundle = items.length > 0;
  const normal = items.reduce((a, i) => a + i.priceRupiah, 0);
  const save = bundle ? normal - c.priceRupiah : 0;
  const people = (bundle ? items : [c]).filter((i) => !isPlaceholder(i.teacherName)).map((i) => i.teacherName as string);
  const hours = hoursLabel(c.totalMin)?.replace("± ", "±");
  const free = c.priceRupiah === 0;
  const thumbs = (bundle ? items : [c]).filter((i) => i.image).slice(0, 2);
  const owned = state === "owned";
  // Yang sudah dimiliki dibuka di ruang belajar; selebihnya ke detail kelas (tempat bayar). Di dashboard detail tampil
  // sebagai pop-up di atas katalog, bukan pindah ke halaman publik.
  const detailHref = dashboard ? `/dashboard/katalog/${c.slug}` : `/kursus/${c.slug}`;
  const href = owned ? (bundle ? "/dashboard/kursus" : `/dashboard/kursus/${c.slug}`) : detailHref;

  return (
    <article className={`kb-card${bundle ? " is-bundle" : ""}${wide ? " wide" : ""}${owned ? " is-owned" : ""}`} data-testid="course-card">
      <div className={`kb-media${thumbs.length ? " thumb" : ""}${thumbs.length > 1 ? " thumb-stack" : ""}`} aria-hidden="true">
        {thumbs.length > 0
          ? <span className="kb-thumbs">{thumbs.map((b) => <Thumb key={b.id} className="kb-thumb" src={b.image as string} sizes={thumbs.length > 1 ? "(max-width: 860px) 62vw, 320px" : "(max-width: 640px) 94vw, (max-width: 1100px) 46vw, 520px"} />)}</span>
          : <KitabCover ar={c.titleAr ?? c.title} label={FIELD_LABEL[c.field]} foot={`Marhalah ${LEVEL_LABEL[c.level]}`} />}
        {bundle && !owned && <span className="kb-ribbon">{items.length} kelas sekaligus</span>}
        {owned && <span className="kb-ribbon kb-ribbon-own"><Check size={13} aria-hidden="true" /> Sudah kamu miliki</span>}
      </div>

      <div className="kb-body">
        <p className="kb-kicker">{bundle ? `Paket ${items.map((i) => FIELD_LABEL[i.field]).join(" + ")}` : `Ilmu ${FIELD_LABEL[c.field]}`}</p>
        <h3><Link href={href}>{c.title}</Link></h3>
        <p className="kb-meta">{c.lessonCount} pertemuan{hours && ` · ${hours} rekaman`}</p>

        {people.length > 0 && <p className="kb-teacher">{bundle ? people.map(shortName).join(" & ") : people[0]}</p>}
        {bundle && c.description && <p className="kb-desc">{c.description}</p>}
        {bundle && !owned && partial > 0 && <p className="kb-note">{partial} dari {items.length} kelas di paket ini sudah kamu miliki.</p>}

        {c.hasFreePreview && !bundle && !owned && (
          <Link className="kb-free" href={dashboard ? detailHref : `/kursus/${c.slug}/pratinjau`}><Play size={12} fill="currentColor" aria-hidden="true" /> Tonton pertemuan 1 gratis</Link>
        )}

        <div className="kb-foot">
          {owned ? (
            <p className="kb-price"><b className="kb-owned"><Check size={16} aria-hidden="true" /> Sudah kamu miliki</b></p>
          ) : (
            <p className="kb-price">
              {save > 0 && <s>{rupiah(normal)}</s>}
              <b>{rupiah(c.priceRupiah)}</b>
              {state === "pending" ? <em>menunggu pembayaran</em> : save > 0 ? <em>hemat {rupiah(save)}</em> : !free && <small>sekali bayar</small>}
            </p>
          )}
          <span className="kb-go" aria-hidden="true">{owned ? "Buka kelas" : state === "pending" ? "Lanjutkan bayar" : bundle ? "Lihat paket" : "Lihat kelas"} <ArrowRight size={16} /></span>
        </div>
      </div>
    </article>
  );
}

/** Daftar kartu: paket bundling melebar dan (kecuali urutan dipilih user) ditaruh paling atas. */
export function KitabGrid({ courses, all, bundleFirst = true, owned, pending, compact = false, dashboard = false }: {
  courses: CourseCard[];
  all: CourseCard[];
  bundleFirst?: boolean;
  /** Id kelas yang sudah dimiliki pengguna (katalog dashboard). */
  owned?: string[];
  /** Id kelas yang punya tagihan belum dibayar. */
  pending?: string[];
  /** Kolom lebih sempit, untuk area dashboard yang berbagi lebar dengan sidebar. */
  compact?: boolean;
  /** Di dalam dashboard: tautan detail dan pratinjau membuka pop-up dashboard, bukan halaman publik. */
  dashboard?: boolean;
}) {
  const ordered = bundleFirst ? [...courses.filter((c) => c.bundleOf.length), ...courses.filter((c) => !c.bundleOf.length)] : courses;
  const own = new Set(owned ?? []);
  const wait = new Set(pending ?? []);
  return (
    <div className={`kb-grid${compact ? " compact" : ""}`}>
      {ordered.map((c) => {
        const isBundle = c.bundleOf.length > 0;
        // Paket dianggap dimiliki bila semua kelas isinya sudah dimiliki.
        const have = isBundle ? c.bundleOf.filter((id) => own.has(id)).length : 0;
        const state: OwnState | undefined = (isBundle ? have === c.bundleOf.length : own.has(c.id)) ? "owned" : wait.has(c.id) ? "pending" : undefined;
        return <KitabCard key={c.id} c={c} all={all} wide={isBundle} state={state} partial={have} dashboard={dashboard} />;
      })}
    </div>
  );
}
