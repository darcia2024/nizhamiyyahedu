"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StarMark } from "@/components/Logo";

/**
 * Panel gambar di sisi kiri halaman masuk: thumbnail kelas bergantian pelan-pelan (dengan titik penanda di bawah),
 * ditimpa gradasi gelap supaya logo, tautan kembali, dan headline tetap terbaca. Berhenti bergantian bila perangkat
 * meminta gerak dikurangi.
 */
export function LoginHero({ images, headline, text }: { images: string[]; headline: string; text: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % images.length), 5500);
    return () => clearInterval(t);
  }, [images.length, i]); // i ikut sebagai dependensi: memilih titik manual mengulang hitung mundurnya

  return (
    <section className="lg-hero" aria-label="Nizhamiyyah Edu">
      {images.map((src, idx) => (
        <Image key={src} className="lg-slide" data-on={idx === i} src={src} alt="" fill sizes="(max-width: 900px) 100vw, 56vw" quality={82} priority={idx === 0} />
      ))}
      <header className="lg-top">
        <a href="/" className="lg-brand" aria-label="Nizhamiyyah Edu">
          <StarMark size={40} />
          <b>Nizhamiyyah</b>
        </a>
        <a href="/" className="lg-back"><ArrowLeft size={15} aria-hidden="true" /> <span className="lg-back-long">Kembali ke </span>beranda</a>
      </header>
      <div className="lg-pitch">
        <h2>{headline}</h2>
        <p>{text}</p>
        {images.length > 1 && (
          <div className="lg-dots" role="group" aria-label="Pilih gambar">
            {images.map((src, idx) => (
              <button key={src} type="button" aria-label={`Tampilkan gambar ${idx + 1}`} aria-current={idx === i ? "true" : undefined} onClick={() => setI(idx)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
