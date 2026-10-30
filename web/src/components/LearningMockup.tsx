import Image from "next/image";
import { withBase } from "@/lib/base-path";
import { getContent } from "@/lib/content";

/**
 * Pratinjau di hero: tangkapan layar asli LMS (resolusi 2x/3x) di dalam bingkai perangkat.
 * Berkas ada di public/hero. Ambil ulang bila tampilan dashboard atau halaman pelajaran berubah.
 */
export async function LearningMockup() {
  const media = await getContent("home.media");
  return (
    <div className="hm-scene" aria-label="Pratinjau ruang belajar Nizhamiyyah Edu di laptop dan HP">
      <div className="hm-laptop">
        <div className="hm-bar" aria-hidden="true"><span /><span /><span /><i>belajarditimurtengah.com/dashboard</i></div>
        <Image src={withBase(media.desktopImage)} alt={media.desktopAlt} width={2880} height={1720} priority sizes="(max-width: 760px) 118vw, 780px" />
      </div>

      <div className="hm-phone">
        <span className="hm-notch" aria-hidden="true" />
        <Image src={withBase(media.mobileImage)} alt={media.mobileAlt} width={1170} height={2340} priority sizes="(max-width: 760px) 40vw, 210px" />
      </div>

    </div>
  );
}
