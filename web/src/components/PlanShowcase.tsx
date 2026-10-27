"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { FIELD_LABEL, LEVEL_LABEL } from "@/lib/constants";
import { hoursLabel, rupiah } from "@/lib/format";
import type { CourseCard } from "@/lib/queries";

/** Kartu kursus bergaya paket harga: tab bidang, harga besar, daftar isi, satu tombol utama. */
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
          return (
            <article key={c.id} className="plan-card">
              {(free || c.hasFreePreview) && <span className="plan-flag">{free ? "Gratis" : "Pratinjau gratis"}</span>}
              <p className="plan-meta">{FIELD_LABEL[c.field]} · {LEVEL_LABEL[c.level]}</p>
              <h3>{c.title}</h3>
              {c.titleAr && <p className="plan-ar ar" lang="ar" dir="rtl">{c.titleAr}</p>}
              <p className="plan-desc">{c.description}</p>
              <p className="plan-price"><b>{free ? "Gratis" : rupiah(c.priceRupiah)}</b>{!free && <small> sekali bayar</small>}</p>
              <Link className="plan-cta" href={`/kursus/${c.slug}`}>{free ? "Daftar gratis" : "Lihat kursus"} <ArrowRight size={16} /></Link>
              <ul className="plan-list">
                <li><Check size={15} aria-hidden="true" /> {c.lessonCount} pelajaran{c.totalMin > 0 ? ` · ${hoursLabel(c.totalMin)}` : ""}</li>
                <li><Check size={15} aria-hidden="true" /> Matan Arab dengan terjemah</li>
                <li><Check size={15} aria-hidden="true" /> Progres belajar tersimpan</li>
                <li><Check size={15} aria-hidden="true" /> Akses selamanya</li>
                {c.teacherName && <li><Check size={15} aria-hidden="true" /> Pengajar: {c.teacherName}</li>}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
