import type { Metadata, Viewport } from "next";
import { Amiri, Bricolage_Grotesque } from "next/font/google";
import "@/styles/globals.css";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri", display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--f-bricolage", display: "swap" });

const siteUrl = process.env.APP_URL ?? "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Nizhamiyyah Edu — Belajar di Timur Tengah", template: "%s · Nizhamiyyah Edu" },
  description: "Kelas kitab daring berjenjang dengan kurikulum pesantren Timur Tengah. Katalog dan silabus terbuka untuk semua.",
  openGraph: { siteName: "Nizhamiyyah Edu", locale: "id_ID", type: "website" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1E715C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${amiri.variable} ${bricolage.variable}`}>
      <body>
        <a className="skip" href="#isi">Lewati ke konten</a>
        {children}
      </body>
    </html>
  );
}
