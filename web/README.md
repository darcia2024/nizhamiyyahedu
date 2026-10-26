# Nizhamiyyah Edu - aplikasi

Implementasi Next.js dari PRD di root repo. Aplikasi ada di folder ini; halaman penawaran Vercel masih terpisah di `../penawaran`.

## Jalankan lokal

Gunakan Node.js 22 atau 24.

```powershell
cd web
npm ci
Copy-Item .env.example .env
# Isi AUTH_SECRET dengan nilai acak yang kuat sebelum menjalankan.
npx prisma generate
npm run db:prepare
npm run db:seed
npm run dev
```

Buka http://localhost:3200. Jika `.env` dan database lokal sudah ada, jangan timpa keduanya; cukup `npm run dev`.

`DEV_LOGIN=1` memberi pilihan akun lokal di `/masuk`:

| Akun contoh | Peran |
|---|---|
| admin@contoh.test | Admin |
| ustadz@contoh.test | Pengajar |
| siswa@contoh.test | User |

Login uji selalu mati saat `NODE_ENV=production`. Tanpa kunci Mayar, pembayaran lokal diarahkan ke simulasi milik akun yang sedang masuk. Simulasi juga selalu mati di production; kunci Mayar yang kosong tidak membuat kelas terbuka otomatis.

## Fitur

- Beranda, peta jenjang, katalog dengan pencarian/filter, detail kursus, pratinjau dan halaman informasi.
- Login Google, hak akses per peran, dashboard, kursus saya, progres dan profil.
- Checkout, riwayat/status pembayaran, webhook terautentikasi, pembatasan laju, pelunasan idempoten dan cron kedaluwarsa.
- Admin: ringkasan, kursus/pelajaran, pengajar/foto, user/peran/akses, pembayaran, konten, dokumen legal berversi, catatan aktivitas/CSV dan bantuan.
- Pengajar: kursus milik sendiri, editor matan/catatan, susun pelajaran, ajukan tayang dan ekspor progres user.

## Validasi

```powershell
npm run lint
npm test
npm audit --omit=dev
npm run build
```

Tes integrasi memakai `prisma/integration-test.db`, terpisah dari database aplikasi. File itu dibuat dan dibersihkan oleh tes. Matikan server dev sebelum `npm run build` di Windows agar DLL Prisma tidak terkunci dan folder `.next` tidak dipakai bersamaan.

## Database dan hosting

SQLite dipakai untuk pengembangan lokal. Skema dan migrasi awal merupakan implementasi baru berdasarkan PRD, bukan migrasi data website lama. Provider/schema asli belum tersedia untuk dicocokkan. Jangan menjalankan migrasi awal ini pada database production yang sudah berisi data. Lihat `../docs/schema-notes.md`.

Untuk database SQLite **baru dan kosong**, tersedia `npx prisma migrate deploy`. Untuk pengembangan lokal gunakan `npm run db:prepare`; skrip menyiapkan tabel dan indeks unik satu tagihan PENDING per user/kursus. `db:reset` menghapus data: tidak dipakai untuk production.

Foto pengajar disimpan ulang sebagai WebP di `web/uploads/` dan disajikan lewat `/api/media/`. Hosting harus menyediakan disk persisten atau penyimpanan objek yang sesuai. SQLite dan folder upload lokal tidak boleh dipakai apa adanya pada serverless Vercel.

Hosting website lama belum diubah. Website penawaran `nizhamiyyahedu.vercel.app` tetap memakai konfigurasi root repo; aplikasi ini belum menggantikannya.

## Sebelum rilis

1. Cocokkan skema asli dan data, siapkan backup dan staging.
2. Konfigurasi Google OAuth, Mayar sandbox/production, APP_URL, token webhook/cron/monitor, dan secret baru.
3. Jalankan transaksi sandbox sungguhan dan pastikan callback/webhook cocok dengan akun merchant.
4. Masukkan konten/pengajar/video/harga asli dan setujui dokumen legal lewat admin.
5. Setelah akun pengelola login Google, berikan peran pertama lewat `npm run admin:create -- email@domain.com` di hosting yang dipercaya.
6. Pasang cron tiap 15 menit ke `/api/cron/expire-orders` dengan header Bearer CRON_SECRET. Jangan taruh token pada URL publik.

Status pemeriksaan dan hal yang belum teruji ada di `../docs/implementation-status.md`.
