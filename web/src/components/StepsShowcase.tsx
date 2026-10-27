import Link from "next/link";
import { Search } from "lucide-react";
import { FIELD_LABEL, LEVEL_LABEL, FIELD_TONE } from "@/lib/constants";
import { hoursLabel, rupiah } from "@/lib/format";
import type { CourseCard } from "@/lib/queries";

type Step = { title: string; text: string };

function price(c: CourseCard) {
  return c.priceRupiah === 0 ? "Gratis" : rupiah(c.priceRupiah);
}

/** Tiga langkah, tiap langkah ditunjukkan dengan cuplikan tampilan nyata (data kursus asli, label "Contoh tampilan"). */
export function StepsShowcase({ steps, courses, matan }: { steps: Step[]; courses: CourseCard[]; matan: string }) {
  const [a, b] = courses;
  const paid = courses.find((c) => c.priceRupiah > 0) ?? a;
  const lead = a ?? paid;
  return (
    <ol className="steps3">
      <li data-reveal>
        <div className="s3-visual" aria-hidden="true">
          <span className="s3-tag">Contoh tampilan</span>
          <div className="s3-card s3-search"><Search size={16} /><span>ajurrumiyyah</span><i /></div>
          {[a, b].filter((c): c is CourseCard => Boolean(c)).map((c, i) => (
            <div key={c.id} className={`s3-card s3-row${i === 0 ? " on" : ""}`}>
              <span className={`s3-cover c-${FIELD_TONE[c.field]}`}><span className="ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</span></span>
              <span className="s3-info"><b>{c.title}</b><small>{FIELD_LABEL[c.field]} · {LEVEL_LABEL[c.level]} · {c.lessonCount} pelajaran</small></span>
              <span className="s3-price">{price(c)}</span>
            </div>
          ))}
        </div>
        <div className="s3-text">
          <p className="s3-step"><b>1</b> Pilih</p>
          <h3>{steps[0]?.title}</h3>
          <p>{steps[0]?.text}</p>
          {lead && <Link className="s3-link" href={`/kursus/${lead.slug}`}>Lihat silabus {lead.title}</Link>}
        </div>
      </li>

      <li data-reveal style={{ ["--delay" as string]: "90ms" }}>
        <div className="s3-visual" aria-hidden="true">
          <span className="s3-tag">Contoh tampilan</span>
          <div className="s3-card s3-pay">
            <div className="s3-line"><span>{paid?.title ?? "Nama kursus"}</span><b>{paid ? price(paid) : "Rp 0"}</b></div>
            <div className="s3-line total"><span>Total</span><b>{paid ? price(paid) : "Rp 0"}</b></div>
            <div className="s3-chips"><span className="on">QRIS</span><span>VA bank</span><span>E-wallet</span></div>
            <div className="s3-btn">Bayar lewat Mayar</div>
          </div>
        </div>
        <div className="s3-text">
          <p className="s3-step"><b>2</b> Bayar</p>
          <h3>{steps[1]?.title}</h3>
          <p>{steps[1]?.text}</p>
        </div>
      </li>

      <li data-reveal style={{ ["--delay" as string]: "180ms" }}>
        <div className="s3-visual" aria-hidden="true">
          <span className="s3-tag">Contoh tampilan</span>
          <div className="s3-card s3-lesson">
            <div className="s3-line"><span>Pelajaran 6 dari 10{lead && lead.totalMin > 0 ? ` · ${hoursLabel(lead.totalMin)}` : ""}</span><b>60%</b></div>
            <p className="s3-matan ar" lang="ar" dir="rtl">{matan}</p>
            <div className="s3-bar"><i /></div>
            <div className="s3-btn dark">Tandai selesai</div>
          </div>
        </div>
        <div className="s3-text">
          <p className="s3-step"><b>3</b> Belajar</p>
          <h3>{steps[2]?.title}</h3>
          <p>{steps[2]?.text}</p>
        </div>
      </li>
    </ol>
  );
}
