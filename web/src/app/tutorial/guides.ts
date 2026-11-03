/** Isi tutorial superadmin. Gambar ada di public/tutorial; nama, email, dan angka pendapatan di dalamnya sudah disamarkan. */
export type TutorialStep = { text: string; shot?: string; alt?: string };
export type TutorialGuide = { id: string; title: string; intro: string; href?: string; steps: TutorialStep[]; note?: string };

export const GROUPS: { title: string; text: string; ids: string[] }[] = [
  { title: "Mulai dari sini", text: "Cara masuk dan hal yang paling sering dibuka setiap hari.", ids: ["masuk", "ringkasan", "tinjau", "cari"] },
  { title: "Kursus dan pengajar", text: "Dari membuat kelas baru sampai siap ditonton pembeli.", ids: ["kursus-baru", "pelajaran", "harga", "arsip", "pengajar"] },
  { title: "User dan pembayaran", text: "Mengatur akses, peran, dan tagihan yang perlu diperiksa.", ids: ["akses", "peran", "hapus-user", "pembayaran", "voucher"] },
  { title: "Isi website", text: "Tulisan, gambar, kontak, dan kebijakan yang dilihat pengunjung.", ids: ["beranda", "gambar", "kontak", "kebijakan"] },
  { title: "Riwayat dan catatan", text: "Kalau ada yang salah ubah, atau ingin tahu siapa yang mengubah.", ids: ["riwayat", "aktivitas"] },
];

/** Pintasan di bagian atas untuk tugas yang paling sering dicari. */
export const QUICK_LINKS = [
  { id: "kursus-baru", title: "Saya mau menambah kelas", text: "Buat kursus, isi pelajaran, lalu tayangkan." },
  { id: "pembayaran", title: "Ada yang sudah bayar tapi kelasnya belum terbuka", text: "Periksa tagihannya, lalu buka aksesnya." },
  { id: "beranda", title: "Saya mau mengubah tulisan di website", text: "Ubah teks beranda, menu, sampai footer." },
];

export const GUIDES: TutorialGuide[] = [
  {
    id: "masuk",
    title: "Masuk ke panel",
    intro: "Panel ini tidak memakai kata sandi khusus, Sidi cukup masuk dengan akun Google yang sudah terdaftar sebagai superadmin.",
    href: "/admin",
    steps: [
      { text: "Buka belajarditimurtengah.com/masuk, lalu pilih Masuk dengan Google." },
      { text: "Pilih akun Google superadmin. Setelah masuk, Sidi langsung dibawa ke panel. Kalau muncul tulisan Superadmin di kanan atas, berarti aksesnya sudah benar." },
    ],
  },
  {
    id: "ringkasan",
    title: "Membaca Ringkasan",
    intro: "Ini halaman pertama yang Sidi lihat setiap kali masuk. Saya sarankan mulai dari sini, karena kondisi website bisa terbaca dalam sekali lihat.",
    href: "/admin",
    steps: [
      {
        text: "Lihat kartu angkanya: user baru, pemasukan kotor, user yang aktif belajar, dan kursus yang tayang. Pemasukan di sini masih sebelum dipotong biaya Mayar.",
        shot: "ringkasan",
        alt: "Halaman Ringkasan dengan kartu angka dan tombol Kelola konten website",
      },
      { text: "Mau melihat rentang waktu lain? Ganti pilihan 30 hari terakhir di kanan atas, lalu tekan Terapkan." },
      { text: "Kalau mau langsung mengubah isi website, tekan Kelola konten website." },
    ],
  },
  {
    id: "tinjau",
    title: "Mengerjakan yang perlu ditinjau",
    intro: "Kalau waktu Sidi sedang sempit, buka halaman ini saja. Semua yang menunggu keputusan Sidi sudah dikumpulkan di satu tempat, dan angka di menunya menunjukkan berapa banyak.",
    href: "/admin/tinjau",
    steps: [
      {
        text: "Buka menu Perlu ditinjau. Kalau semuanya beres, halaman ini akan bilang begitu dan Sidi tidak perlu melakukan apa-apa.",
        shot: "tinjau",
        alt: "Halaman Perlu ditinjau berisi satu tagihan menggantung dan tombol Cek ke Mayar",
      },
      { text: "Kursus diajukan: ini kursus dari pengajar yang menunggu izin tayang. Buka judulnya untuk memeriksa isinya dulu, lalu tekan Tayangkan kalau sudah pas." },
      { text: "Lunas tetapi akses belum terbuka: pembayarannya sudah masuk, tapi kelasnya belum terbuka untuk user. Tekan Buka akses, dan alasannya akan tercatat otomatis." },
      { text: "Tagihan menggantung: tagihan yang lebih dari satu jam belum dibayar. Biasanya tidak perlu diapa-apakan. Tekan Cek ke Mayar kalau user mengabari sudah membayar." },
    ],
  },
  {
    id: "cari",
    title: "Mencari apa saja dengan cepat",
    intro: "Daripada membuka menu satu per satu, Sidi bisa langsung mencari dari halaman mana pun di panel.",
    steps: [
      {
        text: "Tekan Ctrl dan K bersamaan di keyboard, atau tekan tombol Cari di bagian atas. Kalau pakai HP, tombol Cari inilah jalannya.",
      },
      {
        text: "Ketik minimal dua huruf. Sidi bisa mencari nama atau email user, judul kursus, serta tagihan lewat email pembeli atau ID Mayar.",
        shot: "cari",
        alt: "Kotak pencarian terbuka dengan kata daur dan tiga hasil kursus",
      },
      { text: "Tekan hasil yang Sidi mau. Tekan Enter untuk membuka hasil paling atas, atau Esc untuk menutup kotaknya." },
    ],
  },
  {
    id: "kursus-baru",
    title: "Membuat kursus baru",
    intro: "Tenang saja, kursus baru selalu tersimpan sebagai draf, jadi pengunjung belum bisa melihatnya sampai Sidi sendiri yang menayangkan.",
    href: "/admin/kursus",
    steps: [
      {
        text: "Buka menu Kursus, lalu tekan Buat kursus di kanan atas.",
        shot: "kursus",
        alt: "Daftar kursus dengan tombol Buat kursus di kanan atas",
      },
      {
        text: "Isi judul, alamat halaman, bidang ilmu, jenjang, pengajar, dan harga. Di bawahnya ada deskripsi dan foto kitab untuk sampul kartu. Setelah itu tekan Buat kursus (draf).",
        shot: "kursus-baru",
        alt: "Form kursus baru berisi judul, alamat halaman, bidang ilmu, jenjang, pengajar, dan harga",
      },
      { text: "Tambahkan pelajarannya dulu. Caranya saya jelaskan di bagian berikutnya." },
      {
        text: "Kalau sudah siap, tekan Tayangkan di bagian atas halaman kursus. Syaratnya ada minimal satu pelajaran berstatus Tayang dan pengajarnya sudah dipilih. Kalau ada yang kurang, sistem akan menyebutkannya. Di gambar ini kursusnya sudah tayang, jadi tombolnya berubah menjadi Kembalikan ke draf.",
        shot: "kursus-status",
        alt: "Bagian atas halaman kursus dengan tombol Lihat halaman publik dan Kembalikan ke draf",
      },
      { text: "Tekan Lihat halaman publik untuk memastikan tampilannya sudah sesuai di mata pengunjung." },
    ],
  },
  {
    id: "pelajaran",
    title: "Menambah dan mengurutkan pelajaran",
    intro: "Pelajaran diatur dari dalam halaman kursusnya masing-masing.",
    href: "/admin/kursus",
    steps: [
      {
        text: "Buka kursusnya lewat tombol Kelola, gulir ke bagian Pelajaran, lalu tekan Tambah pelajaran.",
        shot: "pelajaran",
        alt: "Daftar pelajaran dengan tombol Tambah pelajaran, status, panah urutan, Edit, dan Hapus",
      },
      {
        text: "Isi judul, durasi, dan alamat video YouTube. Kalau ada matan, tekan Tambah blok matan untuk mengisi teks Arab beserta terjemahnya per kalimat. Catatan pengajar ditulis di kolom paling bawah, dan hasilnya langsung terlihat di sebelahnya. Setelah itu tekan Buat pelajaran (draf).",
        shot: "pelajaran-baru",
        alt: "Form pelajaran baru berisi judul, durasi, URL video, matan, dan catatan pengajar",
      },
      { text: "Pelajaran baru masih berstatus Draf. Untuk menayangkannya, kembali ke halaman kursus lalu tekan tanda Draf di barisnya sampai berubah menjadi Tayang. Tekan lagi kalau mau mengembalikannya ke draf." },
      { text: "Untuk mengubah urutan, pakai panah naik dan turun, atau buka Urutkan dengan seret dan lepas." },
      { text: "Judul pelajaran bisa mengikuti judul video di YouTube. Kosongkan kolom judul saat menyimpan, atau tekan Samakan judul dengan YouTube di bagian Pelajaran untuk menyamakan semuanya. Jadi kalau Sidi ingin judulnya menjelaskan materi, ubah dulu judul videonya di YouTube, baru tekan tombol ini." },
    ],
  },
  {
    id: "harga",
    title: "Mengubah harga dan membuat paket",
    intro: "Harga bisa diubah kapan saja, dan perubahannya tidak memengaruhi orang yang sudah membeli.",
    href: "/admin/kursus",
    steps: [
      { text: "Buka kursusnya, lalu ubah kolom Harga. Isi 0 kalau kursusnya gratis. Batas tertingginya Rp 50.000.000." },
      {
        text: "Mau menjual beberapa kursus sekaligus? Buat satu kursus baru sebagai paketnya, lalu centang minimal dua kursus di bagian Paket bundling. Sekali beli, user langsung mendapat semua kursus yang dicentang.",
        shot: "paket",
        alt: "Bagian Harga dan Paket bundling dengan dua kursus tercentang",
      },
      { text: "Gulir ke bawah, lalu tekan Simpan perubahan. Perubahan belum berlaku sebelum tombol ini ditekan." },
    ],
  },
  {
    id: "arsip",
    title: "Mengarsipkan kursus",
    intro: "Kalau ada kursus yang tidak mau dijual lagi, saya sarankan diarsipkan saja, jangan langsung dihapus.",
    href: "/admin/kursus",
    steps: [
      { text: "Buka kursusnya, gulir ke paling bawah, lalu buka Arsipkan kursus." },
      { text: "Ketik judul kursusnya sebagai konfirmasi, lalu tekan Arsipkan kursus. Kursus hilang dari katalog, tapi user yang sudah terdaftar tetap bisa belajar." },
      { text: "Berubah pikiran? Buka lagi kursusnya dan tekan Pulihkan kursus." },
    ],
    note: "Hapus permanen hanya tersedia untuk kursus yang sudah diarsipkan dan belum punya pembeli. Yang ini tidak bisa dibatalkan, jadi mohon dipastikan dulu.",
  },
  {
    id: "pengajar",
    title: "Mengelola pengajar",
    intro: "Profil di halaman ini tampil di katalog, halaman kursus, dan beranda.",
    href: "/admin/pengajar",
    steps: [
      {
        text: "Buka menu Pengajar. Untuk menambah orang baru, buka Tambah pengajar. Untuk mengubah data yang sudah ada, langsung edit di kartunya.",
        shot: "pengajar",
        alt: "Halaman Pengajar dengan bagian Tambah pengajar dan kartu profil pengajar",
      },
      { text: "Isi nama, alumni, sanad, dan tentang pengajar. Foto pengajar maksimal 1 MB." },
      { text: "Kalau pengajarnya perlu mengelola kursus sendiri, minta dia masuk dengan Google satu kali, lalu isi kolom Email akun pengajar. Akunnya otomatis berubah menjadi Pengajar." },
      { text: "Hilangkan centang Tampilkan di beranda kalau profilnya tidak mau dimunculkan di beranda. Terakhir, tekan Simpan profil." },
    ],
  },
  {
    id: "akses",
    title: "Membuka akses kursus untuk user",
    intro: "Ini biasanya dipakai untuk beasiswa, atau untuk user yang sudah terbukti membayar tapi aksesnya belum terbuka. Setiap akses yang dibuka wajib ada alasannya, supaya nanti bisa ditelusuri.",
    href: "/admin/pengguna",
    steps: [
      {
        text: "Untuk banyak orang sekaligus, buka menu Pengguna dan centang user yang dimaksud. Pilih semua hanya mencentang user di halaman yang sedang terbuka.",
        shot: "pengguna",
        alt: "Daftar user dengan kotak centang, pilihan kursus, kolom alasan, dan tombol Buka akses untuk yang dipilih",
      },
      { text: "Pilih kursusnya, tulis alasannya di kolom Alasan buka akses, lalu tekan Buka akses untuk yang dipilih. Sekali proses maksimal 100 orang." },
      {
        text: "Untuk satu orang saja, tekan Detail di barisnya, lalu buka Buka akses ke kursus lain di bagian Akses kursus.",
        shot: "pengguna-akses",
        alt: "Bagian Akses kursus di halaman detail user dengan pilihan Buka akses ke kursus lain",
      },
      { text: "Untuk mencabut akses, buka Nonaktifkan akses pada kursus yang dimaksud di bagian yang sama, lalu tulis alasannya." },
    ],
  },
  {
    id: "peran",
    title: "Mengubah peran seseorang",
    intro: "Ada tiga peran: User, Pengajar, dan Admin. Mohon hati-hati dengan peran Admin, karena akun itu bisa mengubah semua isi website, termasuk data pembayaran.",
    href: "/admin/pengguna",
    steps: [
      { text: "Orangnya harus sudah pernah masuk dengan Google, supaya akunnya ada di menu Pengguna. Cari namanya, lalu tekan Detail." },
      {
        text: "Di bagian Ubah peran, pilih peran barunya dan tulis alasannya. Alasan wajib diisi kalau perubahannya menyangkut peran Admin.",
        shot: "pengguna-peran",
        alt: "Bagian Ubah peran berisi pilihan peran, alasan, kotak konfirmasi, dan tombol Simpan peran",
      },
      { text: "Centang kotak konfirmasinya, lalu tekan Simpan peran." },
    ],
    note: "Sidi tidak bisa mengubah peran akun sendiri, dan website harus selalu punya minimal satu admin.",
  },
  {
    id: "hapus-user",
    title: "Menghapus user",
    intro: "Ini untuk akun yang memang tidak dipakai, misalnya akun percobaan. Penghapusan tidak bisa dibatalkan, jadi mohon dipastikan dulu.",
    href: "/admin/pengguna",
    steps: [
      { text: "Untuk satu akun, buka Pengguna, tekan Detail, lalu buka Hapus akun ini di paling bawah. Ketik email akun sebagai konfirmasi, lalu tekan Hapus permanen." },
      { text: "Untuk beberapa akun, centang di daftar Pengguna, lalu tekan Hapus yang dipilih dan setujui konfirmasinya. Akun yang tidak boleh dihapus akan dilewati dan disebutkan alasannya." },
    ],
    note: "Akun admin, pengajar, akun yang sudah pernah membeli atau punya sertifikat, dan akun dengan tagihan yang masih bisa dibayar tidak bisa dihapus. Untuk yang sudah membeli, cukup nonaktifkan aksesnya.",
  },
  {
    id: "pembayaran",
    title: "Memeriksa pembayaran",
    intro: "Kalau ada user yang mengabari sudah membayar tapi kelasnya belum terbuka, inilah tempat memeriksanya.",
    href: "/admin/pembayaran",
    steps: [
      {
        text: "Buka menu Pembayaran. Sidi bisa mencari lewat email, nama kursus, atau ID Mayar. Tekan Periksa di baris tagihannya.",
        shot: "pembayaran",
        alt: "Daftar pembayaran dengan tombol Cek ulang ke Mayar dan tombol Periksa",
      },
      {
        text: "Tekan Cek ulang ke Mayar. Kalau menurut Mayar sudah lunas, aksesnya terbuka otomatis.",
        shot: "pembayaran-detail",
        alt: "Detail pembayaran berisi status tagihan dan tombol Cek ulang ke Mayar",
      },
      { text: "Kalau menurut Mayar belum lunas tapi buktinya sah, isi alasan di Buka akses manual, lalu tekan Konfirmasi buka akses. Status tagihannya tidak berubah, hanya aksesnya yang dibuka." },
      { text: "Untuk memeriksa beberapa tagihan sekaligus, centang di halaman daftar, lalu tekan Cek ulang ke Mayar (yang dipilih). Yang bisa dicentang hanya tagihan yang masih menunggu pembayaran." },
    ],
    note: "Pengembalian dana dilakukan di dashboard Mayar, bukan dari panel ini. Sidi bisa mencatatnya di kolom Catatan internal supaya tim lain tahu.",
  },
  {
    id: "voucher",
    title: "Membuat voucher diskon",
    intro: "Voucher dipakai kalau Sidi ingin memberi potongan harga, misalnya untuk murid lama. Diskonnya dalam persen, dari 1 sampai 100.",
    href: "/admin/voucher",
    steps: [
      { text: "Buka menu Voucher. Isi kode vouchernya, atau kosongkan supaya dibuatkan kode acak, lalu isi besar diskonnya." },
      { text: "Pilih kursusnya, atau biarkan Semua kursus. Kalau perlu, isi juga kuota pemakaian, tanggal berakhir, dan daftar email orang yang boleh memakainya. Setelah itu tekan Buat voucher." },
      { text: "Kirim kodenya ke pembeli. Mereka memasukkan kode itu di Ringkasan pembayaran, lalu menekan Pakai, dan harganya langsung berubah." },
      { text: "Untuk menghentikan voucher, tekan Nonaktifkan di daftarnya. Tombol Hapus hanya muncul untuk voucher yang belum pernah dipakai." },
    ],
    note: "Voucher 100% langsung membuka kelas tanpa lewat Mayar, jadi tidak ada uang yang masuk. Satu akun hanya bisa memakai voucher yang sama sekali. Pembeli yang masih punya tagihan menunggu harus membatalkannya dulu sebelum memakai voucher.",
  },
  {
    id: "beranda",
    title: "Mengubah teks website",
    intro: "Hampir semua tulisan di website bisa Sidi ubah sendiri dari menu Konten website. Tombol di bagian atasnya akan langsung membawa Sidi ke bagian yang dimaksud.",
    href: "/admin/konten",
    steps: [
      {
        text: "Untuk tulisan utama beranda, isi kolom di bagian Beranda, lalu tekan Simpan di bawahnya.",
        shot: "konten",
        alt: "Halaman Konten website dengan tombol pintas dan form Beranda",
      },
      {
        text: "Untuk tulisan lain seperti menu atas, tombol, katalog, sampai footer, buka Teks tiap bagian. Buka kelompok yang dicari, ubah tulisannya, lalu tekan Simpan teks website di paling bawah.",
        shot: "konten-teks",
        alt: "Bagian Teks tiap bagian berisi kelompok seperti Menu atas, Tombol beranda, dan Katalog",
      },
      { text: "Buka website untuk memastikan hasilnya. Kalau belum berubah, tunggu sebentar lalu muat ulang halamannya." },
    ],
  },
  {
    id: "gambar",
    title: "Mengganti gambar dan galeri",
    intro: "Gambar beranda dan galeri Instagram ada di menu Konten website juga.",
    href: "/admin/konten#media",
    steps: [
      {
        text: "Di bagian Gambar beranda, pilih file baru untuk tampilan Desktop atau HP. Formatnya JPG, PNG, atau WebP, maksimal 5 MB. Isi deskripsinya, lalu tekan Simpan gambar.",
        shot: "konten-gambar",
        alt: "Bagian Gambar beranda untuk tampilan Desktop dan HP",
      },
      {
        text: "Di bagian Galeri Instagram, buka Tambah postingan. Isi kode postingannya, yaitu bagian kode pada alamat instagram.com/p/kode/, lalu isi tanggal, deskripsi, dan gambarnya.",
        shot: "konten-galeri",
        alt: "Bagian Galeri Instagram dengan Tambah postingan dan daftar postingan",
      },
      { text: "Untuk mengubah atau menghapus, buka postingannya di daftar yang sama. Galeri bisa menampung maksimal 24 postingan." },
    ],
  },
  {
    id: "kontak",
    title: "Mengubah kontak dan tanya jawab",
    intro: "Nomor WhatsApp, email, jam layanan, alamat, dan tanya jawab semuanya diatur di sini.",
    href: "/admin/konten#kontak",
    steps: [
      {
        text: "Di bagian Kontak pengelola, ubah datanya lalu tekan Simpan. Tulis nomor WhatsApp dengan kode negara, tanpa tanda tambah, seperti contoh di kolomnya.",
        shot: "konten-kontak",
        alt: "Bagian Kontak pengelola dan awal bagian Tanya jawab",
      },
      { text: "Di bagian Tanya jawab, ubah pertanyaan dan jawabannya. Selalu ada satu baris kosong di paling bawah untuk pertanyaan baru. Untuk menghapus, kosongkan pertanyaan dan jawabannya. Setelah itu tekan Simpan." },
    ],
  },
  {
    id: "kebijakan",
    title: "Menerbitkan kebijakan",
    intro: "Kebijakan privasi, syarat dan ketentuan, serta kebijakan refund punya bagiannya masing-masing. Karena isinya menyangkut hukum, mohon dibaca teliti sebelum diterbitkan.",
    href: "/admin/konten#legal",
    steps: [
      {
        text: "Gulir ke dokumen yang mau diubah. Tulis di kolom Isi dokumen, dan hasil tampilannya langsung terlihat di kolom Pratinjau.",
        shot: "konten-kebijakan",
        alt: "Bagian Kebijakan privasi dengan kolom Isi dokumen dan Pratinjau",
      },
      { text: "Tekan Terbitkan versi baru. Versi lamanya tetap tersimpan di Versi terdahulu." },
    ],
  },
  {
    id: "riwayat",
    title: "Kalau salah mengubah konten",
    intro: "Tidak perlu panik. Setiap kali konten disimpan, sistem menyimpan versinya, jadi Sidi bisa kembali ke versi sebelumnya.",
    href: "/admin/konten",
    steps: [
      { text: "Di bawah bagian yang salah, buka Riwayat versi." },
      { text: "Cari versi yang masih benar dari tanggal dan jamnya, lalu tekan Pulihkan versi ini." },
    ],
    note: "Riwayat ini berlaku untuk konten website. Perubahan pada kursus, pelajaran, dan pengajar tidak punya tombol pulihkan, jadi perlu diperbaiki secara manual.",
  },
  {
    id: "aktivitas",
    title: "Melihat siapa mengubah apa",
    intro: "Perubahan penting oleh admin dan pengajar tercatat di menu ini, lengkap dengan waktu dan alasannya. Berguna sekali kalau ada yang berubah dan Sidi ingin tahu sebabnya.",
    href: "/admin/log",
    steps: [
      {
        text: "Buka menu Aktivitas website. Sidi bisa menyaring berdasarkan nama pelaku, jenis aksi, dan tanggal, lalu tekan Tampilkan. Di gambar ini belum ada catatan, jadi daftarnya masih kosong.",
        shot: "log",
        alt: "Halaman Catatan aktivitas dengan filter dan tombol Unduh CSV",
      },
      { text: "Pada baris catatan, buka Lihat perubahan untuk membandingkan isi sebelum dan sesudahnya." },
      { text: "Tekan Unduh CSV kalau Sidi perlu menyimpan salinannya." },
    ],
  },
];
