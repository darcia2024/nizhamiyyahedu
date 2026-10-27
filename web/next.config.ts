import type { NextConfig } from "next";

// "/web" saat dipasang di nizhamiyyahedu.vercel.app/web; kosong di lokal.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
// Domain lain yang meneruskan permintaan ke aplikasi ini (rewrite Vercel), dipisah koma.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const config: NextConfig = {
  basePath,
  experimental: { serverActions: { bodySizeLimit: "2mb", allowedOrigins } },
  // Database contoh untuk deployment demo, disalin ke /tmp saat aplikasi berjalan.
  outputFileTracingIncludes: { "/**/*": ["./prisma/demo.db"] },
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
    ];
  },
};

export default config;
