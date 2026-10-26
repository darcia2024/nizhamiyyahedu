# Status implementasi - 27 Oktober 2026

Status ini membedakan aplikasi lokal yang bisa dicoba dari gerbang rilis PRD. Jangan menandai 37 temuan production selesai hanya berdasarkan kode baru.

## Sudah dibuat

| Bagian PRD | Implementasi |
|---|---|
| 6, 7 | Source Next.js/TypeScript, token warna, Satoshi lokal, font publik dan Amiri, header keamanan, form validasi |
| 8 | Beranda, peta marhalah, katalog/cari/filter, detail dan pratinjau, legal/kontak, 404/error, sitemap/robots/ikon/OG |
| 9 | Login, dashboard, lanjut belajar, kursus saya, profil, video/matan/catatan, progres dan riwayat pembayaran |
| 10 | Order expiry, reuse invoice, indeks unik PENDING, webhook token/rate-limit/verifikasi ulang, settlement idempoten, arsip, log dan peran |
| 11 | Ringkasan admin, CRUD kursus/pelajaran/pengajar, foto WebP, user/peran/akses, pembayaran, isi website/FAQ/legal, log/CSV, bantuan teks |
| 11.7 | Kelola kursus milik pengajar, urut keyboard/seret, draf, matan, catatan, daftar user/CSV, ajukan tayang |

## Pengujian lokal

- TypeScript tanpa error.
- 56 tes unit/integrasi: WA, batas harga, slug, video, CSV, callback aman, kepemilikan kursus, pencabutan enrollment, database order sungguhan, nominal, duplikasi, idempotensi, arsip tetap tersedia bagi pendaftar, adapter Mayar, webhook dan respons retry jika database gagal.
- Pemeriksaan dependensi npm: 0 kerentanan setelah pin versi dan override PostCSS/deepmerge-ts. Override mayor deepmerge-ts divalidasi melalui prisma generate, db push, dan build.
- Build production berhasil; halaman publik beranda/halaman informasi dihasilkan statis dengan revalidasi 5 menit. Build diuji ulang setelah perubahan akhir.
- Browser: admin login lokal, buat kursus draf, buat pelajaran, pilih pengajar, tayangkan, baca di katalog, arsip dan cek 404 publik.
- Browser: ubah kontak admin, pastikan muncul di halaman publik, lalu kembalikan nilai uji.
- Browser: user biasa ditolak dari `/admin`.
- Browser: pengajar melihat mode pratinjau pada kursus miliknya, tanpa tombol perubahan progres.
- Browser: WA pendek menampilkan error, bayar simulasi berhasil, status Lunas, akses pelajaran aktif, tandai selesai menaikkan progres.
- Axe WCAG A/AA/2.1 AA: katalog, detail, dashboard, pelajaran, ringkasan admin, daftar kursus admin dan konten admin tanpa pelanggaran pada pemeriksaan lokal. Semantik tabel marhalah diperbaiki setelah temuan pada beranda dan diperiksa ulang.
- Beranda dan daftar kursus admin diperiksa pada lebar 320, 375, 768, 1280 dan 1920px tanpa overflow horizontal. Tabel admin berubah menjadi kartu pada HP. Bukti tampilan tersimpan di `docs/qa/`. Pemeriksaan ini tidak menggantikan tes perangkat fisik atau pembaca layar.

## Belum terverifikasi / gerbang rilis terbuka

| Hal | Kebutuhan |
|---|---|
| Source/schema production dan migrasi data lama | Cocokkan sumber asli dengan skema baru, backup, uji staging |
| Rotasi secret dan investigasi server lama | Akses hosting, Google, Mayar, database dan log |
| Google OAuth sungguhan | Client ID/secret dan authorized callback staging/production |
| Mayar sungguhan | Akun merchant/sandbox dan kredensial, uji transaksi nyata, webhook/retry/recheck |
| Konten final dan legal | Nama, harga, video, kontak, persetujuan kebijakan dari pengelola |
| Foto di production | Disk persisten atau adapter penyimpanan objek |
| Performance lapangan | Lighthouse/jaringan 4G, LCP/CLS/INP, bukan angka hasil dev server |
| Panduan bergambar/PDF, NVDA dan perangkat fisik | Bantuan teks sudah ada, versi bergambar/PDF belum dibuat |
| Konten berversi untuk semua jenis konten | Dokumen legal berversi; beranda/FAQ/kontak disimpan versi terkini dan dicatat sebagai aktivitas |
| Preview OG per kursus | Metadata kursus tersedia; gambar OG masih satu gambar umum |
| Redirect ID kursus lama | Alias katalog/admin tersedia, pemetaan ID lama perlu database asli |
| Staging/production, cron, monitor, backup dan serah terima | Belum dilakukan pada hosting klien |

Tidak ada deployment aplikasi baru ke domain penawaran atau website production pada tahap ini.
