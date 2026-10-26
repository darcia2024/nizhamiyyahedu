# Catatan skema - 27 Oktober 2026

## Bukti yang tersedia

Folder root berisi build production lama, dokumen, dan prototipe. Fondasi source di `web/` menggunakan skema SQLite yang dibangun dari PRD. Tidak ada skema/data production asli untuk memastikan kesetaraan.

## Keputusan lokal

- Provider SQLite, Prisma 6.19.3, binary target native untuk Windows.
- User, TeacherProfile, Course, Lesson, Enrollment, LessonProgress, Order, AuditLog, SiteContent, LegalDocument, Event dan RateLimit.
- Peran/status disimpan sebagai string dan dibatasi validator aplikasi.
- Matan, isi website dan nilai audit disimpan sebagai string JSON. Renderer memvalidasi/sanitasi sebelum ditampilkan.
- Satu PENDING per pasangan user/kursus dijamin indeks unik parsial `Order_one_pending`, selain transaksi/retry aplikasi.
- Arsip memakai archivedAt. Arsip tidak menghapus enrollment/progres. Hapus permanen ditolak untuk pembeli berbayar.
- File `prisma/migrations/202610270001_initial/migration.sql` hanya untuk database kosong dengan provider SQLite.

## Yang harus dicocokkan sebelum migrasi production

1. Provider/versi MySQL, MariaDB, PostgreSQL, atau SQLite hosting sebenarnya.
2. Nama kolom dan hubungan asli, pemetaan INSTRUCTOR ke TEACHER, serta sumber enrollment lama.
3. Pemetaan price ke priceRupiah, published ke status, order ke position, dan slug lama.
4. Pemetaan ID Mayar lama dan nomor transaksi; uji rekonsiliasi dengan data merchant.
5. Strategi satu PENDING: PostgreSQL/SQLite dapat memakai indeks parsial. MySQL memerlukan generated column atau tabel reservasi unik yang setara.
6. Backup, staging, backfill idempoten dan uji data pembeli sebelum melakukan perubahan additive.

Belum ada data production yang dipindah, direset, atau diubah.
