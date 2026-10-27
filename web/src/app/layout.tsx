import type { Metadata, Viewport } from "next";
import { Amiri, Inter } from "next/font/google";
import localFont from "next/font/local";
import "@/styles/globals.css";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter", display: "swap" });
const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-Regular.woff2", weight: "400" },
    { path: "../fonts/Satoshi-Medium.woff2", weight: "500" },
    { path: "../fonts/Satoshi-Bold.woff2", weight: "700" },
  ],
  variable: "--f-satoshi",
  display: "swap",
});

const siteUrl = process.env.APP_URL ?? "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Nizhamiyyah Edu — Belajar di Timur Tengah", template: "%s · Nizhamiyyah Edu" },
  description: "Kelas kitab daring berjenjang dengan kurikulum pesantren Timur Tengah. Katalog dan silabus terbuka untuk semua.",
  openGraph: { siteName: "Nizhamiyyah Edu", locale: "id_ID", type: "website" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1B4D3B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${amiri.variable} ${satoshi.variable} ${inter.variable}`}>
      <body>
        <a className="skip" href="#isi">Lewati ke konten</a>
        {children}
      </body>
    </html>
  );
}
