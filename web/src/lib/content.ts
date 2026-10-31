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
    title: "Selamat datang",
    sub: "Daurah Aqliyah: Ilmu Mantiq dengan Matan Isaghuji dan Ushul Fiqh dengan Matan Waraqat, bersama pengajar dari Al-Azhar, Kairo. Belajar lewat video, ulang kapan saja.",
    note: "Ambil satu kelas, atau paket bundling biar lebih hemat.",
    steps: [
      { title: "Pilih kelas", text: "Ambil kelas Mantiq atau Ushul Fiqh, atau paket bundling yang berisi keduanya. Baca isinya dan kenalan sama pengajarnya dulu." },
      { title: "Masuk dan bayar", text: "Masuk pakai akun Google, lalu bayar lewat QRIS atau virtual account. Kalau kursusnya gratis, langsung terbuka." },
      { title: "Belajar sesuai ritme", text: "Tonton videonya, baca matan, tandai pelajaran yang sudah selesai, dan lanjut persis dari pelajaran terakhir." },
    ],
    bandEyebrow: "Seperti apa belajarnya",
    bandTitle: "Matan di depan mata, penjelasan di bawahnya.",
    bandText: "Tiap pelajaran menampilkan teks Arab kitab apa adanya, terjemahan per kalimat, lalu penjelasan pengajar lewat video dan bacaan.",
    bandAr: "هَذِهِ وَرَقَاتٌ تَشْتَمِلُ عَلَى مَعْرِفَةِ فُصُولٍ مِنْ أُصُولِ الفِقْهِ",
    bandCaption: "\"Ini lembaran-lembaran yang memuat pengetahuan tentang beberapa pasal ushul fiqh.\" Matan al-Waraqat, pembukaan.",
  } satisfies HomeContent,
  "faq.items": [
    { q: "Apa bedanya Bundling dan Kelas Online?", a: "Kelas Online itu satu kelas: Mantiq atau Ushul Fiqh, masing-masing Rp 70.000. Bundling Dauroh Aqliyat berisi dua kelas itu sekaligus, cukup Rp 100.000. Sekali bayar, dua-duanya langsung terbuka." },
    { q: "Harus bisa bahasa Arab dulu?", a: "Nggak harus fasih. Kelas ini mulai dari dasar, dan pengajar menerangkan matannya pelan-pelan." },
    { q: "Bayarnya bisa pakai apa aja?", a: "QRIS, virtual account bank, dan e-wallet lewat Mayar. Kelas langsung aktif setelah pembayaran terverifikasi." },
    { q: "Sudah bayar tapi kelas belum kebuka, gimana?", a: "Cek halaman Pembayaran di dashboard buat lihat statusnya. Kalau 15 menit masih menunggu, chat admin lewat WhatsApp yang ada di halaman Kontak." },
    { q: "Ada kebijakan refund?", a: "Ada. Ketentuannya ditulis lengkap di halaman Kebijakan refund." },
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
  // Cache hanya menyimpan nilai mentah dari database. Penggabungan dengan DEFAULTS dilakukan di luar cache,
  // supaya kolom baru (mis. label menu) langsung punya teks bawaan setelah update tanpa menunggu cache kedaluwarsa.
  const load = unstable_cache(
    async () => {
      const row = await db.siteContent.findUnique({ where: { key } });
      if (!row) return null;
      try {
        return JSON.parse(row.value) as unknown;
      } catch {
        return null;
      }
    },
    ["content-raw", key],
    { tags: ["content", `content:${key}`, "home"], revalidate: 300 },
  );
  const stored = await load();
  const fallback = DEFAULTS[key];
  if (stored === null) return fallback;
  if (Array.isArray(fallback)) return (Array.isArray(stored) ? stored : fallback) as (typeof DEFAULTS)[K];
  return { ...(fallback as object), ...(stored as object) } as (typeof DEFAULTS)[K];
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
  privasi: `*Terakhir diperbarui: 1 November 2026*

Nizhamiyyah Edu ("kami") adalah layanan kelas kitab daring. Kebijakan ini menjelaskan data apa yang kami kumpulkan saat kamu memakai belajarditimurtengah.com, untuk apa data itu dipakai, dan apa saja hakmu atas data tersebut.

## 1. Data yang kami kumpulkan
- **Data akun (dari Google).** Saat masuk dengan Google, kami menerima nama, alamat email, dan foto profil akun Google-mu. Kami tidak pernah menerima atau menyimpan kata sandi Google-mu.
- **Nomor WhatsApp.** Diminta saat kamu membeli kelas berbayar, untuk keperluan tagihan dan bantuan bila ada kendala pembayaran.
- **Data transaksi.** Kelas yang dibeli, nominal, status pembayaran, waktu, dan nomor tagihan. Kami tidak menyimpan nomor kartu, rekening, atau data dompet digitalmu; semua itu hanya diproses oleh penyedia pembayaran.
- **Data belajar.** Pelajaran yang kamu buka dan selesaikan, waktu terakhir dibuka, catatan pribadi yang kamu tulis, serta sertifikat yang terbit atas namamu.
- **Data teknis.** Cookie sesi untuk menjaga kamu tetap masuk, dan catatan aktivitas sederhana (misalnya halaman kelas yang dibuka) untuk memahami kelas mana yang diminati. Catatan ini tidak dipakai untuk iklan.

## 2. Untuk apa data dipakai
- Membuat dan mengelola akunmu serta menjaganya tetap aman.
- Memproses pembayaran dan membuka akses kelas yang kamu beli.
- Menyimpan progres, catatan, dan menerbitkan sertifikat.
- Menghubungi kamu terkait pembayaran, akses, atau pertanyaan yang kamu ajukan.
- Mencegah penyalahgunaan, misalnya akses kelas yang dibagikan ke orang lain.
- Memperbaiki layanan berdasarkan data penggunaan yang bersifat umum.

Kami tidak menjual datamu dan tidak memakainya untuk iklan pihak lain.

## 3. Pihak ketiga yang terlibat
- **Google** memproses proses masuk (login).
- **Mayar** memproses pembayaran. Nama, email, dan nomor WhatsAppmu dikirim ke Mayar hanya untuk membuat tagihan dan bukti pembayaran. Data di sisi Mayar tunduk pada kebijakan privasi Mayar.
- **Vercel** (hosting) dan **Supabase** (database) menyimpan dan menjalankan layanan kami. Server berada di kawasan Eropa.
- **YouTube** dipakai untuk memutar sebagian video pelajaran. Saat video diputar, YouTube dapat memasang cookie sesuai kebijakannya sendiri.

Kami hanya membagikan data kepada pihak di luar daftar ini bila diwajibkan oleh hukum atau perintah pihak berwenang.

## 4. Sertifikat dan verifikasi publik
Sertifikat memiliki nomor unik. Siapa pun yang memegang nomor itu dapat membuka halaman verifikasi yang menampilkan **nama pemegang, judul kelas, jumlah pelajaran, tanggal selesai, dan nama pengajar**. Data lain tidak ditampilkan. Bila kamu tidak ingin namamu tampil di sertifikat, hubungi kami sebelum sertifikat dibagikan.

## 5. Lama penyimpanan
Data akun, transaksi, dan progres belajar disimpan selama akunmu aktif. Data transaksi dapat kami simpan lebih lama bila diperlukan untuk pembukuan, penyelesaian sengketa, atau kewajiban hukum. Setelah akun dihapus, data pribadi dihapus atau dianonimkan dalam waktu wajar, kecuali yang wajib kami simpan.

## 6. Keamanan
Seluruh komunikasi memakai HTTPS. Akses ke database dibatasi dan hanya lewat server kami. Tidak ada sistem yang sepenuhnya kebal, jadi bila terjadi kebocoran data yang berdampak padamu, kami akan memberitahumu dan menanganinya sesuai ketentuan yang berlaku.

## 7. Hakmu
Sesuai Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022), kamu berhak untuk mengetahui data apa yang kami simpan, meminta salinannya, memperbaiki data yang keliru, menarik persetujuan, dan meminta penghapusan datamu. Kirim permintaan lewat WhatsApp atau email admin di halaman Kontak dengan menyebut email akunmu. Kami berusaha menanggapi dalam 14 hari kerja. Perlu diketahui bahwa menghapus akun berarti kehilangan akses ke kelas yang sudah dibeli, dan pembelian tersebut tidak otomatis dikembalikan.

## 8. Anak-anak
Layanan ini ditujukan bagi pengguna berusia 17 tahun ke atas. Pengguna yang lebih muda perlu didampingi dan memakai akun orang tua atau walinya.

## 9. Perubahan kebijakan
Kebijakan ini dapat kami perbarui. Versi terbaru selalu ada di halaman ini, lengkap dengan tanggal pembaruannya. Perubahan penting akan kami umumkan lewat website atau WhatsApp.`,
  syarat: `*Terakhir diperbarui: 1 November 2026*

Dengan masuk dan memakai layanan Nizhamiyyah Edu, kamu menyatakan telah membaca dan menyetujui syarat berikut. Bila tidak setuju, mohon tidak memakai layanan ini.

## 1. Tentang layanan
Nizhamiyyah Edu menyediakan kelas kitab daring berupa video rekaman, matan, dan catatan pengajar yang dapat dipelajari kapan saja. Semua kelas bersifat berbayar dan diakses lewat akun yang sudah dibeli. Kelas yang tersedia dapat bertambah, berubah, atau dihentikan penjualannya sewaktu-waktu; kelas yang sudah kamu beli tetap dapat kamu akses sesuai ketentuan di bawah.

## 2. Akun
- Kamu masuk memakai akun Google. Gunakan akun milikmu sendiri.
- Kamu bertanggung jawab atas semua aktivitas di akunmu dan menjaga keamanan akun Google-mu.
- Satu akun untuk satu orang. Akses kelas tidak boleh dibagikan, dipinjamkan, atau dijual ke orang lain.
- Informasi yang kamu berikan (misalnya nomor WhatsApp) harus benar dan dapat dihubungi.

## 3. Harga dan pembayaran
- Harga tertera dalam rupiah dan dapat berubah sewaktu-waktu. Harga yang berlaku adalah yang tampil saat kamu membuat tagihan. Pembeli lama tidak terpengaruh perubahan harga.
- Pembayaran diproses oleh Mayar (misalnya QRIS atau virtual account). Tagihan berlaku dalam batas waktu yang tertera; tagihan yang kedaluwarsa dapat dibuat ulang.
- Kelas terbuka otomatis setelah pembayaran terverifikasi. Bila sudah membayar tetapi kelas belum terbuka, hubungi admin dengan bukti pembayaran.
- Paket (bundling) memberi akses ke semua kelas di dalamnya dengan harga paket. Bila sebagian kelas sudah kamu miliki, harga paket tidak otomatis dikurangi.

## 4. Akses kelas
- Pembelian memberi akses personal dan tidak eksklusif ke kelas yang dibeli, selama kelas itu masih kami sediakan dan akunmu tidak melanggar syarat ini.
- Akses tidak dapat dipindahtangankan atau diuangkan.
- Kami berupaya menjaga layanan tetap berjalan, tetapi tidak menjamin layanan bebas gangguan. Gangguan teknis, pemeliharaan, atau gangguan dari pihak ketiga (hosting, YouTube, penyedia pembayaran) dapat terjadi.

## 5. Hak cipta dan penggunaan materi
Seluruh materi, termasuk video, teks, terjemahan, catatan pengajar, desain, dan logo, dilindungi hak cipta dan hak terkait milik Nizhamiyyah Edu dan pengajarnya. Kamu boleh memakai materi untuk belajar pribadi. Kamu **tidak boleh** merekam layar, mengunduh, menyalin, membagikan, menjual, mengunggah ulang, atau membuat turunan dari materi tanpa izin tertulis. Matan kitab klasik yang dikutip tetap merupakan karya ulama pengarangnya.

## 6. Perilaku yang dilarang
- Membagikan akses atau akun, atau memakai akun orang lain.
- Mencoba menembus keamanan, mengganggu server, atau mengambil data secara otomatis.
- Menyalahgunakan fitur pembayaran, termasuk memalsukan bukti pembayaran.
- Menulis konten yang melanggar hukum atau menyinggung SARA di fitur yang menerima tulisan pengguna.

Pelanggaran dapat berakibat pembatasan atau pencabutan akses tanpa pengembalian dana.

## 7. Catatan pribadi dan sertifikat
Catatan yang kamu tulis bersifat pribadi dan hanya dapat dilihat olehmu. Sertifikat diterbitkan otomatis setelah seluruh pelajaran sebuah kelas kamu tandai selesai. Sertifikat menyatakan penyelesaian kelas, bukan ijazah atau akreditasi resmi. Nomor sertifikat dapat diperiksa keasliannya secara publik, dan sertifikat dapat dicabut bila diperoleh dengan cara curang atau akun melanggar syarat ini.

## 8. Batasan tanggung jawab
Materi disajikan untuk tujuan belajar. Kami berusaha menjaga ketepatannya, tetapi tidak menjamin hasil belajar tertentu. Sejauh diizinkan hukum, tanggung jawab kami terbatas pada nilai yang kamu bayarkan untuk kelas yang bersangkutan. Untuk urusan fatwa dan hukum syariat yang menyangkut kondisi pribadimu, rujuklah kepada ulama atau ustadz yang kamu percaya.

## 9. Refund dan privasi
Pengembalian dana diatur dalam Kebijakan refund, dan pengelolaan datamu dalam Kebijakan privasi. Keduanya menjadi bagian dari syarat ini.

## 10. Perubahan syarat
Kami dapat memperbarui syarat ini. Versi terbaru selalu ada di halaman ini beserta tanggal pembaruannya. Dengan tetap memakai layanan setelah perubahan berlaku, kamu dianggap menyetujuinya.

## 11. Hukum dan penyelesaian sengketa
Syarat ini tunduk pada hukum Republik Indonesia. Bila ada perselisihan, kita upayakan penyelesaian secara musyawarah lebih dulu lewat admin. Bila tidak tercapai, sengketa diselesaikan menurut hukum yang berlaku di Indonesia.`,
  refund: `*Terakhir diperbarui: 1 November 2026*

Kelas di Nizhamiyyah Edu berupa konten digital yang aksesnya langsung terbuka setelah pembayaran. Karena itu pengembalian dana kami batasi pada kondisi di bawah ini, supaya adil bagi pembeli maupun pengajar.

## 1. Kapan refund dapat diajukan
Kamu dapat mengajukan refund bila **salah satu** kondisi ini terpenuhi:
- **Masa percobaan.** Pengajuan dilakukan dalam **3 x 24 jam** sejak pembayaran terverifikasi, dan kamu baru menyelesaikan **tidak lebih dari 20%** pelajaran di kelas tersebut.
- **Pembayaran ganda.** Kamu membayar tagihan yang sama lebih dari sekali, atau membeli kelas yang sama dua kali karena kesalahan sistem. Kelebihannya dikembalikan penuh.
- **Kelas tidak dapat diakses.** Setelah dibayar, kelas tidak terbuka atau tidak dapat dipelajari karena kendala dari pihak kami, dan masalah itu tidak berhasil kami selesaikan dalam **7 hari** sejak kamu melapor.
- **Kelas dihentikan.** Kami menghentikan kelas sebelum kamu sempat mempelajarinya secara berarti. Pengembalian dihitung sebanding dengan bagian yang belum kamu pakai.

## 2. Kapan refund tidak dapat diajukan
- Pengajuan lewat dari 3 x 24 jam, atau kamu sudah menyelesaikan lebih dari 20% pelajaran, kecuali termasuk kondisi pada nomor 1 (pembayaran ganda, kelas tidak dapat diakses, atau kelas dihentikan).
- Alasan perubahan pikiran, merasa kurang cocok dengan gaya pengajar, atau kesulitan mengikuti materi setelah masa percobaan lewat.
- Kendala dari sisi perangkat atau jaringan internetmu sendiri, selama kelas dapat diakses dengan normal dari perangkat atau jaringan lain.
- Akun dibatasi atau dicabut karena melanggar Syarat dan ketentuan, misalnya membagikan akses atau merekam materi.
- Sertifikat sudah terbit untuk kelas tersebut.

## 3. Paket (bundling)
Refund paket dihitung atas paket secara utuh dengan kondisi yang sama, dengan batas 20% dihitung dari **seluruh pelajaran di dalam paket**. Refund tidak dapat diajukan hanya untuk sebagian kelas dalam paket, kecuali kelas yang bersangkutan mengalami kendala seperti pada nomor 1.

## 4. Cara mengajukan
Hubungi admin lewat WhatsApp atau email di halaman Kontak, dan sertakan:
1. email akun yang dipakai belajar,
2. nama kelas yang dibeli,
3. nomor atau bukti pembayaran,
4. alasan pengajuan (dan tangkapan layar bila ada kendala teknis).

## 5. Proses
- Kami memeriksa pengajuanmu dan memberi jawaban dalam **3 hari kerja**.
- Bila disetujui, dana dikembalikan lewat Mayar ke metode pembayaran asal atau, bila tidak memungkinkan, ke rekening atau dompet digital atas namamu. Proses memakan waktu sekitar **3 sampai 14 hari kerja** tergantung penyedia pembayaran.
- Biaya layanan dari penyedia pembayaran dapat dipotong dari nominal yang dikembalikan, kecuali penyebabnya adalah kesalahan dari pihak kami.
- Setelah refund disetujui, akses ke kelas tersebut dicabut dan sertifikat (bila ada) dibatalkan.

## 6. Bila refund ditolak
Kami akan menjelaskan alasannya. Kamu dapat membalas dengan informasi tambahan, dan kami akan meninjau ulang sekali.

Ketentuan ini tidak mengurangi hakmu sebagai konsumen menurut peraturan perundang-undangan yang berlaku.`,
};

export async function getLegal(slug: Exclude<LegalSlug, "kontak">) {
  const doc = await db.legalDocument.findFirst({
    where: { slug, publishedAt: { not: null } },
    orderBy: { version: "desc" },
  });
  if (doc) return { title: doc.title, bodyMd: doc.bodyMd, version: doc.version, updatedAt: doc.publishedAt!, isDefault: false };
  return { title: LEGAL_TITLE[slug], bodyMd: LEGAL_DEFAULT[slug], version: 0, updatedAt: null as Date | null, isDefault: true };
}
