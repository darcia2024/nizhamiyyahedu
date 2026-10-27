# PRD — Nizhamiyyah Edu: Perbaikan, Desain Ulang, dan Admin Panel

| | |
|---|---|
| **Produk** | Nizhamiyyah Edu — belajarditimurtengah.com |
| **Versi / tanggal** | 1.0 · 26 Oktober 2026 |
| **Penulis** | Dar Dev |
| **Klien** | Tim Nizhamiyyah Edu |
| **Sumber** | [`penawaran/index.html`](penawaran/index.html) (ruang lingkup, jadwal, biaya), [`audit/index.html`](audit/index.html) (37 temuan + bukti), [`desain-html/`](desain-html/) (prototipe visual) |
| **Status** | Draf untuk disetujui klien sebelum DP |

> Implementasi lokal dimulai pada 27 Oktober 2026 di folder `web/`. Status dan bukti pemeriksaan dicatat terpisah di [`docs/implementation-status.md`](docs/implementation-status.md). Checklist rilis production di dokumen ini belum dinyatakan selesai.

> Dokumen ini adalah acuan tunggal pengerjaan. Kalau ada beda antara PRD ini dan penawaran, **penawaran menang untuk ruang lingkup/jadwal/biaya**, PRD menang untuk detail teknis dan perilaku.

---

## Daftar isi

1. [Ringkasan](#1-ringkasan)
2. [Tujuan, non-tujuan, metrik sukses](#2-tujuan-non-tujuan-metrik-sukses)
3. [Pengguna dan hak akses](#3-pengguna-dan-hak-akses)
4. [Ruang lingkup dan keterlacakan](#4-ruang-lingkup-dan-keterlacakan)
5. [Prasyarat, asumsi, dan blocker](#5-prasyarat-asumsi-dan-blocker)
6. [Arsitektur dan keputusan teknis](#6-arsitektur-dan-keputusan-teknis)
7. [Sistem desain (UI/UX)](#7-sistem-desain-uiux)
8. [Spesifikasi halaman publik](#8-spesifikasi-halaman-publik)
9. [Spesifikasi area siswa](#9-spesifikasi-area-siswa)
10. [Logika inti](#10-logika-inti)
11. [Spesifikasi admin panel dan alat pengajar](#11-spesifikasi-admin-panel-dan-alat-pengajar)
12. [Rencana kerja: task dan checkpoint per hari](#12-rencana-kerja-task-dan-checkpoint-per-hari)
13. [Persyaratan non-fungsional](#13-persyaratan-non-fungsional)
14. [Rencana pengujian](#14-rencana-pengujian)
15. [Rilis, rollback, serah terima](#15-rilis-rollback-serah-terima)
16. [Risiko](#16-risiko)
17. [Kebutuhan konten dan pertanyaan terbuka](#17-kebutuhan-konten-dan-pertanyaan-terbuka)
18. [Lampiran](#18-lampiran)

---

## 1. Ringkasan

Nizhamiyyah Edu adalah platform kelas kitab daring (Nahwu, Fiqih, Aqidah, dst.) berjenjang ala pesantren/universitas Timur Tengah. Stack saat ini: Next.js 15.1.3 (App Router, Server Actions), React 19.0.0, Prisma 6.1.0, NextAuth 5 beta (login Google), pembayaran lewat Mayar (QRIS, VA, e-wallet). Siswa login, beli kursus, lalu belajar lewat video + teks kitab.

Audit menemukan **37 masalah** (1 kritis, 7 tinggi, 16 sedang, 13 rendah — rincian per ID di [`audit/index.html`](audit/index.html) dan Lampiran A). Yang terpenting:

- Server rentan RCE tanpa login (Next/React versi lama) dan kunci enkripsi ikut tersimpan di hasil build.
- Funnel pendaftaran bocor: 6 tombol utama di beranda mental balik ke beranda untuk pengunjung baru; katalog dan silabus tidak bisa dilihat sebelum login.
- Alur bayar rapuh: pesan error hilang, status pembayaran palsu, tagihan dobel/tak kedaluwarsa.
- Tidak ada halaman legal (privasi, syarat, refund, kontak).
- Hampir semua pengaturan konten hanya bisa diubah lewat kode.

**Deliverable** (sesuai penawaran, Rp3,5 juta, 1–4 hari kerja):

1. **Perbaikan** 37 temuan audit (keamanan dulu).
2. **Desain ulang** beranda, katalog + detail kursus + checkout, dashboard siswa, halaman pelajaran.
3. **Admin panel** untuk kursus/pelajaran/pengajar, user & akses, pembayaran, isi halaman, dan ringkasan angka.

---

## 2. Tujuan, non-tujuan, metrik sukses

### 2.1 Tujuan

| # | Tujuan | Ukuran |
|---|---|---|
| G1 | Tidak ada celah kritis/tinggi yang tersisa di keamanan | Versi Next/React sesuai advisori; semua secret baru; header keamanan hadir; pemindaian header lulus |
| G2 | Pengunjung baru bisa melihat katalog, silabus, harga, dan pengajar tanpa login | Tamu bisa ke `/kursus/[slug]` dari beranda dalam ≤ 2 klik, tanpa redirect diam-diam |
| G3 | Alur bayar jujur dan tahan kesalahan | Semua kesalahan input tampil di bawah field; status order = status nyata; 0 order dobel |
| G4 | Tim Nizhamiyyah mengurus website sendiri | Semua item di §11 bisa dikerjakan dari `/admin` tanpa menyentuh kode |
| G5 | Tampilan nyaman di laptop dan HP, memenuhi WCAG 2.2 AA | Audit a11y otomatis + manual lulus (§13.3) |
| G6 | Halaman cepat | LCP ≤ 2,5 dtk di 4G untuk beranda dan detail kursus (§13.2) |

### 2.2 Non-tujuan (tidak dikerjakan di rilis ini)

- Forum/diskusi, kuis/ujian, notifikasi email/WhatsApp otomatis, aplikasi mobile native. (Sertifikat penyelesaian dikeluarkan dari daftar ini pada 27 Okt 2026 atas permintaan klien dan dibangun sebagai halaman cetak/PDF.)
- Metode login selain Google. Multi-bahasa (situs tetap Bahasa Indonesia; teks Arab hanya untuk matan).
- Langganan/paket bundel, kupon, afiliasi, refund otomatis lewat API (refund tetap proses manual lewat admin + dashboard Mayar).
- Hosting video sendiri (video tetap YouTube atau file video langsung dari host yang di-allowlist).
- Migrasi platform/hosting.

### 2.3 Metrik (diukur klien setelah rilis, bukan syarat serah terima)

| Metrik | Cara ukur | Arah |
|---|---|---|
| Rasio kunjungan → klik "Daftar" | Admin panel (§11.6) + analitik | naik |
| Rasio klik "Daftar" → lunas | `Order` PAID / checkout dimulai | naik |
| Order PENDING kedaluwarsa tak tertangani | Admin → Pembayaran | → 0 |
| Pertanyaan WA "sudah bayar tapi belum terbuka" | Laporan tim | turun |

---

## 3. Pengguna dan hak akses

### 3.1 Persona

| Persona | Konteks | Kebutuhan utama | Hal yang membuat batal |
|---|---|---|---|
| **Calon siswa (tamu)** — Rizky, 24, mahasiswa, HP Android, jaringan 4G | Datang dari link WhatsApp/Instagram | Tahu *kitab apa*, *siapa pengajar*, *berapa harga*, *apa isi pelajaran* sebelum daftar | Tombol yang "tidak jalan", paksa login sebelum melihat apa pun, halaman berat |
| **Siswa aktif** — Ahmad Fauzi, 30, pekerja | Belajar malam hari di HP, kadang di laptop | Lanjut dari pelajaran terakhir dalam 1 ketukan, lihat progres, baca matan Arab yang jelas | Harus mencari pelajaran terakhir, teks Arab kecil/tidak RTL |
| **Pengajar** — Ustadz/Ustadzah | Menyusun pelajaran | Tambah/urut pelajaran, pratinjau sebelum tayang, lihat siswa & progres | Draf langsung tayang, urutan tak bisa diubah |
| **Admin Nizhamiyyah** — non-teknis | Mengurus operasional harian | Kelola kursus, user, pembayaran nyangkut, teks website | Harus minta programmer untuk hal kecil |

### 3.2 Peran dan matriks izin

Peran di database: `STUDENT`, `TEACHER` (pengajar), `ADMIN`. Semua pengecekan lewat satu modul `lib/auth-guard.ts` (T1.9).

| Aksi | Tamu | Siswa | Pengajar | Admin |
|---|:--:|:--:|:--:|:--:|
| Lihat beranda, katalog, detail kursus, pelajaran pratinjau gratis, halaman legal | ✅ | ✅ | ✅ | ✅ |
| Daftar kursus gratis / bayar kursus berbayar | ➡️ login dulu | ✅ | ✅ | ✅ |
| Buka pelajaran kursus yang diikuti, tandai selesai | ❌ | ✅ | ❌ | ❌ |
| Buka semua pelajaran sebagai **pratinjau** (tanpa progres) | ❌ | ❌ | hanya kursus miliknya | ✅ |
| Buat/edit kursus & pelajaran | ❌ | ❌ | hanya miliknya | semua |
| Arsipkan kursus | ❌ | ❌ | hanya miliknya* | semua |
| Lihat daftar siswa + progres per kursus | ❌ | ❌ | hanya kursusnya | semua |
| Ubah harga kursus | ❌ | ❌ | ❌ (usul ke admin) | ✅ |
| Kelola user/peran, pembayaran, isi website, log | ❌ | ❌ | ❌ | ✅ |

\* Arsip kursus oleh pengajar hanya jika tidak ada order PAID aktif; selain itu admin.
Keputusan: harga hanya admin supaya satu pintu (bisa dibuka untuk pengajar nanti lewat flag, di luar rilis ini).

---

## 4. Ruang lingkup dan keterlacakan

### 4.1 Pemetaan penawaran ↔ audit ↔ task

Penomoran "No." mengikuti halaman penawaran (1–26). Semua 37 ID audit tercakup (cek matriks lengkap di [Lampiran A](#lampiran-a-matriks-keterlacakan-37-temuan)).

| No. | Judul di penawaran | ID audit | Task | Hari |
|---:|---|---|---|:--:|
| 1 | Server bisa dibobol tanpa login | K1 | T1.1 | 1 |
| 2 | Kunci rahasia ikut tersimpan di hasil build | K2 | T1.2 | 1 |
| 3 | Pengaman dasar browser belum dipasang | K3 | T1.3 | 1 |
| 4 | Kursus bisa kehapus sekali klik | P1 | T1.4 | 1 |
| 5 | Pesan error tidak sampai ke pengguna | B1 | T1.5–T1.6 | 1 |
| 6 | Enam tombol beranda tidak jalan untuk tamu | U1, U9 | T2.1–T2.3 | 2 |
| 7 | Calon user tak bisa lihat isi kursus | U2, B5 | T2.4–T2.5 | 2 |
| 8 | Belum ada privasi/syarat/refund/kontak | L1 | T2.6 | 2 |
| 9 | Beranda belum menunjukkan apa yang diajarkan | U3, U4 | T2.7 | 2 |
| 10 | Status pembayaran tidak sesuai kenyataan | P2, P3 | T3.1–T3.3 | 3 |
| 11 | Jalur notifikasi Mayar belum dikunci | K4 | T3.4 | 3 |
| 12 | Sebagian teks susah dibaca | A1, A2 | T1.7 (token), T2.8 | 1–2 |
| 13 | Dashboard belum membantu lanjut belajar | U5, B2, B4 | T3.5–T3.6 | 3 |
| 14 | Materi pelajaran kehilangan format | B6 | T3.7 | 3 |
| 15 | Alat pengajar minim | U6, B3, P4 | T4.3 | 4 |
| 16 | Perubahan peran tidak tercatat | K7 | T4.2 | 4 |
| 17–21 | Desain ulang (beranda, katalog+daftar, dashboard, pelajaran, tipografi/warna) | U3, U4, U9, A1–A3, F3 | T2.7, T2.8, T3.5, T3.8, T1.7 | 1–3 |
| 22–26 | Admin panel (kursus, user, pembayaran, isi halaman, ringkasan) | — (fitur baru) | T4.1–T4.7 | 4 |
| — | Perapian belakang layar | F1, F2, K5, K6, K8, Q1, Q2, U7, U8, P5, B5, A3 | T1.8–T1.10, T3.9, T4.8 | 1–4 |

### 4.2 Prioritas dan cut-line

Ruang lingkup besar untuk 1–4 hari. Supaya risiko jadwal terkendali, setiap task diberi prioritas:

- **P0** — wajib; tanpa ini rilis tidak boleh jalan (keamanan, alur bayar, katalog publik, legal, error).
- **P1** — masuk penawaran; dikerjakan penuh bila waktu cukup.
- **P2** — poles; bisa digeser ke hari-hari setelah rilis tanpa mengubah biaya jika klien setuju tertulis.

Jika jadwal mepet, urutan korban: P2 → bagian P1 di admin (editor halaman legal berversi, grafik) → tidak pernah menyentuh P0.

---

## 5. Prasyarat, asumsi, dan blocker

> **Checkpoint 0 (CP0)** harus hijau sebelum jam kerja hari 1 dimulai. "1 hari paling cepat" hanya berlaku bila semua ini sudah siap dari awal.

### 5.1 Akses yang dibutuhkan dari klien

- [ ] **Repo source** (`.tsx`, `schema.prisma`, `next.config`, `auth.ts`, route handler). Audit dibuat tanpa source; hanya `.next/` yang terlihat. **Tanpa source, pekerjaan tidak bisa dimulai.** Folder `.next/` jangan dibagikan lagi (K2).
- [ ] Akses hosting (Hostinger Node.js app; jalur build di server terlihat di `/home/.../domains/belajarditimurtengah.com/hbuilds/...`), termasuk env vars, cron, dan log.
- [ ] Akses database (hanya yang dibutuhkan) + **backup penuh** sebelum migrasi pertama.
- [ ] Google Cloud OAuth (Client ID/secret, authorized redirect URI), dan dashboard **Mayar** (API key, webhook token/URL, mode sandbox bila ada).
- [ ] Domain staging (mis. `staging.belajarditimurtengah.com`) atau preview terpisah dengan database terpisah. Semua perubahan "diajukan dulu buat dicek".

### 5.2 Asumsi

- Skema database saat ini **tidak terlihat**. Perubahan skema di §6.4 adalah **usulan** dan wajib dicocokkan dengan `schema.prisma` asli di T0.2 sebelum migrasi. Semua migrasi bersifat *additive* (tambah kolom/tabel; tidak menghapus data).
- Penghapusan "Hapus kursus" menjadi arsip memerlukan kolom baru; data kursus lama otomatis `PUBLISHED`/`archivedAt = null`.
- Semua nama pengajar, harga, kitab, nomor WA di prototipe adalah **placeholder `[...]`**. Konten asli dari klien (§17) dan menjadi blocker rilis, bukan blocker pengerjaan.
- Satu proses Node di hosting (Passenger/`tmp/restart.txt`). Rate limit dan cache in-memory dapat dipakai, dengan catatan §13.1.
- Database yang dipakai Prisma tetap sama (jenis dikonfirmasi di T0.2).

### 5.3 Task CP0 (sebelum hari 1)

| Task | Isi | Selesai jika |
|---|---|---|
| T0.1 | Klon repo, `yarn install`, jalankan lokal | `yarn dev` jalan, beranda tampil |
| T0.2 | Baca `schema.prisma` + `.env.example`; cocokkan §6.4; catat jenis DB | Dokumen selisih skema ada di `docs/schema-notes.md` |
| T0.3 | Perbaiki Prisma lokal: tambahkan `binaryTargets = ["native", "debian-openssl-1.1.x"]` (server) di `schema.prisma`, lalu `prisma generate`. Saat ini lokal gagal dengan *"could not locate the Query Engine for runtime windows"* — katalog kosong karena itu | Beranda lokal membaca kursus dari DB dev; cek versi OpenSSL di server dulu agar target tepat |
| T0.4 | Siapkan DB staging + seed (3 kursus contoh, 1 admin, 1 pengajar, 1 siswa) | Login Google lokal/staging jalan dengan akun uji |
| T0.5 | Backup DB production; simpan di luar repo | Berkas backup + tanggal tercatat |
| T0.6 | Cabang kerja: `main` terlindungi; kerja di `feat/*`; PR → staging → production | Alur terdokumentasi di README |

---

## 6. Arsitektur dan keputusan teknis

### 6.1 Keputusan

| Topik | Keputusan | Alasan |
|---|---|---|
| Framework | Tetap Next.js **15.x versi patch terbaru yang sudah menutup advisori React2Shell (CVE-2025-55182 / CVE-2025-66478)** + React 19 terbaru. Cocokkan nomor patch dengan advisori resmi sebelum upgrade (jangan percaya angka dari dokumen ini) | K1 |
| Validasi | `zod` di setiap Server Action & route handler | K6, B1 |
| Respons action | `{ ok: true, data } \| { ok: false, error: { field?, message } }`; **tidak ada `throw` untuk kesalahan yang diharapkan** | B1 |
| Form | `useActionState` + `useFormStatus` (tombol disabled saat kirim) | B1, P2 |
| Auth | NextAuth v5 + Google. Sesi menyimpan `id` dan `role` lewat callback `session` (hapus query user berulang) | F2 |
| Guard | `lib/auth-guard.ts`: `requireUser()`, `requireRole()`, `requireCourseOwner()`; dibungkus `React.cache()` | Q1, F2 |
| Markdown | `react-markdown` + `rehype-sanitize` | B6 |
| Font | `next/font` (Google untuk Newsreader/Hanken Grotesk/Amiri, `next/font/local` untuk Satoshi) | F3 |
| Cache | Beranda & katalog: ISR `revalidate = 300` + `revalidateTag` saat admin menyimpan | F1 |
| Ikon | `lucide-react` (sudah terpasang) — ganti SVG inline prototipe | konsistensi |
| Waktu | Simpan UTC; tampil `Asia/Jakarta` ("WIB") | — |
| Uang | Integer rupiah. Batas 0–50.000.000 per kursus | K6 |

### 6.2 Variabel lingkungan (semua di server, tidak di `NEXT_PUBLIC_*` kecuali disebut)

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi DB (**ganti password**) |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | NextAuth (**rotasi**) |
| `MAYAR_API_KEY`, `MAYAR_WEBHOOK_TOKEN` | Mayar (**rotasi**; token webhook sesuai yang dikonfigurasi di dashboard Mayar) |
| `APP_URL` | Domain publik; dibaca **saat runtime** untuk `redirectUrl` Mayar dan sitemap (P5) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Kunci stabil Server Action (K2) |
| `CRON_SECRET` | Autentikasi endpoint cron kedaluwarsa order |
| `MONITOR_TOKEN` | Detail `/api/health` hanya untuk pemantau |
| `VIDEO_HOST_ALLOWLIST` | Daftar host file video langsung (kosong = hanya YouTube) |

### 6.3 Peta rute

| Rute | Akses | Catatan |
|---|---|---|
| `/` | publik | Beranda (statis + ISR) |
| `/kursus` | publik | Katalog + pencarian + filter (query string) |
| `/kursus/[slug]` | publik | Detail kursus + daftar/checkout |
| `/kursus/[slug]/pratinjau` | publik | 1 pelajaran gratis (jika diset) |
| `/privasi`, `/syarat`, `/refund`, `/kontak` | publik | Konten dari admin (§11.5) |
| `/masuk` | publik | Halaman login Google; menerima `callbackUrl` (hanya path internal) |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | publik | U8 |
| `/dashboard` | siswa+ | Ringkasan "Lanjutkan belajar" |
| `/dashboard/kursus` | siswa+ | Kursus Saya |
| `/dashboard/kursus/[slug]/pelajaran/[lessonId]` | siswa+ | Halaman pelajaran (pratinjau bagi pengajar/admin) |
| `/dashboard/pembayaran` & `/dashboard/pembayaran/[orderId]` | siswa+ | Riwayat + status order |
| `/dashboard/profil` | siswa+ | Profil (tanpa ID internal) |
| `/dashboard/kelola/*` | pengajar, admin | Alat pengajar (§11.7) |
| `/admin/*` | admin | Admin panel (§11) |
| `/api/webhooks/mayar` | publik terautentikasi token | K4 |
| `/api/cron/expire-orders` | `CRON_SECRET` | P2 |
| `/api/health` | publik `{status:"ok"}`; detail dengan `MONITOR_TOKEN` | K8 |

Kompatibilitas: `/dashboard/kursus?orderId=…` → redirect 308 ke `/dashboard/pembayaran/[orderId]`. `/dashboard/admin` → redirect ke `/admin/pengguna`. URL kursus lama berbasis `id` → 308 ke `/kursus/[slug]`.

### 6.4 Perubahan model data (usulan; cocokkan di T0.2)

```prisma
// Tambah / ubah — semua additive.
model Course {
  // ... kolom yang sudah ada ...
  slug         String   @unique            // B5; diisi manual/auto dari judul Latin
  titleAr      String?                     // judul Arab untuk sampul (mis. "متن الآجرومية")
  field        Field                       // NAHWU | SHARAF | FIQIH | AQIDAH | HADITS | TAFSIR | LAINNYA
  level        Level                       // ULA | WUSTHA | ULYA
  status       CourseStatus @default(DRAFT) // DRAFT | PUBLISHED  (P4)
  archivedAt   DateTime?                   // P1 — pengganti hapus
  priceRupiah  Int      @default(0)        // 0..50_000_000 (K6)
  teacherId    String                      // pengajar utama (FK ke TeacherProfile/User)
  sortOrder    Int      @default(0)
  @@index([status, archivedAt])
}

model Lesson {
  // ... kolom yang sudah ada ...
  position     Int                         // U6 urutan, unik per course
  status       LessonStatus @default(DRAFT)// DRAFT | PUBLISHED
  isFreePreview Boolean @default(false)    // maksimal 1 per course
  durationMin  Int?
  videoUrl     String?                     // tersanitasi (K5)
  matan        Json?                       // [{ ar: string, id: string }]  (B6)
  notesMd      String?                     // Markdown catatan pengajar (maks 50.000)
  @@unique([courseId, position])
}

model LessonProgress {
  userId String; lessonId String
  completedAt DateTime?
  lastOpenedAt DateTime @default(now())
  @@id([userId, lessonId])
}

model Order {
  // ... kolom yang sudah ada ...
  status     OrderStatus   // PENDING | PAID | FAILED | EXPIRED | CANCELLED
  expiresAt  DateTime      // P2: now + 24 jam
  whatsapp   String        // dinormalisasi 62xxxxxxxxxx
  // unique parsial (raw SQL migrasi): satu PENDING per (userId, courseId)
}

model TeacherProfile {
  id String @id; userId String @unique
  displayName String; bio String; alumni String?; sanad String?; photoUrl String?
}

model AuditLog {
  id String @id @default(cuid())
  actorId String; action String      // "ROLE_CHANGE","COURSE_ARCHIVE","ACCESS_GRANT",...
  targetType String; targetId String
  before Json?; after Json?; reason String?
  createdAt DateTime @default(now())
  @@index([targetType, targetId]); @@index([createdAt])
}

model SiteContent {              // §11.5: teks beranda, FAQ, kontak
  key String @id                 // "home.hero.title", "contact.whatsapp", "faq.items"
  value Json; updatedAt DateTime @updatedAt; updatedBy String
}

model LegalDocument {            // privasi, syarat, refund
  slug String; version Int
  title String; bodyMd String
  publishedAt DateTime?; updatedBy String
  @@id([slug, version])
}
```

Aturan migrasi: (1) backup; (2) `prisma migrate deploy` di staging, uji dengan salinan data production; (3) backfill: `slug` dari judul (fallback `kursus-{id-pendek}`), `status = PUBLISHED` untuk kursus yang kini tayang, `position` dari urutan `createdAt`, `priceRupiah` dari kolom harga yang ada; (4) baru jalankan di production dalam jendela rendah trafik.

---

## 7. Sistem desain (UI/UX)

### 7.1 Konsep

**"Majelis ilmu yang modern."** Tenang, lapang, serius tapi hangat — seperti naskah kitab yang ditata rapi, bukan situs kursus yang ramai. Tiga prinsip:

1. **Matan adalah bintangnya.** Teks Arab kitab selalu paling besar, paling kontras, RTL penuh. Elemen lain mengalah.
2. **Bukti, bukan klaim.** Setiap janji ("silabus mu'tamad") diganti hal konkret: nama kitab, nama pengajar, contoh pelajaran, harga jelas.
3. **Satu langkah berikutnya.** Setiap layar punya satu aksi utama yang jelas (Lihat kursus → Daftar → Bayar → Lanjutkan belajar).

Motif visual: **bintang delapan sudut** (dua persegi bersilangan, sudah ada di logo prototipe) sebagai watermark halus di sampul kursus dan latar band gelap, opacity ≤ 12%, tidak pernah di belakang teks panjang.

### 7.2 Dua "zona" tampilan, satu sistem token

| Zona | Halaman | Font | Karakter |
|---|---|---|---|
| **Publik** | Beranda, katalog, detail kursus, legal | Judul **Newsreader** (serif, 600) · isi **Hanken Grotesk** | Editorial, lega, kontras tinggi, latar `--ground` |
| **Aplikasi** | Dashboard, pelajaran, admin | **Satoshi** (self-host, 400/500/700) | Padat-rapi, kartu putih di atas `--shell`, sidebar |
| **Arab** (semua zona) | Matan, sampul kursus, peta jenjang | **Amiri** 400/700, `lang="ar" dir="rtl"` | Line-height ≥ 1,8; ukuran isi 26–30 px, sampul 26–32 px |

Alasan dua zona: prototipe publik (`desain-html/index.html`) dan aplikasi (`desain-html/app.css`) sudah memakai pasangan font berbeda; dipertahankan karena publik butuh nuansa editorial dan aplikasi butuh keterbacaan UI. Token warna, radius, dan komponen dasar **dibagi** (satu file `styles/tokens.css`).

### 7.3 Token

```css
:root {
  /* warna dasar */
  --brand:        #1B4D3B;  --brand-dark: #143B2D;  --brand-soft: #E3EAE7;
  --ink:          #10231C;  /* teks utama */
  --ink-2:        #4F5C55;  /* teks sekunder (≥ 6:1 di atas --shell) */
  --muted-text:   #5B6660;  /* teks pendukung kecil (≥ 5,5:1) */
  --muted-ui:     #8A948F;  /* HANYA ikon/garis/placeholder non-esensial, JANGAN untuk teks */
  --ground:       #F3F5F1;  --shell: #F7F8F6;  --surface: #FFFFFF;
  --line:         #D6DDD7;  --line-2: #E3E8E4;
  --gold-text:    #8A5C0A;  /* teks emas, ~5,4:1 di atas putih */
  --gold:         #C8A24A;  /* dekorasi/latar saja */
  --cream:        #F2E6C4;  /* teks Arab di atas sampul gelap */
  --danger:       #B3261E;  --danger-soft: #FBE9E7;
  --success:      #1D6B40;  --success-soft: #E2F0E6;
  --warning:      #8A5C0A;  --warning-soft: #F6EBD3;

  /* warna per bidang ilmu (chip + sampul) */
  --nahwu:  #1B4D3B; --nahwu-soft:  #E3EEE8; --nahwu-cover:  #173F31;
  --fiqih:  #8A5C0A; --fiqih-soft:  #F6EBD3; --fiqih-cover:  #4A3410;
  --aqidah: #3D5A9E; --aqidah-soft: #E4EAF7; --aqidah-cover: #22345E;
  /* bidang baru memakai pola yang sama; wajib lolos uji kontras sebelum ditambah */

  /* bentuk */
  --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-pill: 999px;
  --sp: 4px;  /* skala: 4 8 12 16 24 32 48 64 96 */
  --focus: 2px solid var(--ink); --focus-offset: 2px; /* di latar gelap: cream */
}
```

> **Catatan perbaikan kontras (A1):** di prototipe `app.css`, `--ink-2:#6B7570` (≈ 4,4:1 di atas `--shell`) dan `--muted:#8A948F` (≈ 3:1) **gagal AA untuk teks**. Token di atas sudah menggantinya. Semua pasangan warna teks/latar wajib divalidasi dengan alat kontras di T1.7 dan dicatat di `docs/contrast.md`.

### 7.4 Tipografi

| Peran | Zona publik | Zona aplikasi |
|---|---|---|
| Display (H1 hero) | Newsreader 600, `clamp(40px, 5.2vw, 64px)`, lh 1.05, ls −0.02em | Satoshi 500, `clamp(24px, 2.4vw, 30px)`, ls −0.03em |
| H2 | Newsreader 600, 32–36 px | Satoshi 500, 19–28 px |
| H3 / judul kartu | Newsreader 600, 20 px | Satoshi 500, 15–18 px |
| Isi | Hanken Grotesk 400, 16–17 px, lh 1.6, maks 64–68ch | Satoshi 400, 15–16 px |
| Label/eyebrow | 12–13 px, 700, uppercase, ls .08–.12em, `--gold-text` | 11–12 px, 600, uppercase, `--muted-text` |
| Angka (harga, progres) | `font-variant-numeric: tabular-nums` | sama |
| Arab | Amiri 700 judul/sampul; 400 matan | sama |

Aturan: minimal 16 px untuk isi di HP; tidak ada teks isi < 14 px; `text-wrap: balance` untuk judul.

### 7.5 Tata letak dan breakpoint

Tiga breakpoint (Q2): **640 / 960 / 1200 px**, mobile-first. Layout laptop dan HP **dirancang terpisah**, bukan sekadar menyusut.

| Lebar | Publik | Aplikasi |
|---|---|---|
| < 640 | 1 kolom; header: logo + tombol **Masuk** (selalu terlihat) + menu `<details>`; CTA lengket di bawah (detail kursus) | Sidebar → **bottom tab bar 4 item** (Belajar, Kursus, Bayar, Profil) + topbar ringkas; panel kanan jatuh ke bawah konten |
| 640–959 | 1–2 kolom; nav inline tersembunyi | Sidebar ikon-saja (72 px) atau drawer |
| 960–1199 | nav inline, grid kartu 2–3 kolom | Sidebar penuh 230 px; panel kanan 280–360 px |
| ≥ 1200 | kontainer maks 1180 px | Shell maks 1360 px, radius 28 px |

Safe-area iOS (`env(safe-area-inset-*)`) dipakai di bar bawah. Tidak ada scroll horizontal di semua lebar ≥ 320 px.

### 7.6 Komponen inti

| Komponen | Spesifikasi |
|---|---|
| **Tombol** | Tinggi ≥ 44 px (aksi utama 48). Varian: *primary* (brand), *ghost* (outline), *dark pill* (ikon bulat putih di kanan), *danger*. Status: default/hover/focus-visible/active/disabled/loading (spinner + teks tetap; tidak bergeser). |
| **Chip filter** | 40 px, pill, `aria-pressed`; aktif = `--ink` di atas teks putih. |
| **Kartu kursus** | Sampul 128 px (warna `--*-cover`, judul Arab `--cream` kanan-bawah, watermark bintang), chip bidang + jenjang, judul (maks 2 baris), "N pelajaran · ± X jam", baris pengajar + harga. Seluruh kartu = satu target klik (link ke detail). |
| **Field form** | Label tampak (bukan placeholder), border 2 px, error: border `--danger` + pesan di bawah dengan ikon, `aria-invalid` + `aria-describedby`. Pesan error menyebut cara memperbaiki. |
| **Badge status order** | Menunggu (kuning), Lunas (hijau), Kedaluwarsa (abu), Gagal (merah). Selalu ikon + teks, tidak hanya warna. |
| **Progress** | Garis 4 px (daftar) dan cincin konik 96 px (panel pelajaran), disertai angka "5 dari 24 selesai". |
| **Blok matan** | Latar `--shell`, radius 14, Arab 28 px lh 1.9 rata kanan; terjemah 14–15 px di bawah. |
| **Toast / banner** | `role="status"` (informasi) / `role="alert"` (error). Tidak menutup tombol aksi. |
| **Dialog konfirmasi** | Fokus terkunci, `Esc` menutup, fokus kembali ke pemicu. Aksi destruktif: ketik judul kursus untuk mengaktifkan tombol. |
| **Tabel (admin)** | Header sticky, baris 48–56 px, aksi di kolom kanan, di HP berubah jadi kartu bertumpuk. |
| **Skeleton** | Untuk daftar & kartu saat memuat; tanpa animasi bila `prefers-reduced-motion`. |

### 7.7 Gerak dan interaksi

- Durasi 150–200 ms, easing `ease-out`; hanya `opacity`/`transform`. Tidak ada animasi dekoratif yang berjalan terus.
- `prefers-reduced-motion`: matikan semua transisi non-esensial (`* { transition: none !important }` sudah ada di prototipe).
- Scroll halus hanya untuk anchor di halaman yang sama; dimatikan bila reduced-motion.

### 7.8 Aksesibilitas (ringkas; detail uji di §13.3)

- Kontras teks ≥ 4,5:1; teks besar & komponen UI ≥ 3:1.
- Fokus terlihat di **semua** elemen interaktif (A2); target sentuh ≥ 44×44 px (A3).
- Landmark: `header`, `nav`, `main`, `footer` bersaudara (bukan bersarang di `main`) — A3.
- `lang="id"` di `<html>`; blok Arab `lang="ar" dir="rtl"`; judul bertingkat tanpa lompat.
- "Skip to content" di awal halaman. Semua fitur bisa dipakai tanpa mouse; menu tanpa JS lewat `<details>`.
- Informasi tidak hanya lewat warna (status order, bidang ilmu pakai teks).

### 7.9 Gaya penulisan (UX writing)

- Bahasa Indonesia santai dan natural, sapaan **"kamu"** di zona publik dan aplikasi (keputusan 27 Okt 2026, menggantikan "Anda"); hindari "Anda" dan "gue/lu" di antarmuka. Tetap sopan: tanpa slang berlebihan.
- Tombol berupa kata kerja spesifik: "Daftar gratis", "Bayar Rp… lewat Mayar", "Lanjutkan belajar", "Arsipkan kursus". Hindari "Submit", "OK".
- Error: *apa yang salah + cara memperbaiki*. Contoh: "Nomor terlalu pendek. Masukkan 10 sampai 13 digit, misalnya 0812 3456 7890."
- Hindari klaim kosong ("mu'tamad", "Database Terproteksi"). Tulis yang bisa dibuktikan: nama kitab, pengajar, jumlah pelajaran.
- Istilah Arab dengan transliterasi konsisten (rafa', nashab, khafadh, jazm) dan satu daftar istilah di `docs/glosarium.md`.

---

## 8. Spesifikasi halaman publik

### 8.1 Header dan footer global

```text
HEADER (72px)  [◇ Nizhamiyyah]  Katalog  Jenjang belajar  Pengajar  Tanya jawab      [G Masuk]
                                                                          (selalu terlihat, semua lebar)
FOOTER (gelap) Nizhamiyyah Edu — deskripsi singkat · WhatsApp admin [dari SiteContent]
               Belajar: Katalog · Jenjang · Pengajar · Masuk
               Informasi: Kebijakan privasi · Syarat dan ketentuan · Kebijakan refund · Kontak
               © 2026 Nizhamiyyah Edu · belajarditimurtengah.com
```

- Tombol **Masuk** (ghost, logo Google) ada di header di semua ukuran layar (U3). Setelah login berubah jadi avatar + menu (Dashboard, Keluar).
- Menu < 720 px: `<details>` (jalan tanpa JS). Tautan footer punya padding vertikal sehingga tinggi target ≥ 44 px (A3).
- Tautan legal juga muncul di dialog checkout (§8.4).

### 8.2 Beranda `/` (U1, U3, U4, F1)

Urutan section (mengikuti prototipe `desain-html/index.html`):

```text
1. HERO            eyebrow  | "Kelas kitab daring · kurikulum pesantren Timur Tengah"
                   H1       | "Belajar kitab, satu marhalah demi satu marhalah."
                   sub      | 1–2 kalimat
                   CTA      | [Lihat katalog kursus]  [Cari jenjang yang cocok]
                   catatan  | "Katalog dan silabus bisa dilihat tanpa login. …"
                   kanan    | KARTU "Peta marhalah": tabel Jenjang × Bidang berisi nama kitab Arab + Latin
                              (tiap sel = tautan ke /kursus/[slug])
2. 3 LANGKAH       Pilih kursus → Masuk & bayar → Belajar sesuai ritme
3. KATALOG         chip filter (Semua/Nahwu/Fiqih/Aqidah/Gratis) + grid kartu kursus (maks 6) + "Lihat semua"
4. BAND GELAP      "Seperti apa belajarnya" + contoh matan Arab + terjemah + [Coba pelajaran pratinjau]
5. PENGAJAR        kartu profil (foto/inisial, nama, alumni, sanad ringkas)
6. FAQ             <details> aksesibel, 4–6 pertanyaan (dari SiteContent)
7. FOOTER
```

**Logika**
- Server component; `revalidate = 300` dan `revalidateTag('home')` saat admin menyimpan. Bagian bergantung login (tombol header) adalah komponen klien kecil (F1).
- Kursus yang tampil: `status = PUBLISHED AND archivedAt IS NULL`, urut `sortOrder`.
- Sel "Peta marhalah" dibangun dari data kursus (`field` × `level`); sel kosong tampil "Segera" (tidak bisa diklik). Bila admin belum mengisi, tampilkan versi contoh **hanya di staging**; production menyembunyikan kartu bila kosong.
- Semua teks hero/FAQ/kontak dari `SiteContent` dengan fallback default di kode (situs tak pernah kosong).
- **Keadaan kosong**: bila belum ada kursus tayang → section katalog menampilkan kartu "Kursus sedang disiapkan" + tombol "Masuk ke dashboard" (bukan layar kosong).

**Selesai jika (AC)**
- Tamu klik tombol mana pun di beranda → sampai ke katalog/detail/halaman login yang relevan; **tidak ada** pengalihan diam-diam ke `/` (diuji otomatis untuk 6 tombol lama).
- Tinggi halaman di HP ≤ ~4.000 px (sebelumnya 6.568 px); tidak ada klaim tanpa bukti.
- Lighthouse mobile: Performance ≥ 90, A11y ≥ 95, SEO ≥ 95.

### 8.3 Katalog `/kursus` (U1, U9)

```text
H1 "Katalog kursus"            "{N} kursus · terbuka untuk semua pengunjung"
[ 🔍 Cari kursus atau kitab… ]  Chip: Semua | Nahwu | Fiqih | Aqidah | … | Gratis
Dropdown: Jenjang (Semua/Ula/Wustha/Ulya) · Urut (Terbaru / Harga ↑ / Harga ↓)
GRID kartu kursus (auto-fill min 280px)
```

**Logika**
- Filter dan pencarian memakai **query string** (`?q=ajurrumiyyah&bidang=nahwu&jenjang=ula&gratis=1&urut=terbaru`) agar bisa dibagikan; server-render, tanpa JS pun bekerja (form GET). Peningkatan JS: pembaruan tanpa muat ulang halaman, fokus tetap di chip yang dipilih.
- Pencarian: `contains` (case-insensitive) pada judul Latin, judul Arab (normalisasi: hapus harakat/tatwil), nama pengajar. Minimal 2 karakter.
- Paginasi 12 per halaman ("Muat lebih banyak" sebagai tautan `?hal=2`).
- Kosong: "Tidak ada kursus yang cocok. [Hapus filter]".
- Pengguna yang sudah login melihat lencana status pada kartu (Diikuti / Menunggu bayar), tanpa mengubah URL.

### 8.4 Detail kursus `/kursus/[slug]` (U2, B5, L1, P2)

```text
Breadcrumb: Katalog › Nahwu › Matan al-Ajurrumiyyah
┌──────────────────────────────────────────────┬───────────────────────┐
│ SAMPUL gelap + judul Arab besar              │  KARTU DAFTAR (sticky)│
│ chip Nahwu · Ula                             │  Rp [harga] / Gratis  │
│ H1 Matan al-Ajurrumiyyah                     │  ✓ Akses selamanya    │
│ 24 pelajaran · ± 9 jam · [pengajar]          │  ✓ 24 pelajaran       │
│ Nav anchor: Tentang | Silabus | Pengajar | FAQ│  [ Daftar / Bayar ]   │
│ TENTANG (deskripsi, kitab rujukan, prasyarat) │  QRIS · VA · e-wallet │
│ SILABUS (daftar pelajaran + durasi)          │  Syarat · Refund      │
│   ▶ 1. Muqaddimah … 12 mnt  [Pratinjau gratis]│                      │
│   🔒 2. Pengertian kalam … 15 mnt             │                       │
│ PENGAJAR (foto, nama, alumni, sanad)         │                       │
│ FAQ KURSUS                                    │                       │
└──────────────────────────────────────────────┴───────────────────────┘
Mobile: kartu daftar jadi BAR LENGKET di bawah:  Rp [harga]   [ Daftar ]
```

**Logika**
- Hanya kursus `PUBLISHED` dan belum diarsip; selain itu 404. Pratinjau admin/pengajar-pemilik untuk DRAFT lewat `?pratinjau=1` + cek peran.
- Silabus menampilkan **hanya pelajaran `PUBLISHED`**; isi (video/matan) terkunci kecuali pelajaran `isFreePreview` (maksimal satu per kursus).
- `generateMetadata`, kanonik `/kursus/[slug]`, JSON-LD `Course`, OG image dinamis (U8).
- **Mesin status tombol** (kartu daftar), dihitung server-side:

| Kondisi pengguna | Tombol & teks |
|---|---|
| Tamu, kursus gratis | **Daftar gratis** → login (`callbackUrl=/kursus/{slug}?lanjut=1`) |
| Tamu, kursus berbayar | **Daftar & bayar** → login (sama) |
| Login, belum terdaftar, gratis | **Daftar gratis** → enrolled → ke pelajaran 1 |
| Login, belum terdaftar, berbayar | **Bayar Rp… lewat Mayar** → panel WA + persetujuan (di bawah) |
| Login, ada order PENDING belum kedaluwarsa | **Lanjutkan bayar** (membuka invoice yang sama) + info batas waktu |
| Login, sudah terdaftar | **Lanjutkan belajar** → pelajaran terakhir |
| Pengajar-pemilik / admin | **Kelola kursus** + **Lihat sebagai siswa (pratinjau)** |

- **Kembali dari login**: `?lanjut=1` membuka panel checkout otomatis dan memfokuskan field pertama. `callbackUrl` divalidasi: hanya path internal berawalan `/` (cegah open redirect).
- **Panel checkout (kursus berbayar)** — dialog (HP: bottom sheet):
  1. Ringkasan: sampul kecil, judul, "24 pelajaran · akses selamanya".
  2. Rincian: Harga kursus, Biaya layanan (Rp 0 atau sesuai Mayar), **Total** (tebal).
  3. Field **Nomor WhatsApp** (`type=tel`, `inputmode=tel`, autokomplet `tel`). Validasi di klien (hint) **dan server (otoritatif)**.
  4. Teks persetujuan: "Dengan membayar, Anda menyetujui **Syarat dan ketentuan** serta **Kebijakan refund**" (tautan membuka tab baru).
  5. Tombol "Bayar Rp… lewat Mayar" (loading saat kirim; disabled cegah klik ganda).
  6. Gagal: pesan error di bawah field/di atas tombol (`role="alert"`); fokus pindah ke pesan.
- Berhasil → arahkan ke URL invoice Mayar. Pengguna kembali ke `/dashboard/pembayaran/{orderId}` (§9.3).

**AC**
- Tamu dapat membaca silabus lengkap, harga, pengajar tanpa login.
- Salah ketik WA → pesan "Nomor terlalu pendek…" di bawah field; **tidak ada** layar error generik.
- Setelah login dari tombol Daftar, pengguna kembali ke kursus yang sama dengan panel checkout terbuka.

### 8.5 Pelajaran pratinjau `/kursus/[slug]/pratinjau`

Memakai komponen halaman pelajaran (§9.4) mode "tamu": tanpa sidebar progres, dengan banner "Ini pelajaran pratinjau. [Daftar untuk membuka semua pelajaran]" dan tombol daftar lengket. Bila kursus tidak punya pratinjau → 404 + tautan kembali.

### 8.6 Halaman legal `/privasi` `/syarat` `/refund` `/kontak` (L1)

- Layout dokumen: kolom 68ch, daftar isi di kiri (≥ 960), "Terakhir diperbarui: {tanggal} · Versi {n}".
- Isi dari `LegalDocument` (Markdown tersanitasi, §11.5). Draf awal ditulis Dar Dev dan **wajib ditinjau klien** (disarankan juga penasihat hukum); tidak dipublikasikan tanpa persetujuan tertulis.
- Konten minimum: **Privasi** (data yang dikumpulkan — email, foto profil Google, nama, nomor WA; tujuan; pihak ketiga — Google, Mayar; retensi; hak subjek data & cara menggunakannya; kontak pengendali data; sesuai UU PDP No. 27/2022). **Syarat** (akun, lisensi akses personal, larangan membagikan akun, hak cipta materi, batas tanggung jawab). **Refund** (kapan boleh/tidak, batas waktu, cara mengajukan, lama proses). **Kontak** (WhatsApp, email, jam layanan, alamat bila ada).
- Tautan ke keempatnya di footer **dan** di panel checkout.

### 8.7 404 dan error (U7)

`not-found.tsx` dan `error.tsx` bermerek, Bahasa Indonesia: judul "Halaman tidak ditemukan"/"Ada yang tidak beres", satu kalimat penjelasan, tombol [Ke beranda] [Lihat katalog], dan tombol [Coba lagi] di halaman error (`reset()`). Error tidak menampilkan detail teknis; ID rujukan (digest) kecil untuk laporan.

---

## 9. Spesifikasi area siswa

### 9.1 Shell aplikasi

```text
Desktop ≥ 960                                 Mobile < 640
┌ Sidebar ─┬ Topbar: [🔍 cari]  🔔  Avatar Nama ┐   ┌ Topbar ringkas ┐
│ ◇ Brand  │                                     │   │ konten          │
│ Menu     │  Konten (kolom tengah)  | Panel kanan│   │ …               │
│ Dashboard│                                     │   └ Tab bawah: Belajar·Kursus·Bayar·Profil ┘
│ Kursus   │                                     │
│ Katalog  │                                     │   Sidebar → tab bar; panel kanan → di bawah konten
│ Pembayaran│                                    │
│ Profil   │                                     │
│ ─ Akun ─ │                                     │
│ Keluar   │                                     │
└──────────┴─────────────────────────────────────┘
```

Menu **hanya berisi yang berfungsi**. Menu "Segera Hadir" (Progres, Sertifikat, Pengaturan) dihapus sampai fiturnya ada (U5). Sidebar juga menampilkan "Kursus aktif" (hingga 3, link langsung ke pelajaran terakhir).

### 9.2 Dashboard `/dashboard` (U5, B2, B4)

```text
H1 "Assalamu'alaikum, {nama depan}"
┌ LANJUTKAN BELAJAR ──────────────────────────────┐
│ [sampul] Matan al-Ajurrumiyyah · Pelajaran 6/24 │  ← kartu terbesar, 1 aksi utama
│ "Bab al-I'rab: pengertian dan pembagiannya"      │
│ ▓▓▓▓░░░░ 21%          [ Lanjutkan  ▸ ]           │
├ Kursus lain (hingga 3, kartu kecil) ────────────┤
├ Pelajaran berikutnya (tabel: pengajar, bidang, judul, ▸) ┤
└──────────────────────────────────────────────────┘
Panel kanan: Statistik (Kursus aktif {count}, Pelajaran selesai, Jam belajar) · Pengajar Anda
```

**Logika**
- **Kursus Aktif** = `COUNT(enrollment ACTIVE)` terpisah dari daftar 3 kursus terbaru (B2 — bukan `.length` daftar).
- **Lanjutkan belajar** = enrollment dengan `lastOpenedAt` terbaru → pelajaran yang terakhir dibuka bila belum selesai, jika sudah selesai → pelajaran PUBLISHED pertama yang belum selesai, jika semua selesai → "Kursus selesai 🎉" + saran kursus berikutnya (dari jenjang berikutnya).
- Siswa tanpa kursus: kartu "Mulai dari katalog" + 3 kursus rekomendasi (gratis/Ula dulu), bukan dashboard kosong.
- Siswa dengan order PENDING: banner status di atas (§9.3).
- Statistik dihitung dari `LessonProgress`; ditampilkan "Contoh data" hanya di staging.
- Tidak ada kartu `display:none`; tidak ada ID internal (cuid) di mana pun di UI (B4/U5).

### 9.3 Pembayaran `/dashboard/pembayaran` dan `/…/[orderId]` (P2, P3)

**Status nyata** (kontrol sesuai pemilik order; order milik orang lain → 404):

| Status | Tampilan | Aksi |
|---|---|---|
| `PENDING` & belum kedaluwarsa | Banner kuning "Menunggu pembayaran. Berlaku sampai {tgl}, {jam} WIB." Auto-refresh status tiap 5 dtk (maks 3 menit, lalu tombol manual "Cek status") | [Lanjutkan bayar] (membuka invoice yang sama) |
| `PAID` | Banner hijau "Pembayaran diterima. Kelas sudah terbuka." | [Mulai belajar] |
| `EXPIRED` | Abu-abu "Tagihan kedaluwarsa." | [Bayar ulang] (membuat order baru) |
| `FAILED`/`CANCELLED` | Merah "Pembayaran gagal/dibatalkan." | [Coba lagi] |

Riwayat: tabel (tanggal, kursus, nominal, status, aksi). Banner tidak pernah mengutip `orderId` mentah dari query.

### 9.4 Halaman pelajaran `/dashboard/kursus/[slug]/pelajaran/[lessonId]` (B3, B6, K5, U5)

```text
Topbar: ‹ Kembali · Kursus saya · Nahwu / Matan al-Ajurrumiyyah
┌ KOLOM TENGAH ───────────────────────────────────┬ PANEL KANAN ──────────────┐
│ VIDEO 16:9 (YouTube nocookie / <video>)         │ Progres kursus            │
│ chip Nahwu · "Pelajaran 6 dari 24 · 18 menit"   │  ◯ 21%  5 dari 24 selesai  │
│ H1 "Bab al-I'rab: pengertian dan empat pembagiannya"│ Sisa ± 7 jam           │
│ pengajar                                         │ SILABUS (daftar pelajaran)│
│ ── MATAN ──                                      │  ✓ 1 Muqaddimah           │
│  [blok Arab RTL besar] + terjemah                │  ✓ 2 …                    │
│  [blok Arab RTL besar] + terjemah                │  ● 6 Bab al-I'rab ← kini  │
│ ── CATATAN PENGAJAR (Markdown) ──                │  ○ 7 …                    │
│ [ ✓ Tandai selesai ]   [ Pelajaran berikutnya ▸ ]│ [Lihat seluruh silabus]   │
└──────────────────────────────────────────────────┴───────────────────────────┘
Mobile: urutan Video → Judul → Matan → Catatan → Aksi; silabus & progres dalam <details> di bawah, dan bar aksi lengket.
```

**Logika**
- Akses: enrollment `ACTIVE` pada kursus tsb **atau** pengajar-pemilik/admin (mode pratinjau). Selain itu → redirect ke detail kursus dengan pesan.
- **Mode pratinjau** (pengajar/admin tanpa enrollment): tidak ada kartu progres/tombol "Tandai selesai"; label "Mode pratinjau pengajar" (B3). Tombol "Tandai selesai" tidak pernah menghasilkan error.
- **Video**: hanya (a) YouTube — host persis `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`; ekstrak ID 11 karakter `[A-Za-z0-9_-]`; render `https://www.youtube-nocookie.com/embed/{id}` dengan `sandbox="allow-scripts allow-same-origin allow-presentation"`, `referrerpolicy="strict-origin-when-cross-origin"`, `allow` seperlunya; atau (b) file langsung `https:` berakhiran `.mp4/.webm` dari host di `VIDEO_HOST_ALLOWLIST` → `<video controls preload="metadata">`. Selain itu ditolak **saat disimpan** (admin) dan **saat render** (pertahanan berlapis).
- **Matan**: array `{ar, id}` dirender per kalimat; `lang="ar" dir="rtl"`, Amiri 28 px, lh 1.9. Bila `matan` kosong, section disembunyikan.
- **Catatan**: Markdown tersanitasi (paragraf/enter tunggal, tebal, miring, daftar, kutipan, tautan `https`). HTML mentah dibuang.
- **Tandai selesai**: toggle idempoten (upsert `LessonProgress.completedAt`); UI optimistis; progres & silabus ter-update; "Pelajaran berikutnya" → pelajaran PUBLISHED selanjutnya (`position` berikutnya), di pelajaran terakhir menjadi "Selesaikan kursus".
- Setiap buka pelajaran memperbarui `lastOpenedAt` (dipakai "Lanjutkan belajar").
- Kueri independen dijalankan `Promise.all` (F2): kursus+pelajaran, daftar silabus, progres, pengajar.

### 9.5 Kursus Saya `/dashboard/kursus`

Grid kartu kursus yang diikuti (sampul, progres, tombol "Lanjutkan"); tab "Diikuti" dan "Menunggu pembayaran". Kosong → ajakan ke katalog.

### 9.6 Profil `/dashboard/profil` (B4)

Nama, email (hanya baca, dari Google), metode login "Google", nomor WA terakhir (dapat diubah), tanggal bergabung. Tanpa ID internal. Nilai kosong tampil "Belum diisi" (bukan karakter rusak — simpan semua file sumber **UTF-8**).

---

## 10. Logika inti

### 10.1 Mesin status Order

```text
                 klik "Bayar"
 (tak ada) ───────────────────────► PENDING ──(webhook lunas terverifikasi)──► PAID ──► Enrollment ACTIVE
                                       │
                                       ├─(expiresAt lewat; cron/lazy)──────────► EXPIRED
                                       ├─(Mayar melapor gagal/batal)───────────► FAILED / CANCELLED
                                       └─(klik "Bayar" lagi, belum kedaluwarsa)► tetap PENDING yang sama (pakai ulang invoice)
```

**Aturan**
1. **Satu PENDING per (user, kursus)** — dijamin indeks unik parsial + transaksi. Klik ganda → request kedua mengembalikan order yang sama (idempoten), bukan error dan bukan order baru.
2. Membuat order: validasi zod → ambil kursus (harus PUBLISHED, tidak diarsip, harga > 0) → jika user sudah terdaftar → tolak "Anda sudah terdaftar" → cari PENDING aktif (reuse) → jika tidak ada, buat order (`expiresAt = now + 24 jam`) → buat invoice Mayar dengan `expiredAt` sama dan `redirectUrl = APP_URL + /dashboard/pembayaran/{id}` → simpan `mayarInvoiceId`/link → kembalikan `{ok:true, redirectUrl}`.
3. `redirectUrl` dibaca dari `APP_URL` runtime (P5).
4. Kedaluwarsa: cron `GET /api/cron/expire-orders` (header `Authorization: Bearer $CRON_SECRET`) tiap 15 menit via cron hosting → `UPDATE ... SET status='EXPIRED' WHERE status='PENDING' AND expiresAt < now()`; **plus** kedaluwarsa malas saat order dibaca (status ditampilkan EXPIRED walau cron telat).
5. Kursus gratis: tidak membuat order; enrollment dibuat dalam satu `upsert` (idempoten).
6. Kursus berbayar tidak bisa di-"batal ikut" oleh siswa sendiri (perilaku audit yang sudah benar dipertahankan).
7. Perubahan harga **tidak** mengubah order yang sudah ada (nominal dikunci di order). Bila ada order PAID, perubahan harga dicatat di `AuditLog`.

### 10.2 Webhook Mayar `/api/webhooks/mayar` (K4)

Urutan pemeriksaan (gagal di tahap mana pun → catat log internal, **balas generik**):

1. Batasi laju per IP (mis. 60 req/menit; lebih → `429` tanpa detail).
2. Verifikasi token/secret pengirim sesuai mekanisme Mayar yang dikonfigurasi (`MAYAR_WEBHOOK_TOKEN`), perbandingan *constant-time*. Tidak cocok → `401`, tanpa panggilan keluar.
3. Parse + validasi skema payload (zod). Tidak valid → `400` generik.
4. **Pertahankan verifikasi lama yang sudah benar**: ambil ulang transaksi ke API Mayar (server-to-server), cocokkan nominal, mata uang, dan `extraData`; semua perubahan DB dalam **satu transaksi**; idempoten (webhook ganda tidak membuat enrollment ganda).
5. Balas `200 {received:true}` untuk semua kasus yang sah (termasuk "sudah diproses"). Detail ("Payment amount mismatch", "Order is cancelled") **hanya di log**, tidak ke respons.

### 10.3 Nomor WhatsApp

- Terima: spasi, tanda hubung, `+`, `0`, `62`. Normalisasi ke `62` + 9–12 digit, lalu simpan.
- Regex setelah dibersihkan: `^(?:\+?62|0)8[1-9][0-9]{7,11}$` (panjang akhir 10–13 digit sesuai pesan UI).
- Pesan: kosong → "Nomor WhatsApp wajib diisi."; non-angka → "Gunakan angka saja."; panjang salah → "Nomor terlalu pendek/panjang. Masukkan 10 sampai 13 digit, misalnya 0812 3456 7890."; awalan salah → "Nomor harus diawali 08 atau +62."
- Kursus gratis: field WA tidak ditampilkan dan tidak diwajibkan.

### 10.4 Arsip vs hapus (P1)

- Tombol "Hapus kursus" **dihilangkan**; diganti **Arsipkan** (set `archivedAt`). Kursus terarsip: hilang dari katalog publik, tetap bisa dibuka siswa yang sudah terdaftar (akses tidak dicabut).
- **Hapus permanen** hanya tersedia untuk admin pada kursus terarsip yang **tidak punya order PAID & tidak punya enrollment berbayar**; server menolak otomatis selain itu (cek di server, bukan hanya UI).
- Dialog konfirmasi meminta mengetik judul kursus; tombol baru aktif jika cocok persis. Semua aksi tercatat di `AuditLog`.
- Pemulihan: tombol "Pulihkan" mengosongkan `archivedAt`.

### 10.5 Peran dan perubahan hak akses (K7)

- Ganti peran memerlukan dialog konfirmasi yang menyebut nama & peran lama→baru; perubahan ke/dari `ADMIN` memerlukan alasan singkat.
- **Server menolak** menurunkan admin terakhir ("Harus ada minimal satu admin") dan admin mengubah peran diri sendiri (perilaku yang sudah ada dipertahankan).
- Setiap perubahan → `AuditLog { actorId, action:"ROLE_CHANGE", targetId, before, after, reason }`.
- Peran baru berlaku di sesi berikutnya segera (callback `session` membaca `role` dari DB per permintaan, dengan cache `React.cache` per request).

### 10.6 Validasi input (K6)

| Field | Aturan |
|---|---|
| Judul kursus | 3–120 karakter |
| Slug | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 3–80, unik; judul Latin diubah otomatis, dapat diedit |
| Deskripsi | ≤ 1.000 karakter |
| Harga | integer 0–50.000.000 |
| Judul pelajaran | 3–120 |
| Catatan Markdown | ≤ 50.000 |
| Matan | ≤ 100 blok; tiap `ar` ≤ 2.000, `id` ≤ 2.000 |
| Video URL | aturan §9.4 |
| Pencarian | 2–80 karakter |
| Semua teks | trim, normalisasi Unicode NFC, tolak karakter kontrol |

### 10.7 Cache dan data (F1, F2)

- Tag: `home`, `catalog`, `course:{slug}`, `content:{key}`. Admin menyimpan → `revalidateTag` terkait.
- `getCurrentUser()` dibungkus `React.cache()`; `id`/`role` dari sesi → tidak ada query user ulang per halaman.
- Halaman pelajaran: dari ±7 query berurutan → ≤ 3 gelombang `Promise.all`.

---

## 11. Spesifikasi admin panel dan alat pengajar

### 11.1 Prinsip UX admin

- Pola konsisten: **daftar → detail/edit → konfirmasi → catatan aktivitas**. Setiap tabel punya pencarian, filter status, urutan, paginasi server-side (25/halaman).
- Aksi berisiko (arsip, hapus, ganti peran, buka akses manual) → dialog konfirmasi dengan konsekuensi ditulis jelas; yang paling berbahaya meminta ketik nama.
- Semua perubahan penting masuk `AuditLog` dan tampil di sisi item ("Riwayat").
- Form: validasi inline per field (tidak menunggu kirim), status "Tersimpan ✓ {jam}", peringatan bila meninggalkan halaman dengan perubahan belum disimpan.
- Bahasa admin tetap Indonesia sederhana; tidak ada istilah teknis (bukan "slug" saja, tulis "Alamat halaman (slug)").
- Admin panel dioptimalkan untuk laptop; tetap bisa dipakai di HP (tabel → kartu).

### 11.2 Peta menu `/admin`

```text
Ringkasan │ Kursus │ Pengajar │ Pengguna │ Pembayaran │ Isi website │ Catatan aktivitas │ Bantuan
```

### 11.3 Ringkasan `/admin` (No. 26)

Satu halaman, periode dapat dipilih (7 hari / 30 hari / 90 hari / semua):

| Kartu | Definisi |
|---|---|
| Pengguna baru | Jumlah `User.createdAt` dalam periode + selisih vs periode sebelumnya |
| Pendaftar per kursus | Tabel: kursus, enrollment baru, total aktif |
| Pemasukan | Jumlah `Order.amount` berstatus PAID dalam periode (kotor, belum dipotong biaya Mayar); label jelas |
| Konversi checkout | Order dibuat → PAID (%) |
| Perlu perhatian | Order PENDING > 1 jam, order PAID tanpa enrollment, kursus DRAFT dengan 0 pelajaran |
| Progres belajar | Rata-rata % selesai per kursus; siswa tidak aktif 14 hari |

Grafik sederhana (garis harian pemasukan/pendaftar) dengan tabel alternatif; warna aksesibel; tidak memakai pustaka berat (SVG server-rendered).

### 11.4 Modul detail

**Kursus & pelajaran (No. 22)** — `/admin/kursus`, `/admin/kursus/baru`, `/admin/kursus/[id]`
- Daftar: judul, bidang, jenjang, pengajar, harga, status (Draf/Tayang/Arsip), pendaftar, aksi.
- Form kursus: judul Latin, judul Arab, alamat halaman, bidang, jenjang, pengajar, deskripsi, harga, status. Slug otomatis dari judul Latin.
- **Publikasi**: tombol "Tayangkan" nonaktif sampai ≥ 1 pelajaran PUBLISHED, harga valid, dan pengajar terisi; pesan menyebut yang kurang. Kursus baru selalu **DRAFT** (P4).
- **Pelajaran**: daftar dengan **urutan dapat diubah** (seret-lepas + tombol ▲▼ untuk keyboard), status Draf/Tayang per pelajaran, tandai 1 sebagai pratinjau gratis, durasi, URL video, **editor matan** (daftar blok Arab + terjemah, dengan pratinjau RTL), **editor catatan** Markdown + pratinjau berdampingan.
- Perubahan urutan disimpan dalam satu transaksi (hindari konflik `@@unique(courseId, position)` dengan penomoran dua fase).
- Harga: dapat diubah; bila sudah ada order PAID, muncul catatan "Pembeli lama tidak terpengaruh".
- Arsip/Pulihkan/Hapus mengikuti §10.4.

**Pengajar (No. 22)** — `/admin/pengajar`: CRUD `TeacherProfile` (nama tampil, foto [unggah ≤ 1 MB, jpg/png/webp, dikompres], bio, alumni, sanad), tautkan ke akun pengguna; yang tampil di beranda diatur dengan sakelar "Tampilkan di beranda".

**Pengguna (No. 23)** — `/admin/pengguna`, `/admin/pengguna/[id]`
- Cari (nama/email), filter peran. Detail: info akun, daftar kursus + progres, riwayat order, riwayat aktivitas.
- Ganti peran (§10.5). **Akses kursus**: tambah (buka manual, **wajib alasan**) / cabut (nonaktifkan enrollment, wajib alasan); keduanya tercatat. Tidak menghapus data pengguna.

**Pembayaran (No. 24)** — `/admin/pembayaran`
- Tab status: Semua · Menunggu · Lunas · Kedaluwarsa · Gagal. Kolom: waktu, pengguna, kursus, nominal, status, ID Mayar.
- Detail order: garis waktu, payload ringkas, tombol **"Cek ulang ke Mayar"** (menjalankan verifikasi §10.2 langkah 4 untuk order itu) dan **"Buka akses manual"** (alasan wajib; membuat enrollment dan menandai catatan).
- "Order nyangkut": PAID tanpa enrollment / PENDING lama — ditandai di Ringkasan.
- Refund tidak diproses dari panel; tersedia catatan "Refund dilakukan di dashboard Mayar" + kolom catatan internal.

**Isi website (No. 25)** — `/admin/konten` (§11.5)

**Catatan aktivitas** — `/admin/log`: tabel `AuditLog` (waktu, pelaku, aksi, target, sebelum→sesudah, alasan), filter aksi/tanggal/pelaku, ekspor CSV.

**Bantuan** — `/admin/bantuan`: panduan singkat bergambar untuk 10 tugas paling umum (lihat Lampiran C).

### 11.5 Isi website (No. 25)

| Bagian | Bisa diubah | Penyimpanan |
|---|---|---|
| Beranda | Eyebrow, judul, sub, teks CTA, 3 langkah, band "Seperti apa belajarnya" (+ contoh matan) | `SiteContent` (`home.*`) |
| Tanya jawab | Tambah/ubah/hapus/urut pertanyaan (beranda) | `SiteContent` (`faq.items`) |
| Kontak | Nomor WhatsApp admin, email, jam layanan, alamat | `SiteContent` (`contact.*`) — dipakai footer, FAQ, halaman kontak, dan pesan di checkout |
| Legal | Kebijakan privasi, Syarat dan ketentuan, Kebijakan refund (Markdown) | `LegalDocument` (versi + `publishedAt`) |

Aturan: ada pratinjau sebelum "Terbitkan"; terbitan lama tersimpan sebagai versi; halaman menampilkan "Terakhir diperbarui" otomatis; teks di-sanitasi; nilai kosong jatuh ke default kode.

### 11.6 Metrik funnel (opsional P2)

Catat peristiwa ringan sisi server (`course_view`, `checkout_start`, `order_paid`) di tabel `Event` agar "Konversi" di Ringkasan bermakna. Tanpa pelacak pihak ketiga.

### 11.7 Alat pengajar `/dashboard/kelola` (No. 15)

Subset admin yang dibatasi ke kursus milik sendiri: buat/edit kursus (kecuali harga), pelajaran (urut, draf/tayang, matan, catatan, video), **Siswa** (daftar siswa + progres per pelajaran, ekspor CSV), dan tombol **Pratinjau sebagai siswa**. Kursus baru selalu Draf; "Ajukan tayang" memberi notifikasi ke admin (cukup banner di Ringkasan admin).

---

## 12. Rencana kerja: task dan checkpoint per hari

Format task: **ID · Judul · (Prioritas) · Ref audit** → *Logika/Langkah* → **Selesai jika (AC)**.
Penyelesaian task = kode + tes + diperiksa di staging. Estimasi di sini adalah urutan kerja, bukan janji per jam.

### Hari 1 — Amankan dan pondasi

**Tujuan:** celah keamanan tertutup; alur error dan arsip aman; token desain terpasang.

- [ ] **T1.1 · Upgrade Next.js & React** (P0 · K1)
  - Langkah: baca advisori resmi Next.js/React, pilih versi patch 15.x yang menutup CVE-2025-55182/66478 (juga DoS/kebocoran source di rilis berikutnya); `yarn upgrade`; perbaiki breaking change; jalankan `npx fix-react2shell-next` bila tersedia.
  - **AC:** `next -v`/`react -v` sesuai advisori; `yarn build` hijau; smoke test: beranda, login, bayar (sandbox), pelajaran, kelola berjalan; **log server sejak Desember 2025 diperiksa** dan hasilnya dicatat (kemungkinan server sudah terpapar).
- [ ] **T1.2 · Rotasi secret & kunci build baru** (P0 · K2, P5)
  - Langkah: buat nilai baru `AUTH_SECRET`, `MAYAR_API_KEY` (+ webhook token), password DB, **client secret Google**; set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; `APP_URL` baca runtime; build ulang; pastikan `.next/` & `.env*` ada di `.gitignore`; hapus salinan `.next` lama yang beredar.
  - **AC:** nilai lama tidak berlaku (uji: kredensial lama ditolak); `server-reference-manifest.json` build baru berisi kunci baru; tidak ada domain production ter-hardcode di bundle (`grep` hasil build).
- [ ] **T1.3 · Header keamanan** (P0 · K3)
  - Langkah: `poweredByHeader:false`; `headers()` untuk HSTS (mulai `max-age` pendek 1 hari → naikkan setelah stabil), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy: frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com` (CSP penuh bernonce = P2 di luar rilis).
  - **AC:** `curl -I` menunjukkan semua header, tanpa `X-Powered-By`; pemindai header (securityheaders.com atau setara) ≥ B; YouTube tetap tampil; login Google tetap jalan.
- [ ] **T1.4 · Arsip kursus + konfirmasi** (P0 · P1)
  - Langkah: migrasi `archivedAt`; ganti action `deleteCourse` → `archiveCourse`/`restoreCourse`; dialog ketik-judul; hapus permanen sesuai §10.4; filter katalog `archivedAt IS NULL`.
  - **AC:** tes otomatis: kursus dengan order PAID **tidak** bisa dihapus permanen walau lewat request langsung; arsip tidak mencabut akses siswa; AuditLog terisi.
- [ ] **T1.5 · Pola respons action & form error** (P0 · B1)
  - Langkah: helper `action()` yang membungkus zod → `{ok:false,error}`; ganti semua `throw new Error` untuk kesalahan input/izin/aturan; komponen `<Form>` + `<FieldError>` + `useActionState`; fokus ke error pertama.
  - **AC:** WA "0812 34" di checkout → pesan di bawah field (bukan layar error); semua 13 action melalui helper; tes unit validator.
- [ ] **T1.6 · Halaman error & 404 berbahasa Indonesia** (P0 · B1, U7)
  - Langkah: `app/error.tsx`, `app/dashboard/error.tsx`, `app/not-found.tsx` bermerek (§8.7).
  - **AC:** URL ngawur → 404 Indonesia; paksa throw → halaman error dengan tombol "Coba lagi".
- [ ] **T1.7 · Token desain, font, kontras, fokus** (P0 · A1, A2, F3, Q2)
  - Langkah: `styles/tokens.css` (§7.3); `next/font` untuk Newsreader/Hanken/Satoshi(local)/Amiri (Amiri hanya halaman berteks Arab); outline `:focus-visible` global; ganti token menyesatkan (`--parchment` dst.); 3 breakpoint; kurangi `!important` dan inline style pada file yang disentuh; catat kontras di `docs/contrast.md`.
  - **AC:** semua pasangan teks/latar ≥ 4,5:1 (alat tercatat); fokus terlihat pada semua tombol/tautan/input; tidak ada `@import` font di CSS.
- [ ] **T1.8 · Validasi input terpusat (zod)** (P0 · K6)
  - **AC:** semua batas §10.6 diterapkan; harga 3.000.000.000 ditolak dengan pesan (bukan error Prisma).
- [ ] **T1.9 · `lib/auth-guard.ts`** (P0 · Q1, F2)
  - Langkah: `requireUser/Role/CourseOwner`, `getCurrentUser` + `React.cache`; sesi membawa `id` & `role`; ganti 4 duplikasi.
  - **AC:** `grep` tidak menemukan lookup user-by-email di luar modul ini; setiap page/action ber-guard (daftar rute × peran diuji otomatis).
- [ ] **T1.10 · `/api/health` publik minimal** (P2 · K8) — **AC:** publik `{status:"ok"}`; detail DB hanya dengan `MONITOR_TOKEN`.

**CHECKPOINT 1 — akhir Hari 1 (gerbang keamanan)** · demo ke klien di staging:
- [ ] Versi Next/React tercatat, build hijau, log dicek
- [ ] Secret lama tak berlaku; kunci build baru
- [ ] Header keamanan terbukti lewat `curl -I`
- [ ] Hapus kursus berbayar ditolak; arsip + pulihkan berfungsi
- [ ] WA salah → pesan inline; 404/error Indonesia
- [ ] Token desain & fokus keyboard terlihat
- [ ] Tes otomatis (unit + guard) hijau; **go/no-go untuk deploy P0 ke production segera** (disarankan: deploy Hari 1 karena soal keamanan)

---

### Hari 2 — Buka funnel: katalog, detail, legal, beranda baru

**Tujuan:** pengunjung baru bisa menjelajah dan mendaftar tanpa jalan buntu.

- [ ] **T2.1 · Migrasi data kursus** (P0 · U2, B5, P4) — slug, `titleAr`, `field`, `level`, `status`, `priceRupiah`, `position`; backfill (§6.4); redirect URL lama berbasis `id` → slug. **AC:** semua kursus lama punya slug unik; URL lama 308.
- [ ] **T2.2 · Komponen kartu kursus + sampul** (P0 · U9, U4) — §7.6. **AC:** kartu aksesibel (satu target klik), judul Arab RTL benar, 3 bidang berwarna berbeda lolos kontras.
- [ ] **T2.3 · Katalog publik `/kursus`** (P0 · U1, U9) — §8.3, filter query string, pencarian ternormalisasi, paginasi. **AC:** bekerja tanpa JS; tautan hasil filter dapat dibagikan; kosong & error ditangani.
- [ ] **T2.4 · Detail kursus `/kursus/[slug]`** (P0 · U2) — §8.4 kecuali checkout; silabus, pengajar, FAQ kursus, pratinjau gratis, metadata + JSON-LD. **AC:** tamu melihat silabus & harga; DRAFT → 404; mobile punya bar lengket.
- [ ] **T2.5 · Login lanjutan & callbackUrl aman** (P0 · U1) — `/masuk`, `signIn('google',{callbackUrl})`, validasi path internal, `?lanjut=1` membuka checkout. **AC:** tes e2e: Tamu → Daftar → Google → kembali ke kursus yang sama dengan panel terbuka; `callbackUrl=https://evil.com` diabaikan.
- [ ] **T2.6 · Halaman legal** (P0 · L1) — `LegalDocument`, 4 halaman, tautan di footer & checkout, draf dari Dar Dev **menunggu persetujuan klien**. **AC:** 4 URL 200; tautan di footer dan checkout; label versi & tanggal; **tidak dipublikasikan sebelum klien menyetujui** (flag).
- [ ] **T2.7 · Beranda baru** (P0 · U3, U4, U1) — §8.2, header dengan Masuk selalu terlihat, peta marhalah, band matan, pengajar, FAQ `<details>`, footer. Konten dari `SiteContent` dengan fallback. **AC:** 6 tombol lama semuanya valid; di 375 px tombol Masuk terlihat tanpa menu; Lighthouse mobile terpenuhi (§13.2).
- [ ] **T2.8 · Aksesibilitas publik** (P0 · A1–A3) — landmark `header/main/footer` bersaudara, skip link, target 44 px (footer), kontras. **AC:** axe/Pa11y 0 pelanggaran serius/kritis di halaman publik; uji keyboard manual lolos.
- [ ] **T2.9 · SEO dasar** (P1 · U8) — `app/icon`, `opengraph-image`, `sitemap.ts` (hanya kursus PUBLISHED), `robots.ts`, `generateMetadata`. **AC:** pratinjau link WhatsApp menampilkan judul+gambar; sitemap valid.
- [ ] **T2.10 · Checkout panel (UI + validasi)** (P0 · B1, L1) — §8.4 butir panel; server action dibuat di T3.1. **AC:** semua pesan error §10.3 tampil.

**CHECKPOINT 2 — akhir Hari 2 (gerbang funnel)** · demo:
- [ ] Skrip tamu: Beranda → Katalog → Detail → Daftar → login → kembali ke kursus
- [ ] 4 halaman legal ada & tertaut (isi menunggu persetujuan klien)
- [ ] axe 0 serius/kritis; Lighthouse sesuai target
- [ ] Tampilan 375 / 768 / 1280 px diperiksa (tangkapan layar dilampirkan)
- [ ] **Deploy ke production** setelah klien setuju (opsional; bila ya, ulangi smoke test CP1)

---

### Hari 3 — Pembayaran jujur dan area siswa

**Tujuan:** alur uang benar dari klik sampai kelas terbuka; dashboard & pelajaran baru.

- [ ] **T3.1 · Pembuatan order idempoten** (P0 · P2) — §10.1; indeks unik parsial; `expiredAt` ke Mayar; reuse PENDING; kunci tombol. **AC:** tes: 5 klik paralel → tepat 1 order & 1 invoice; klik lagi dalam 24 jam → invoice sama; order lama kedaluwarsa → order baru.
- [ ] **T3.2 · Cron kedaluwarsa + kedaluwarsa malas** (P0 · P2) — `/api/cron/expire-orders` + jadwal di hosting. **AC:** order dengan `expiresAt` lampau → EXPIRED dalam ≤ 15 menit; endpoint tanpa secret → 401.
- [ ] **T3.3 · Halaman status pembayaran nyata** (P0 · P3) — §9.3, auto-refresh 5 dtk (maks 3 menit), kepemilikan order. **AC:** tes untuk 4 status; `?orderId=ngawur` tidak menampilkan status palsu; order orang lain → 404.
- [ ] **T3.4 · Kunci webhook Mayar** (P0 · K4) — §10.2. **AC:** tanpa token → 401; payload invalid → 400 generik; ratusan request/menit → 429; webhook sah ganda → satu enrollment; respons tidak membocorkan alasan.
- [ ] **T3.5 · Dashboard baru** (P0 · U5, B2, B4) — §9.2, shell §9.1 (tab bar mobile), hitung kursus aktif benar, hapus menu mati, profil bersih. **AC:** siswa dengan 5 kursus melihat "5"; tidak ada "Segera Hadir"; tidak ada `â€”`/cuid di UI (tes `grep` hasil render).
- [ ] **T3.6 · "Lanjutkan belajar" + progres** (P0 · U5) — `LessonProgress`, `lastOpenedAt`, aturan §9.2. **AC:** tes aturan 4 keadaan (belum mulai/di tengah/selesai satu pelajaran/selesai semua).
- [ ] **T3.7 · Konten pelajaran kaya** (P0 · B6) — Markdown tersanitasi, blok matan RTL, Amiri. **AC:** enter tunggal dan daftar muncul; `<script>`/`onerror` dibuang; Arab rata kanan.
- [ ] **T3.8 · Halaman pelajaran baru** (P0 · B3, K5) — §9.4, mode pratinjau, video aman, silabus & progres, bar aksi lengket (mobile). **AC:** pengajar/admin tidak melihat "Tandai selesai" gagal; `https://youtube.com.situs-palsu.id/embed/x` ditolak; layout 375 px nyaman.
- [ ] **T3.9 · Performa halaman** (P1 · F1, F2) — beranda/katalog ISR; `Promise.all`. **AC:** beranda `Cache-Control` mengizinkan cache (bukan `no-store`); halaman pelajaran ≤ 3 gelombang query.
- [ ] **T3.10 · Kursus Saya & Pembayaran & Profil** (P1) — §9.5, §9.3 riwayat, §9.6. **AC:** halaman memuat, state kosong/gagal benar.

**CHECKPOINT 3 — akhir Hari 3 (gerbang uang)** · demo dengan **mode sandbox Mayar**:
- [ ] Bayar → lunas → kelas terbuka (log webhook + enrollment terbukti)
- [ ] Bayar → biarkan kedaluwarsa → status EXPIRED → "Bayar ulang" membuat order baru
- [ ] Klik ganda tidak membuat order ganda
- [ ] Webhook tanpa token ditolak; webhook ganda idempoten
- [ ] Dashboard: angka & "Lanjutkan belajar" benar; tab bar mobile
- [ ] Pelajaran: video aman, matan RTL, catatan Markdown, tandai selesai
- [ ] **Satu transaksi nyata kecil** pada production setelah deploy (disarankan ke klien, nominal minimum) — dicatat

---

### Hari 4 — Admin panel, alat pengajar, perapian, rilis

**Tujuan:** tim Nizhamiyyah mandiri; semua temuan tertutup; rilis dan serah terima.

- [ ] **T4.1 · Kerangka `/admin` + Ringkasan** (P1 · No. 22–26) — layout, navigasi, guard ADMIN, kartu §11.3. **AC:** non-admin → 403; semua angka cocok dengan kueri manual pada data seed.
- [ ] **T4.2 · Pengguna & catatan aktivitas** (P1 · K7, No. 23) — §11.4, §10.5, `AuditLog`, `/admin/log`. **AC:** tak bisa menurunkan admin terakhir; setiap ganti peran/akses tercatat; ekspor CSV.
- [ ] **T4.3 · Kursus, pelajaran, pengajar** (P1 · U6, P4, B3, No. 15, 22) — CRUD, urut, status draf, pratinjau, editor matan/Markdown, harga, alat pengajar `/dashboard/kelola`, tab Siswa. **AC:** kursus baru = Draf; tak bisa tayang tanpa pelajaran; urutan tersimpan; pengajar hanya melihat kursusnya.
- [ ] **T4.4 · Pembayaran admin** (P1 · No. 24) — daftar/filter, cek ulang Mayar, buka akses manual berdalih. **AC:** order PAID tanpa enrollment bisa diperbaiki dari panel; semua aksi tercatat.
- [ ] **T4.5 · Isi website** (P1 · No. 25) — `SiteContent`, FAQ, kontak, legal berversi + pratinjau; `revalidateTag`. **AC:** ubah nomor WA di admin → footer/FAQ/checkout berubah ≤ 5 menit (atau seketika via revalidate); versi lama tersimpan.
- [ ] **T4.6 · Grafik ringkasan & Event funnel** (P2 · §11.3, §11.6) — **AC:** grafik + tabel alternatif.
- [ ] **T4.7 · Bantuan admin** (P1) — `/admin/bantuan` + PDF panduan (Lampiran C). **AC:** setiap tugas punya langkah bergambar.
- [ ] **T4.8 · Perapian akhir** (P1 · Q1, Q2, F3, A3, U7, U8, P5, B5) — CSS dirapikan, token nama, tombol HP ≥ 44 px, slug Arab teratasi, sisa `grep` hardcode domain. **AC:** daftar "temuan 37" di Lampiran A semua berstatus Selesai/Dibuktikan.
- [ ] **T4.9 · Uji menyeluruh bersama tim** (P0) — skenario §14.3 dijalankan klien + Dar Dev di staging; bug P0/P1 ditutup.
- [ ] **T4.10 · Rilis & serah terima** (P0) — §15.

**CHECKPOINT 4 — akhir Hari 4 (gerbang rilis)** — semua kotak di §15.1 tercentang.

### 12.1 Jalur kritis dan ketergantungan

```text
CP0 ──► T1.1/T1.2 ──► T1.3 ... (P0 keamanan)          } Hari 1
        T1.5/T1.9 ──► T2.5 ──► T3.1 ──► T3.3           }   (error & guard dipakai semua fitur setelahnya)
        T2.1 (migrasi) ──► T2.3/T2.4 ──► T4.3           }
        T2.6 (legal)  ──► T2.10 (checkout)             } butuh persetujuan teks klien
        T3.1 ──► T3.2 ──► T3.4                         } uang
        T3.5/T3.6/T3.8 ──► T4.1.. (admin memakai komponen yang sama)
```

Tugas yang bisa paralel: tampilan (T2.2, T2.7, T3.5, T3.8) dengan logika server (T3.1–T3.4) setelah kontrak action (T1.5) tetap.

### 12.2 Definition of Done (berlaku untuk setiap task)

1. Memenuhi AC + kriteria desain di PRD ini.
2. Tes otomatis relevan ditambah dan hijau; `yarn lint` + `tsc --noEmit` bersih.
3. Diperiksa di 375 px dan 1280 px; keyboard-only; tanpa error konsol.
4. Tidak ada rahasia di repo/log; tidak ada `console.log` sisa; semua teks UI Bahasa Indonesia.
5. Dideploy ke staging dan dapat dibuka klien; catatan perubahan ditulis di PR.

---

## 13. Persyaratan non-fungsional

### 13.1 Keamanan

- Tidak ada rahasia di klien/`NEXT_PUBLIC_*`; semua action mengecek peran + kepemilikan di server.
- Rate limit: penyimpanan in-memory cukup selama satu proses; bila hosting menjalankan >1 proses, pindah ke tabel DB `RateLimit`. Dicatat sebagai asumsi.
- Cookie sesi `HttpOnly`, `Secure`, `SameSite=Lax`. Redirect hanya internal.
- Unggahan (foto pengajar): validasi tipe MIME + ukuran + ekstensi, nama file acak, disajikan dengan `Content-Type` benar dan `nosniff`.
- Markdown & JSON dari admin selalu disanitasi saat render (bukan hanya saat simpan).
- Dependensi: `yarn audit` tanpa temuan tinggi/kritis yang dapat diperbaiki; pin versi.
- Log: tidak mencatat token, API key, atau nomor WA penuh (mask `0812****7890`).

### 13.2 Performa (target diukur pada profil "Moto G Power, 4G lambat" di Lighthouse)

| Halaman | LCP | CLS | INP | Catatan |
|---|:--:|:--:|:--:|---|
| Beranda | ≤ 2,5 dtk | ≤ 0,1 | ≤ 200 ms | Statis + ISR; font `display:swap`, subset Latin; Amiri hanya di halaman Arab |
| Katalog / Detail | ≤ 2,5 dtk | ≤ 0,1 | ≤ 200 ms | Gambar sampul = CSS (tanpa gambar berat) |
| Pelajaran | ≤ 3,0 dtk | ≤ 0,1 | ≤ 200 ms | Video `loading="lazy"`/facade klik-untuk-putar |

Anggaran: JS awal publik ≤ 150 kB gz; gambar via `next/image`; tidak ada pustaka grafik/ikon yang diimpor utuh.

### 13.3 Aksesibilitas (WCAG 2.2 AA) — cara uji

1. axe-core/Pa11y otomatis pada tiap rute publik dan aplikasi: 0 pelanggaran serius/kritis.
2. Manual: keyboard-only untuk alur Daftar → Bayar → Belajar → Tandai selesai; fokus tidak hilang dan urutannya logis.
3. Pembaca layar (NVDA/VoiceOver) pada beranda, detail kursus, pelajaran (matan Arab dibaca sebagai bahasa Arab).
4. Zoom 200% dan 320 px lebar tanpa kehilangan fungsi; `prefers-reduced-motion` dihormati; mode paksa-warna tidak merusak.

### 13.4 SEO & berbagi

Judul & deskripsi unik per halaman; `canonical`; JSON-LD `Course` + `Organization`; `sitemap.xml` otomatis; OG image dinamis (judul Arab + Latin pada warna bidang); halaman `/dashboard`, `/admin`, `/api` `noindex`.

### 13.5 Kompatibilitas

Chrome/Edge/Safari/Firefox 2 versi mayor terakhir, iOS Safari 16+, Android Chrome. Fitur peningkatan (JS) tidak boleh menjadi syarat untuk membaca konten publik dan membuka menu.

### 13.6 Observabilitas

Log terstruktur (JSON) untuk webhook, order, dan error action; `digest` error ditampilkan ke pengguna dan dicatat; `/api/health` + pantau eksternal (mis. UptimeRobot) untuk `/` dan `/api/health`.

---

## 14. Rencana pengujian

### 14.1 Unit
Validator zod (WA, harga, slug, URL video), normalisasi pencarian Arab, logika "Lanjutkan belajar", penentu status tombol kartu daftar, `callbackUrl`, sanitasi Markdown, pembangun URL YouTube.

### 14.2 Integrasi (DB uji)
Pembuatan order paralel; webhook sah/ganda/tanpa token; cron kedaluwarsa; arsip/hapus berizin; ganti peran (admin terakhir); reorder pelajaran; guard peran × rute (matriks §3.2).

### 14.3 End-to-end (Playwright, atribut `data-testid` yang sudah konsisten dipertahankan)

| # | Skenario | Hasil yang diharapkan |
|---:|---|---|
| E1 | Tamu menekan 6 CTA lama di beranda | Tiap CTA membuka halaman bermakna; tidak ada redirect ke `/` |
| E2 | Tamu cari "ajurrumiyyah", filter bidang, bagikan URL | Hasil sama saat URL dibuka ulang |
| E3 | Tamu → detail → Daftar → Google → kembali | Panel checkout terbuka pada kursus yang sama |
| E4 | WA salah di checkout | Pesan di bawah field; tidak ada layar error |
| E5 | Klik "Bayar" 5× cepat | 1 order |
| E6 | Bayar sandbox sukses | Status PAID, enrollment ACTIVE, tombol "Mulai belajar" |
| E7 | Tagihan kedaluwarsa | EXPIRED + "Bayar ulang" |
| E8 | Siswa belajar → tandai selesai → dashboard | Progres & "Lanjutkan belajar" benar |
| E9 | Pengajar buka pelajaran kursusnya | Mode pratinjau; tak ada tombol gagal |
| E10 | Admin arsipkan kursus berbayar | Ter-arsip; hapus permanen ditolak |
| E11 | Admin ganti peran admin lain / admin terakhir | Konfirmasi; yang terakhir ditolak; AuditLog |
| E12 | Admin ubah nomor WA di Isi website | Footer & checkout berubah |
| E13 | URL tidak ada / paksa error | Halaman Indonesia bermerek |
| E14 | Video URL `youtube.com.situs-palsu.id` | Ditolak saat simpan dan saat render |

### 14.4 Uji lintas perangkat
375×812, 768×1024, 1280×800, 1920×1080; satu iPhone nyata/emulasi dan satu Android; mode gelap OS tidak merusak (tema tetap terang — `color-scheme: light` secara eksplisit).

---

## 15. Rilis, rollback, serah terima

### 15.1 Gerbang rilis (CP4) — semua harus tercentang

- [ ] 37 temuan: tiap ID berstatus *Selesai* + bukti (tes/tangkapan layar) di Lampiran A
- [ ] CP1–CP3 tetap hijau (regresi)
- [ ] Tes unit/integrasi/E2E hijau; lint & tipe bersih
- [ ] axe 0 serius/kritis; Lighthouse sesuai §13.2
- [ ] Teks legal **disetujui klien tertulis**; konten asli (kitab, pengajar, harga, WA) terisi, tidak ada `[...]` tersisa di production
- [ ] Backup DB terbaru; migrasi diuji di salinan
- [ ] Secret production baru; Mayar sandbox → production dicek
- [ ] Cron hosting aktif; monitor uptime aktif
- [ ] Panduan admin + sesi serah terima dijadwalkan

### 15.2 Langkah rilis

1. Bekukan perubahan; tag `v1.0.0-rc`.
2. Backup DB + simpan `.env` lama yang aman (bukan di repo).
3. Jendela trafik rendah: `prisma migrate deploy` → build → mulai ulang aplikasi (`tmp/restart.txt`).
4. Smoke test produksi: beranda, katalog, detail, login, bayar nominal kecil, webhook, pelajaran, admin.
5. Pantau log 60 menit; uptime; kuota Mayar.
6. Umumkan ke tim; serahkan panduan.

### 15.3 Rollback

- Kode: redeploy tag sebelumnya (build lama disimpan satu rilis).
- Data: migrasi *additive*, jadi kode lama tetap jalan di skema baru; pemulihan DB dari backup **hanya** bila ada kerusakan data (dan hanya dengan persetujuan klien, karena order baru bisa hilang — cek webhook Mayar untuk rekonsiliasi).
- Kriteria rollback: error alur bayar > 2% selama 30 menit, atau login gagal massal.

### 15.4 Serah terima

Repo + README pengembangan; daftar env; panduan admin (Lampiran C); sesi 60 menit bersama tim; daftar "yang di luar rilis" (§2.2); garansi perbaikan bug dari pekerjaan ini selama [periode sesuai kesepakatan — **konfirmasi di penawaran**].

---

## 16. Risiko

| # | Risiko | Dampak | Mitigasi |
|---:|---|---|---|
| R1 | Repo/source & skema tidak tersedia atau berbeda dari asumsi | Seluruh jadwal mundur | CP0; hentikan sampai akses ada; T0.2 mencocokkan skema |
| R2 | Server sudah dibobol sebelum upgrade (RCE terbuka sejak Desember 2025) | Rahasia bocor, data terpapar | Rotasi semua secret (T1.2); periksa log; tinjau akun admin & enrollment tak wajar; beri tahu klien bila ada indikasi |
| R3 | Cakupan besar vs 1–4 hari | Kualitas turun / bug alur uang | Prioritas P0/P1/P2 (§4.2); deploy P0 di Hari 1; P2 digeser dengan persetujuan |
| R4 | Konten asli (kitab, pengajar, harga, legal) terlambat | Tidak bisa rilis walau kode siap | Daftar konten §17 dikirim di hari kerja pertama; staging memakai placeholder bertanda |
| R5 | Mayar sandbox/webhook token tidak tersedia | Alur bayar tak bisa diuji menyeluruh | Minta di CP0; fallback: simulasi webhook dengan payload uji + satu transaksi nyata nominal kecil |
| R6 | Migrasi merusak data | Kehilangan data | Backup, uji di salinan, migrasi additive, rollback §15.3 |
| R7 | Prisma/OpenSSL beda antara lokal (Windows) & server (Debian) | Build gagal di server | `binaryTargets` dua lingkungan (T0.3); build diuji di staging yang sama dengan server |
| R8 | Teks legal dianggap nasihat hukum | Tanggung jawab | Draf ditandai "perlu ditinjau"; saran konsultasi hukum; klien yang menyetujui isi |
| R9 | Hosting tak mendukung cron/ISR sesuai harapan | Order tidak kedaluwarsa otomatis | Kedaluwarsa malas saat dibaca (§10.1 butir 4) menjamin kebenaran tampilan |
| R10 | Redesain mengubah URL yang sudah diindeks/dibagikan | Tautan lama mati | Redirect 308 dari rute lama |

---

## 17. Kebutuhan konten dan pertanyaan terbuka

### 17.1 Konten yang harus disediakan klien (blocker rilis)

| Konten | Dipakai di | Format |
|---|---|---|
| Daftar kitab per jenjang (Ula/Wustha/Ulya) per bidang, nama Arab + Latin | Peta marhalah, katalog | Tabel/dokumen |
| Per kursus: deskripsi, prasyarat, jumlah & judul pelajaran, durasi, harga, status gratis/berbayar, pengajar | Katalog, detail | Spreadsheet |
| Profil pengajar: nama tampil, alumni, sanad, foto (opsional) | Beranda, detail | Dokumen + foto |
| Nomor WhatsApp admin, email, jam layanan, alamat bila ada | Footer, FAQ, kontak | Teks |
| Teks FAQ final | Beranda | Dokumen |
| Teks legal (atau persetujuan atas draf Dar Dev) | 4 halaman legal | Dokumen |
| Satu pelajaran pratinjau gratis per kursus (pilihan) | Detail kursus | Pilih dari yang ada |
| Logo final (jika berbeda dari simbol bintang saat ini) | Header, favicon, OG | SVG/PNG |

### 17.2 Pertanyaan yang perlu dijawab

1. **Garansi/pemeliharaan** setelah rilis — berapa lama dan cakupannya? (tidak tercantum di penawaran)
2. Biaya layanan Mayar: ditanggung klien atau dibebankan ke pembeli? (menentukan tampilan "Biaya layanan" di checkout)
3. Apakah pengajar boleh mengubah harga sendiri? (PRD: tidak)
4. Apakah satu kursus bisa punya lebih dari satu pengajar? (PRD: satu pengajar utama; banyak pengajar = kandidat versi berikutnya)
5. Kebijakan refund yang dipakai (jumlah hari, kondisi)? Perlu keputusan bisnis sebelum teks ditulis.
6. Bidang ilmu yang akan ada di katalog selain Nahwu/Fiqih/Aqidah (Sharaf, Hadits, Tafsir, Tasawuf, …)? Setiap bidang baru butuh warna lolos kontras.
7. Penyedia database dan versinya (MySQL/MariaDB/PostgreSQL) — menentukan sintaks indeks unik parsial dan koleksi (collation) untuk pencarian Arab.
8. Data kursus aktif yang sudah ada: berapa kursus/pelajaran/siswa saat ini? (menentukan ukuran backfill)
9. Dokumen README lama menyebut "rencana 4 fase, jadwal 8 minggu" sedangkan penawaran terbaru menyebut **1–4 hari kerja** — PRD ini mengikuti penawaran terbaru. Perbarui README atau konfirmasi.

---

## 18. Lampiran

### Lampiran A — Matriks keterlacakan 37 temuan

Status awal semua **Belum**; ubah menjadi **Selesai + bukti** saat CP4.

| ID | Tingkat | Ringkasan | Task | Status |
|---|---|---|---|---|
| K1 | Kritis | Next 15.1.3 / React 19.0.0 rentan RCE | T1.1 | Belum |
| K2 | Tinggi | Kunci enkripsi ikut di `.next/` | T1.2 | Belum |
| K3 | Tinggi | Tanpa security header | T1.3 | Belum |
| K4 | Sedang | Webhook Mayar tanpa autentikasi/rate limit | T3.4 | Belum |
| K5 | Sedang | Validasi URL video longgar | T3.8, T1.8 | Belum |
| K6 | Rendah | Input action tanpa skema/batas | T1.8 | Belum |
| K7 | Rendah | Peran tanpa jejak audit | T4.2 | Belum |
| K8 | Rendah | `/api/health` terbuka | T1.10 | Belum |
| P1 | Tinggi | Hapus kursus sekali klik | T1.4 | Belum |
| P2 | Sedang | Order PENDING menumpuk/dobel | T3.1, T3.2 | Belum |
| P3 | Sedang | Banner status palsu | T3.3 | Belum |
| P4 | Sedang | Harga tak bisa diubah; kursus kosong langsung tayang | T2.1, T4.3 | Belum |
| P5 | Rendah | Domain produksi tertanam saat build | T1.2 | Belum |
| B1 | Tinggi | Pesan error tak sampai ke pengguna | T1.5, T1.6 | Belum |
| B2 | Sedang | "Kursus Aktif" mentok 3 | T3.5 | Belum |
| B3 | Sedang | Pengajar/admin: "Tandai selesai" gagal | T3.8, T4.3 | Belum |
| B4 | Rendah | Karakter rusak di Profil | T3.5, T3.10 | Belum |
| B5 | Rendah | Slug tak berguna untuk judul Arab | T2.1, T4.8 | Belum |
| B6 | Rendah | Materi kehilangan format | T3.7 | Belum |
| U1 | Tinggi | 6 CTA tak berfungsi untuk tamu | T2.3, T2.5, T2.7 | Belum |
| U2 | Tinggi | Tidak ada detail kursus | T2.4 | Belum |
| U3 | Sedang | Tombol masuk tersembunyi di HP | T2.7 | Belum |
| U4 | Sedang | Landing penuh klaim, minim bukti | T2.2, T2.7 | Belum |
| U5 | Sedang | Dashboard penuh elemen mati | T3.5, T3.6 | Belum |
| U6 | Sedang | Alat pengajar minim | T4.3 | Belum |
| U7 | Rendah | 404/error bawaan Inggris | T1.6 | Belum |
| U8 | Rendah | SEO & share minim | T2.9 | Belum |
| U9 | Rendah | Katalog tanpa cari/filter | T2.3 | Belum |
| A1 | Sedang | Kontras emas/muted gagal AA | T1.7, T2.8 | Belum |
| A2 | Sedang | Fokus keyboard tak terlihat | T1.7 | Belum |
| A3 | Rendah | Target sentuh kecil; landmark salah | T2.8, T4.8 | Belum |
| F1 | Sedang | Landing dirender ulang tiap kunjungan | T3.9 | Belum |
| F2 | Sedang | Query berulang & berurutan | T1.9, T3.9 | Belum |
| F3 | Rendah | Font via `@import` memblokir render | T1.7 | Belum |
| Q1 | Sedang | Logika auth diduplikasi | T1.9 | Belum |
| Q2 | Rendah | CSS sulit dirawat | T1.7, T4.8 | Belum |
| L1 | Tinggi | Tanpa Privasi/S&K/Refund/Kontak | T2.6 | Belum |

### Lampiran B — Wireframe ringkas kartu & panel (ukuran referensi)

```text
KARTU KURSUS (lebar ≥ 280)                  KARTU DAFTAR (sticky, lebar 340)
┌────────────────────────────┐              ┌──────────────────────────────┐
│ ▓▓▓ sampul 128px ▓▓▓       │              │ Rp [harga]        (32px, 700)│
│ ✦             متن الآجرومية│ ← Arab 26px  │ Akses selamanya              │
│ [Nahwu] [Ula]              │              │ ──────────────────────────── │
│ Matan al-Ajurrumiyyah      │ ← 15–20px    │ ✓ 24 pelajaran · ± 9 jam     │
│ 24 pelajaran · ± 9 jam     │              │ ✓ Teks Arab + terjemah       │
│ ─────────────────────────  │              │ ✓ Catatan pengajar           │
│ (U) [Nama Ustadz]  Rp [..] │              │ [  Bayar Rp… lewat Mayar  ]  │
└────────────────────────────┘              │ QRIS · VA · e-wallet         │
                                            └──────────────────────────────┘
```

### Lampiran C — Panduan admin (10 tugas, isi `/admin/bantuan`)

1. Menambah kursus baru dan menayangkannya
2. Menambah & mengurutkan pelajaran; mengisi matan Arab dan catatan
3. Mengganti harga kursus
4. Mengarsipkan / memulihkan kursus
5. Mengubah nomor WhatsApp dan teks FAQ
6. Mengubah & menerbitkan kebijakan privasi/syarat/refund
7. Menjadikan seseorang pengajar / admin
8. Membuka akses kursus secara manual (dan kapan boleh)
9. Memeriksa pembayaran yang nyangkut
10. Membaca Ringkasan dan Catatan aktivitas

### Lampiran D — Daftar periksa desain sebelum tiap tampilan dirilis

- [ ] Ada satu aksi utama yang jelas di layar ini
- [ ] Judul Arab/matan RTL, Amiri, lh ≥ 1,8, bukan gambar
- [ ] Kontras tervalidasi; tidak ada `--muted-ui` dipakai untuk teks
- [ ] Fokus terlihat; target ≥ 44 px; bisa dipakai keyboard
- [ ] 375 px dan 1280 px dirancang masing-masing, bukan sekadar mengecil
- [ ] Keadaan kosong, memuat, error, berhasil semuanya ada
- [ ] Teks UI Indonesia, tombol berupa kata kerja spesifik, error menyebut cara memperbaiki
- [ ] Tidak ada klaim tanpa bukti; tidak ada placeholder `[...]` di production
