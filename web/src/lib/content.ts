import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { SITE_COPY_DEFAULTS } from "@/lib/site-copy";
import { SOCIAL_POSTS } from "@/lib/social";

export type HomeContent = {
  eyebrow: string;
  title: string;
  sub: string;
  note: string;
  steps: { title: string; text: string }[];
  bandEyebrow: string;
  bandTitle: string;
  bandText: string;
  bandAr: string;
  bandCaption: string;
};
export type FaqItem = { q: string; a: string };
export type ContactContent = { whatsapp: string; email: string; hours: string; address: string };

export const DEFAULTS = {
  "site.copy": SITE_COPY_DEFAULTS,
  "home.media": { desktopImage: "/hero/lms-desktop.jpg?v=20261030", desktopAlt: "Dashboard ruang belajar", mobileImage: "/hero/lms-mobile.jpg?v=20261030", mobileAlt: "Halaman pelajaran di HP" },
  "social.posts": SOCIAL_POSTS,
  "home.main": {
    eyebrow: "Kelas kitab daring",
    title: "Pahami kitabnya.",
    sub: "Dari matan dasar ke pembahasan yang lebih dalam. Belajar lewat video, baca teks kitab, dan lanjutkan sesuai ritme kamu.",
    note: "Baca silabus dan coba pelajarannya sebelum daftar.",
    steps: [
      { title: "Pilih kursus", text: "Baca silabusnya, kenalan sama pengajarnya, dan tonton satu pelajaran pratinjau gratis." },
      { title: "Masuk dan bayar", text: "Masuk pakai akun Google, lalu bayar lewat QRIS atau virtual account. Kalau kursusnya gratis, langsung terbuka." },
      { title: "Belajar sesuai ritme", text: "Tonton videonya, baca matan, tandai pelajaran yang sudah selesai, dan lanjut persis dari pelajaran terakhir." },
    ],
    bandEyebrow: "Seperti apa belajarnya",
    bandTitle: "Matan di depan mata, penjelasan di bawahnya.",
    bandText: "Tiap pelajaran menampilkan teks Arab kitab apa adanya, terjemahan per kalimat, lalu penjelasan pengajar lewat video dan bacaan.",
    bandAr: "الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفِيدُ بِالوَضْعِ",
    bandCaption: "\"Kalam adalah lafaz yang tersusun, berfaedah, dan diucapkan dengan bahasa Arab.\" Matan al-Ajurrumiyyah, bab pertama.",
  } satisfies HomeContent,
  "faq.items": [
    { q: "Harus bisa bahasa Arab dulu?", a: "Nggak harus. Kursus marhalah ula dibuat buat pemula, dan setiap teks Arab ada terjemahannya." },
    { q: "Bayarnya bisa pakai apa aja?", a: "QRIS, virtual account bank, dan e-wallet lewat Mayar. Kelas langsung aktif setelah pembayaran terverifikasi." },
    { q: "Sudah bayar tapi kelas belum kebuka, gimana?", a: "Cek halaman Pembayaran di dashboard buat lihat statusnya. Kalau 15 menit masih menunggu, chat admin lewat WhatsApp yang ada di halaman Kontak." },
    { q: "Ada kebijakan refund?", a: "Ada. Ketentuannya ditulis lengkap di halaman Kebijakan refund." },
    { q: "Ada kursus gratis?", a: "Ada. Pakai filter \"Gratis\" di katalog buat lihat kursus yang bisa langsung kamu ikuti." },
  ] satisfies FaqItem[],
  "contact.main": {
    whatsapp: "01515367729",
    email: "[email admin]",
    hours: "Senin sampai Jumat, 09.00 sampai 17.00 WIB",
    address: "S. Fawatem, imarah 12, 3st floor, gamaleya, Cairo",
  } satisfies ContactContent,
};

export type ContentKey = keyof typeof DEFAULTS;

export async function getContent<K extends ContentKey>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const load = unstable_cache(
    async () => {
      const row = await db.siteContent.findUnique({ where: { key } });
      if (!row) return DEFAULTS[key];
      try {
        const v = JSON.parse(row.value);
        return Array.isArray(DEFAULTS[key]) ? v : { ...(DEFAULTS[key] as object), ...v };
      } catch {
        return DEFAULTS[key];
      }
    },
    ["content", key],
    { tags: ["content", `content:${key}`, "home"], revalidate: 300 },
  );
  return (await load()) as (typeof DEFAULTS)[K];
}

export async function saveContent(key: ContentKey, value: unknown, by: string) {
  const json = JSON.stringify(value);
  await db.$transaction(async (tx) => {
    await tx.siteContent.upsert({
      where: { key },
      update: { value: json, updatedBy: by },
      create: { key, value: json, updatedBy: by },
    });
    const last = await tx.siteContentVersion.aggregate({ where: { key }, _max: { version: true } });
    await tx.siteContentVersion.create({ data: { key, version: (last._max.version ?? 0) + 1, value: json, createdBy: by } });
  });
  revalidateTag("content");
  revalidateTag(`content:${key}`);
  revalidateTag("home");
}

// ---------- dokumen legal ----------

export const LEGAL_SLUGS = ["privasi", "syarat", "refund", "kontak"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];
export const LEGAL_TITLE: Record<LegalSlug, string> = {
  privasi: "Kebijakan privasi",
  syarat: "Syarat dan ketentuan",
  refund: "Kebijakan refund",
  kontak: "Kontak",
};

export const LEGAL_DEFAULT: Record<Exclude<LegalSlug, "kontak">, string> = {
  privasi: `> **Draf awal, perlu ditinjau dan disetujui pengelola sebelum diterbitkan.**

## Data yang kami kumpulkan
Waktu kamu masuk pakai Google, kami menerima nama, alamat email, dan foto profil. Waktu beli kursus berbayar, kami minta nomor WhatsApp. Kami juga mencatat kemajuan belajarmu (pelajaran yang dibuka dan diselesaikan).

## Tujuan penggunaan
Data dipakai untuk membuat akun, memproses pembayaran, membuka akses kursus, menyimpan progres belajar, dan menghubungi kamu kalau ada kendala pembayaran.

## Pihak ketiga
Login diproses oleh Google. Pembayaran diproses oleh Mayar. Nomor WhatsApp dan email dikirim ke Mayar hanya untuk keperluan tagihan.

## Penyimpanan dan keamanan
Data disimpan di server kami dengan akses terbatas. Kami tidak menjual datamu.

## Hak kamu
Sesuai UU Pelindungan Data Pribadi No. 27 Tahun 2022, kamu berhak meminta akses, perbaikan, atau penghapusan data. Hubungi kami lewat halaman Kontak.`,
  syarat: `> **Draf awal, perlu ditinjau dan disetujui pengelola sebelum diterbitkan.**

## Akun
Kamu masuk memakai akun Google. Kamu bertanggung jawab atas aktivitas di akunmu dan tidak membagikan akses kursus ke orang lain.

## Akses kursus
Pembelian memberi akses personal ke kursus yang dibeli. Akses tidak dapat dipindahtangankan.

## Hak cipta
Seluruh materi (video, teks, catatan) dilindungi hak cipta. Dilarang menyalin atau menyebarluaskan tanpa izin tertulis.

## Pembayaran
Harga tertera dalam rupiah. Pembayaran diproses oleh Mayar. Kelas terbuka otomatis setelah pembayaran terverifikasi.

## Perubahan
Kami dapat memperbarui syarat ini. Versi terbaru selalu ada di halaman ini.`,
  refund: `> **Draf awal. Ketentuan angka (jumlah hari, kondisi) perlu diputuskan pengelola sebelum diterbitkan.**

## Kapan refund dapat diajukan
[Tentukan: mis. dalam 3 hari setelah pembayaran dan belum menyelesaikan lebih dari 20% pelajaran.]

## Kapan refund tidak dapat diajukan
[Tentukan: mis. akses sudah dipakai melebihi batas, atau pelanggaran syarat dan ketentuan.]

## Cara mengajukan
Hubungi admin lewat halaman Kontak dengan menyebut email akun dan nama kursus.

## Proses
Pengembalian dana diproses melalui Mayar. Lama proses [tentukan] hari kerja setelah disetujui.`,
};

export async function getLegal(slug: Exclude<LegalSlug, "kontak">) {
  const doc = await db.legalDocument.findFirst({
    where: { slug, publishedAt: { not: null } },
    orderBy: { version: "desc" },
  });
  if (doc) return { title: doc.title, bodyMd: doc.bodyMd, version: doc.version, updatedAt: doc.publishedAt!, isDefault: false };
  return { title: LEGAL_TITLE[slug], bodyMd: LEGAL_DEFAULT[slug], version: 0, updatedAt: null as Date | null, isDefault: true };
}
