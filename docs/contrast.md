# Pasangan warna yang digunakan

Token PRD diterapkan di `web/src/styles/tokens.css`. Pasangan utama: ink #10231C di putih; ink-2 #4F5C55 dan muted-text #5B6660 di shell #F7F8F6; putih di brand #1B4D3B; cream #F2E6C4 di brand-dark #143B2D; danger #B3261E di danger-soft #FBE9E7.

Pemeriksaan axe pada halaman lokal yang tercantum dalam implementation-status mencakup aturan color-contrast. Tidak ada pelanggaran color-contrast pada halaman yang diperiksa. Muted-ui #8A948F hanya untuk dekorasi/garis, bukan informasi teks wajib.

Fokus keyboard global: outline 2px, offset 2px. Latar gelap menggunakan outline cream. Pemeriksaan tambahan pada konten dan warna baru dari admin tetap diperlukan sebelum rilis.
