"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpenText, CirclePlay, Clock, Infinity as Forever, ListVideo, NotebookPen } from "lucide-react";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, initials, rupiah } from "@/lib/format";
import type { CourseCard } from "@/lib/queries";

/** Kartu kursus: thumbnail sampul, ringkasan isi, harga dan satu tombol utama. Tab menyaring per bidang ilmu. */
export function PlanShowcase({ courses }: { courses: CourseCard[] }) {
  const fields = Array.from(new Set(courses.map((c) => c.field)));
  const [active, setActive] = useState<string>("all");
  const shown = active === "all" ? courses : courses.filter((c) => c.field === active);
  return (
    <div>
      <div className="plan-tabs" role="group" aria-label="Filter bidang ilmu">
        {[["all", "Semua"], ...fields.map((f) => [f, FIELD_LABEL[f]])].map(([key, label]) => (
          <button key={key} type="button" aria-pressed={active === key} onClick={() => setActive(key)}>{label}</button>
        ))}
      </div>
      <div className="plan-grid">
        {shown.map((c) => {
          const free = c.priceRupiah === 0;
          const tone = FIELD_TONE[c.field];
          return (
            <article key={c.id} className="plan-card">
              <Link className={`plan-thumb c-${tone}`} href={`/kursus/${c.slug}`} tabIndex={-1} aria-hidden="true">
                <svg className="star" aria-hidden="true" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".35">
                  <rect x="5" y="5" width="14" height="14" />
                  <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
                <span className="plan-top"><span>{FIELD_LABEL[c.field]}</span><span>{LEVEL_LABEL[c.level]}</span></span>
                <span className="plan-ar ar" lang="ar" dir="rtl">{c.titleAr ?? c.title}</span>
                {(free || c.hasFreePreview) && <span className="plan-hot"><CirclePlay size={14} /> {free ? "Gratis" : "Pratinjau gratis"}</span>}
              </Link>

              <div className="plan-body">
                <h3><Link href={`/kursus/${c.slug}`}>{c.title}</Link></h3>
                <p className="plan-by"><span className="plan-av" aria-hidden="true">{initials(c.teacherName?.replace(/[^\p{L}\s]/gu, ""))}</span>{c.teacherName ?? "Pengajar akan diumumkan"}</p>
                {c.description && <p className="plan-desc">{c.description}</p>}

                <p className="plan-stats">
                  <span><ListVideo size={15} aria-hidden="true" /> {c.lessonCount} pelajaran</span>
                  {c.totalMin > 0 && <span><Clock size={15} aria-hidden="true" /> {hoursLabel(c.totalMin)}</span>}
                </p>

                <div className="plan-inc">
                  <p>Sudah termasuk</p>
                  <ul>
                    <li><CirclePlay size={16} aria-hidden="true" /> Video pelajaran</li>
                    <li><BookOpenText size={16} aria-hidden="true" /> Matan + terjemah</li>
                    <li><NotebookPen size={16} aria-hidden="true" /> Catatan pengajar</li>
                    <li><Forever size={16} aria-hidden="true" /> Akses selamanya</li>
                  </ul>
                </div>

                <div className="plan-foot">
                  <p className="plan-price"><b>{free ? "Gratis" : rupiah(c.priceRupiah)}</b><small>{free ? "tanpa biaya" : "sekali bayar"}</small></p>
                  <Link className="plan-cta" href={`/kursus/${c.slug}`}>{free ? "Daftar gratis" : "Lihat kursus"} <ArrowRight size={16} aria-hidden="true" /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
