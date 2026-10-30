import type { Metadata, Viewport } from "next";
import { Amiri, Bricolage_Grotesque, Reem_Kufi } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/living.css";
import "@/styles/pwa.css";
import "@/styles/kitab-card.css";
import { PwaProvider } from "@/components/PwaProvider";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri", display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--f-bricolage", display: "swap" });
// Kufi untuk judul Arab dekoratif, senada dengan poster kegiatan Nizhamiyyah.
const kufi = Reem_Kufi({ subsets: ["arabic"], weight: ["500", "700"], variable: "--f-kufi", display: "swap", preload: false });

const siteUrl = process.env.APP_URL ?? "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Nizhamiyyah Edu — Belajar di Timur Tengah", template: "%s · Nizhamiyyah Edu" },
  description: "Kelas kitab daring berjenjang dengan kurikulum pesantren Timur Tengah. Katalog dan silabus terbuka untuk semua.",
  openGraph: { siteName: "Nizhamiyyah Edu", locale: "id_ID", type: "website" },
  robots: { index: true, follow: true },
  applicationName: "Nizhamiyyah",
  // Mode aplikasi di iPhone: dibuka dari layar utama tanpa bilah Safari.
  appleWebApp: { capable: true, title: "Nizhamiyyah", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
};

// viewportFit "cover" supaya tab bar bawah bisa memakai area aman (safe-area) di HP berponi.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1E715C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${amiri.variable} ${bricolage.variable} ${kufi.variable}`}>
      <body>
        <a className="skip" href="#isi">Lewati ke konten</a>
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
