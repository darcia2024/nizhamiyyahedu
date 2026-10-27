import { Award, BookText, ChevronRight, ChevronsUpDown, CircleCheck, CirclePlay, Clock, Ellipsis, LayoutGrid, LineChart, NotebookPen, Play, Search, TrendingUp, BookOpen } from "lucide-react";
import { StarMark } from "@/components/Logo";
import type { CourseCard } from "@/lib/queries";
import { FIELD_LABEL, FIELD_TONE, LEVEL_LABEL } from "@/lib/constants";

/** Pratinjau di hero. Strukturnya sengaja mengikuti dashboard LMS asli (sidebar, topbar, panel, kartu statistik). Angka hanya contoh. */
export function LearningMockup({ courses, matan }: { courses: CourseCard[]; matan?: string }) {
  const primary = courses[0];
  const secondary = courses[1] ?? primary;
  const tone = primary ? FIELD_TONE[primary.field] : "nahwu";
  const ic = { size: 13, strokeWidth: 1.8 } as const;
  return (
    <div className="product-scene" aria-label="Pratinjau tampilan ruang belajar Nizhamiyyah Edu">
      <div className="desktop-mock">
        <div className="mock-browserbar" aria-hidden="true"><span /><span /><span /><div>belajarditimurtengah.com/dashboard</div></div>
        <div className="mock-app" aria-hidden="true">
          <aside className="mock-side">
            <div className="mock-ws"><span className="mock-logo"><StarMark size={15} stroke="#fff" dot={false} /></span><span className="mock-ws-t"><b>Nizhamiyyah</b><small>Ruang belajar</small></span><ChevronsUpDown size={11} /></div>
            <div className="mock-search"><Search size={12} /> Cari kursus <kbd>/</kbd></div>
            <div className="mock-grp"><em>Belajar</em>
              <span className="on"><LayoutGrid {...ic} /> Ringkasan</span>
              <span><CirclePlay {...ic} /> Ruang belajar</span>
              <span><BookText {...ic} /> Matan</span>
              <span><NotebookPen {...ic} /> Catatan saya</span>
            </div>
            <div className="mock-grp"><em>Pencapaian</em>
              <span><LineChart {...ic} /> Progres</span>
              <span><Award {...ic} /> Sertifikat</span>
            </div>
            <div className="mock-user"><i>AF</i><span><b>Ahmad Fauzi</b><small>ahmad@contoh.id</small></span></div>
          </aside>

          <div className="mock-main">
            <div className="mock-top"><span className="mock-crumb">Dashboard / <b>Ringkasan</b></span><span className="mock-btn"><Search size={11} /> Jelajahi katalog</span></div>
            <div className="mock-panel">
              <div><h4>Assalamu&apos;alaikum, Ahmad</h4><p>Lanjutkan perjalanan keilmuanmu.</p></div>
              <div className="mock-kpis">
                <div><span className="ic"><BookOpen size={12} /></span><b>2</b><small>Kursus aktif</small></div>
                <div><span className="ic"><CircleCheck size={12} /></span><b>12</b><small>Pelajaran selesai</small></div>
                <div><span className="ic"><Clock size={12} /></span><b>3,4 jam</b><small>Waktu belajar</small></div>
                <div><span className="ic"><TrendingUp size={12} /></span><b>62%</b><small>Rata-rata progres</small></div>
              </div>
              <div className="mock-grid">
                <div className="mock-card">
                  <div className={`mock-cover c-${tone}`}><span>{primary ? FIELD_LABEL[primary.field] : "Nahwu"}</span><b className="ar" lang="ar" dir="rtl">{primary?.titleAr ?? "متن الآجرومية"}</b></div>
                  <div className="mock-info">
                    <b>{primary?.title ?? "Matan al-Ajurrumiyyah"}</b>
                    <small>{primary ? `${FIELD_LABEL[primary.field]} · ${LEVEL_LABEL[primary.level]}` : "Nahwu · Ula"} · Pelajaran 6</small>
                    <i className="mock-bar"><em style={{ width: "62%" }} /></i>
                    <span className="mock-pill">Lanjutkan belajar <ChevronRight size={10} /></span>
                  </div>
                </div>
                <div className="mock-list">
                  <b>Kursus lain</b>
                  <div><span>{secondary?.title ?? "Safinatun Najah"}</span><small>2/6</small></div>
                  <div><span>Aqidatul Awam</span><small>1/6</small></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="phone-mock" aria-hidden="true">
        <div className="pm-status"><span>9:41</span><i /></div>
        <div className="pm-head"><span className="mock-logo"><StarMark size={13} stroke="#fff" dot={false} /></span><span className="mock-ws-t"><b>Nizhamiyyah</b><small>Ruang belajar</small></span></div>
        <div className="pm-panel">
          <div className="pm-video"><Play size={16} fill="currentColor" /></div>
          <small className="pm-meta">{primary ? FIELD_LABEL[primary.field] : "Nahwu"} · Pelajaran 6 dari 10</small>
          <b className="pm-title">{primary?.title ?? "Matan al-Ajurrumiyyah"}</b>
          <div className="pm-matan ar" lang="ar" dir="rtl">{matan ?? "الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ"}</div>
          <span className="pm-btn">Tandai selesai</span>
        </div>
        <div className="pm-tabs">
          <span className="on"><LayoutGrid size={14} />Belajar</span>
          <span><CirclePlay size={14} />Kursus</span>
          <span><BookText size={14} />Matan</span>
          <span><NotebookPen size={14} />Catatan</span>
          <span><Ellipsis size={14} />Menu</span>
        </div>
      </div>

      <div className="float-lesson" aria-hidden="true"><span><CirclePlay size={15} /> Pelajaran 08</span><b>Pengertian kalam</b><small>12 menit · video dan matan</small></div>
    </div>
  );
}
