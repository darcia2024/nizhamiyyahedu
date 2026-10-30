// Membuat ikon aplikasi (PWA, iPhone, favicon) dari logo Nizhamiyyah: logo putih di tengah kotak hijau.
// Jalankan: node scripts/make-icons.mjs
import sharp from "sharp";

const LOGO = "public/nizhamiyyah-icon.png";
const GREEN = { r: 0x1e, g: 0x71, b: 0x5c, alpha: 1 };

// ratio = tinggi logo dibanding sisi kotak. Maskable lebih kecil supaya aman dipotong bulat oleh Android.
const targets = [
  { out: "public/icon-192.png", size: 192, ratio: 0.76 },
  { out: "public/icon-512.png", size: 512, ratio: 0.76 },
  { out: "public/icon-maskable-512.png", size: 512, ratio: 0.62 },
  { out: "src/app/apple-icon.png", size: 180, ratio: 0.74 },
  { out: "src/app/icon.png", size: 96, ratio: 0.84 },
];

for (const t of targets) {
  const logo = await sharp(LOGO).resize({ height: Math.round(t.size * t.ratio), fit: "inside" }).png().toBuffer();
  await sharp({ create: { width: t.size, height: t.size, channels: 4, background: GREEN } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(t.out);
  console.log("dibuat", t.out);
}
