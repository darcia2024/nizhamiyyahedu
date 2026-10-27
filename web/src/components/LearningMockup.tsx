import Image from "next/image";
import { CircleCheck, Flame } from "lucide-react";

/**
 * Pratinjau di hero: tangkapan layar asli LMS (resolusi 2x/3x) di dalam bingkai perangkat.
 * Berkas ada di public/hero. Ambil ulang bila tampilan dashboard atau halaman Matan berubah.
 */
export function LearningMockup() {
  return (
    <div className="hm-scene" aria-label="Pratinjau ruang belajar Nizhamiyyah Edu di laptop dan HP">
      <div className="hm-laptop">
        <div className="hm-bar" aria-hidden="true"><span /><span /><span /><i>belajarditimurtengah.com/dashboard</i></div>
        <Image src="/hero/lms-desktop.jpg" alt="Dashboard ruang belajar: kartu statistik, lanjutkan belajar, dan daftar kursus" width={2880} height={1720} priority sizes="(max-width: 760px) 118vw, 780px" />
      </div>

      <div className="hm-phone">
        <span className="hm-notch" aria-hidden="true" />
        <Image src="/hero/lms-mobile.jpg" alt="Halaman Matan mode hafalan di HP" width={1170} height={2340} priority sizes="(max-width: 760px) 40vw, 210px" />
      </div>

      <div className="hm-chip hm-chip-a" aria-hidden="true">
        <span className="hm-ico ok"><CircleCheck size={16} /></span>
        <span><b>Pelajaran 5 selesai</b><small>Bab al-I&apos;rab · baru saja</small></span>
      </div>
      <div className="hm-chip hm-chip-b" aria-hidden="true">
        <span className="hm-ico fire"><Flame size={16} /></span>
        <span><b>4 hari beruntun</b><small>Terus rutin belajar</small></span>
      </div>
    </div>
  );
}
