import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: withBase("/"),
    name: "Nizhamiyyah Edu",
    short_name: "Nizhamiyyah",
    description: "Kelas Daurah Aqliyah: Mantiq dan Ushul Fiqh bersama pengajar Al-Azhar, Kairo. Belajar lewat video, ulang kapan saja.",
    start_url: withBase("/dashboard"),
    scope: withBase("/"),
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#F3F5F1",
    theme_color: "#1E715C",
    lang: "id",
    dir: "ltr",
    categories: ["education", "books"],
    icons: [
      { src: withBase("/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBase("/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Tekan lama ikon aplikasi di Android: langsung ke bagian yang paling sering dibuka.
    shortcuts: [
      { name: "Lanjut belajar", short_name: "Belajar", url: withBase("/dashboard/kursus"), icons: [{ src: withBase("/icon-192.png"), sizes: "192x192" }] },
      { name: "Catatan saya", short_name: "Catatan", url: withBase("/dashboard/catatan"), icons: [{ src: withBase("/icon-192.png"), sizes: "192x192" }] },
      { name: "Katalog kelas", short_name: "Katalog", url: withBase("/kursus"), icons: [{ src: withBase("/icon-192.png"), sizes: "192x192" }] },
    ],
    // Pratinjau di lembar pemasangan Android (tampilan "seperti di Play Store").
    screenshots: [
      { src: withBase("/hero/lms-mobile.jpg"), sizes: "1170x2340", type: "image/jpeg", form_factor: "narrow", label: "Halaman pelajaran di HP" },
      { src: withBase("/hero/lms-desktop.jpg"), sizes: "2880x1720", type: "image/jpeg", form_factor: "wide", label: "Ruang belajar di laptop" },
    ],
  };
}
