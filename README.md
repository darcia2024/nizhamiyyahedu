# Nizhamiyyah Edu

Dokumen dan prototipe dari Dar Dev untuk belajarditimurtengah.com.

| Folder | Isi |
|---|---|
| [`web/`](web/) | Aplikasi Next.js: website publik, ruang belajar, pembayaran, alat pengajar dan admin panel. Petunjuk menjalankan ada di web/README.md. |
| [`docs/implementation-status.md`](docs/implementation-status.md) | Implementasi, hasil pengujian lokal dan kebutuhan sebelum rilis production |
| [`desain-html/`](desain-html/) | Prototipe HTML yang bisa diklik: beranda publik, dashboard siswa, katalog + checkout, dan halaman pelajaran |
| [`penawaran/`](penawaran/) | Halaman penawaran: masalah dan perbaikan, desain ulang, admin panel, waktu 1-4 hari, Rp3,5 juta, pembayaran 50% DP dan 50% pelunasan |
| [`audit/`](audit/) | Laporan audit lengkap: 37 temuan beserta bukti dan cara memperbaikinya |
| [`PRD.md`](PRD.md) | PRD pengerjaan: task per hari, checkpoint, logika, dan spesifikasi UI/UX |

## Membuka

Tidak perlu build. Buka `desain-html/index.html`, `penawaran/index.html`, atau `audit/index.html` langsung di browser.

Prototipe dashboard memakai font Satoshi (lisensi gratis Fontshare/ITF) yang disimpan di `desain-html/fonts/`. Teks Arab memakai Amiri dari Google Fonts, jadi butuh internet.

## Catatan

- Semua nama pengajar, harga kursus, dan angka statistik di prototipe adalah contoh, ditandai dengan `[...]`.
- Audit dibuat dari build production tanpa source code. Cocokkan versi patch Next.js dan React dengan advisori resmi sebelum upgrade.
