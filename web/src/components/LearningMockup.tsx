import { BookOpen, Check, ChevronRight, CirclePlay, LayoutDashboard, Library, Play, Search } from "lucide-react";
import Image from "next/image";
import type { CourseCard } from "@/lib/queries";
import { FIELD_LABEL, LEVEL_LABEL } from "@/lib/constants";

export function LearningMockup({ courses }: { courses: CourseCard[] }) {
  const primary = courses[0];
  const secondary = courses[1] ?? primary;
  return (
    <div className="product-scene" aria-label="Pratinjau tampilan ruang belajar Nizhamiyyah Edu">
      <div className="mock-orbit orbit-one" aria-hidden="true" />
      <div className="mock-orbit orbit-two" aria-hidden="true" />
      <div className="desktop-mock">
        <div className="mock-browserbar" aria-hidden="true"><span /><span /><span /><div>belajarditimurtengah.com/dashboard</div></div>
        <div className="mock-app">
          <aside className="mock-side">
            <div className="mock-logo"><span><Image src="/nizhamiyyah-icon.png" alt="" width={11} height={28} /></span><b>Nizhamiyyah</b></div>
            <nav aria-label="Contoh navigasi dashboard">
              <span className="active"><LayoutDashboard size={15} /> Ringkasan</span>
              <span><Library size={15} /> Kursus saya</span>
              <span><Search size={15} /> Cari kursus</span>
            </nav>
            <div className="mock-user"><i>AM</i><span><b>Ahmad</b><small>User</small></span></div>
          </aside>
          <div className="mock-main">
            <div className="mock-welcome"><span>Ruang belajar</span><b>Assalamu&apos;alaikum, Ahmad</b><small>Lanjut dari pelajaran terakhirmu.</small></div>
            <div className="mock-featured">
              <div><span className="mock-chip">Sedang dipelajari</span><h3>{primary?.title ?? "Al-Ajurrumiyyah"}</h3><p>{primary ? `${FIELD_LABEL[primary.field]} · ${LEVEL_LABEL[primary.level]}` : "Nahwu · Marhalah Ula"}</p><button type="button" tabIndex={-1}>Lanjut belajar <ChevronRight size={14} /></button></div>
              <div className="mock-progress-ring"><span>62%</span></div>
            </div>
            <div className="mock-row-title"><b>Kursusmu</b><span>Lihat semua</span></div>
            <div className="mock-course-row">
              {[primary, secondary].map((course, index) => <div className="mock-course" key={course?.id ?? index}>
                <div className={`mock-cover tone-${index}`}><BookOpen size={18} /><span className="ar" lang="ar" dir="rtl">{course?.titleAr ?? (index ? "الفقه الميسر" : "الآجرومية")}</span></div>
                <div><b>{course?.title ?? (index ? "Fiqih Dasar" : "Al-Ajurrumiyyah")}</b><small>{index ? "4 dari 12 pelajaran" : "8 dari 14 pelajaran"}</small><i><em style={{ width: index ? "34%" : "62%" }} /></i></div>
              </div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="phone-mock" aria-hidden="true">
        <div className="phone-top"><span>9:41</span><i /></div>
        <div className="phone-head"><small>Pelajaran sekarang</small><b>{primary?.title ?? "Al-Ajurrumiyyah"}</b></div>
        <div className="phone-video"><Play size={22} fill="currentColor" /></div>
        <div className="phone-matan ar" lang="ar" dir="rtl">الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ</div>
        <div className="phone-line"><Check size={13} /><span>Progres tersimpan otomatis</span></div>
        <button type="button" tabIndex={-1}>Tandai selesai</button>
      </div>
      <div className="float-lesson" aria-hidden="true"><span><CirclePlay size={15} /> Pelajaran 08</span><b>Pengertian kalam</b><small>12 menit · video dan matan</small></div>
    </div>
  );
}
