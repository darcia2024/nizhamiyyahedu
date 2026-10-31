import type { NextConfig } from "next";

// Kosong: aplikasi tayang di akar nizhamiyyahedu.vercel.app. Isi (mis. "/web") hanya bila dipasang di sub-path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
// Domain lain yang meneruskan permintaan ke aplikasi ini (rewrite Vercel), dipisah koma.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const config: NextConfig = {
  basePath,
  experimental: { serverActions: { bodySizeLimit: "2mb", allowedOrigins } },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=86400; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com",
          },
        ],
      },
      {
        // Halaman kursus memuat pop-up pembayaran: halaman bayar Mayar (*.myr.id) tampil di iframe, dan alur bayarnya
        // (bank, e-wallet) bisa berpindah ke domain lain di dalam iframe itu, jadi frame-src dibuka untuk https di sini saja.
        // Header dengan nama sama di aturan yang cocok belakangan menimpa yang di atas.
        source: "/kursus/:slug*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'; frame-src https:" }],
      },
      {
        // Detail kelas dan pembayaran tampil sebagai pop-up di atas halaman dashboard mana pun (navigasi sisi-klien tidak
        // memuat dokumen baru), jadi dokumen yang aktif harus sudah mengizinkan iframe pembayaran. Halaman dashboard
        // tetap tidak boleh dibingkai orang lain.
        source: "/dashboard/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'; frame-src https:" }],
      },
      {
        // Setelah bayar, Mayar mengarahkan iframe itu kembali ke halaman status milik kita (dan halaman simulasi saat lokal),
        // jadi hanya halaman ini yang boleh dibingkai, dan hanya oleh situs kita sendiri.
        source: "/dashboard/pembayaran/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; frame-src https://www.youtube-nocookie.com" },
        ],
      },
      {
        source: "/dev/mayar/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; frame-src https://www.youtube-nocookie.com" },
        ],
      },
      {
        // Service worker selalu diperiksa ulang supaya versi baru aplikasi cepat sampai ke HP user.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default config;
