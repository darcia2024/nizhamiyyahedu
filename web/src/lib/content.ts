import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";

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
  "home.main": {
    eyebrow: "Kelas kitab daring · kurikulum pesantren Timur Tengah",
    title: "Belajar kitab, satu marhalah demi satu marhalah.",
    sub: "Setiap kursus mengikuti satu kitab rujukan, diajarkan oleh pengajar yang sanadnya jelas. Mulai dari matan dasar, naik ke jenjang berikutnya saat Anda siap.",
    note: "Katalog dan silabus bisa dilihat tanpa login. Pembayaran lewat QRIS atau virtual account, dan kelas aktif otomatis setelah lunas.",
    steps: [
      { title: "Pilih kursus", text: "Baca silabus, kenali pengajarnya, dan tonton satu pelajaran pratinjau gratis." },
      { title: "Masuk dan bayar", text: "Masuk dengan akun Google, lalu bayar lewat QRIS atau virtual account. Kursus gratis langsung terbuka." },
      { title: "Belajar sesuai ritme", text: "Tonton, baca matan, tandai pelajaran selesai, dan lanjutkan tepat dari pelajaran terakhir." },
    ],
    bandEyebrow: "Seperti apa belajarnya",
    bandTitle: "Matan di depan mata, penjelasan di bawahnya.",
    bandText: "Setiap pelajaran menampilkan teks Arab kitab apa adanya, terjemah per kalimat, lalu syarah dari pengajar dalam bentuk video dan bacaan.",
    bandAr: "الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفِيدُ بِالوَضْعِ",
    bandCaption: "\"Kalam adalah lafaz yang tersusun, berfaedah, dan diucapkan dengan bahasa Arab.\" Matan al-Ajurrumiyyah, bab pertama.",
  } satisfies HomeContent,
  "faq.items": [
    { q: "Apakah harus bisa bahasa Arab dulu?", a: "Tidak. Kursus marhalah ula ditujukan untuk pemula dan setiap teks Arab disertai terjemah." },
    { q: "Metode pembayaran apa saja?", a: "QRIS, virtual account bank, dan e-wallet melalui Mayar. Kelas aktif otomatis setelah pembayaran terverifikasi." },
    { q: "Bagaimana jika sudah bayar tapi kelas belum terbuka?", a: "Buka halaman Pembayaran di dashboard untuk melihat status. Jika setelah 15 menit masih menunggu, hubungi admin lewat WhatsApp yang tertera di halaman Kontak." },
    { q: "Apakah ada kebijakan pengembalian dana?", a: "Ada. Ketentuannya tertulis di halaman Kebijakan refund." },
    { q: "Apakah tersedia kursus gratis?", a: "Ya. Gunakan filter \"Gratis\" di katalog untuk melihat kursus yang bisa langsung diikuti." },
  ] satisfies FaqItem[],
  "contact.main": {
    whatsapp: "[+62 nomor admin]",
    email: "[email admin]",
    hours: "Senin sampai Jumat, 09.00 sampai 17.00 WIB",
    address: "",
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
Saat Anda masuk dengan Google, kami menerima nama, alamat email, dan foto profil. Saat membeli kursus berbayar, kami meminta nomor WhatsApp. Kami juga mencatat kemajuan belajar Anda (pelajaran yang dibuka dan diselesaikan).

## Tujuan penggunaan
Data dipakai untuk membuat akun, memproses pembayaran, membuka akses kursus, menyimpan progres belajar, dan menghubungi Anda bila ada kendala pembayaran.

## Pihak ketiga
Login diproses oleh Google. Pembayaran diproses oleh Mayar. Nomor WhatsApp dan email dikirim ke Mayar hanya untuk keperluan tagihan.

## Penyimpanan dan keamanan
Data disimpan di server kami dengan akses terbatas. Kami tidak menjual data Anda.

## Hak Anda
Sesuai UU Pelindungan Data Pribadi No. 27 Tahun 2022, Anda dapat meminta akses, perbaikan, atau penghapusan data. Hubungi kami lewat halaman Kontak.`,
  syarat: `> **Draf awal, perlu ditinjau dan disetujui pengelola sebelum diterbitkan.**

## Akun
Anda masuk memakai akun Google. Anda bertanggung jawab atas aktivitas di akun Anda dan tidak membagikan akses kursus kepada orang lain.

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
