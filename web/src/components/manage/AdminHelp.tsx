import { ManageHeading } from "./ManageUI";
import { withBase } from "@/lib/base-path";
import { PrintButton } from "./PrintButton";

type Guide = { title: string; image: string; alt: string; steps: string[]; note?: string };

const GUIDES: Guide[] = [
  { title: "Menambah kursus baru dan menayangkannya", image: "kursus", alt: "Daftar kursus di admin dengan tombol Buat kursus di kanan atas",
    steps: ["Buka menu Kursus lalu pilih Buat kursus.", "Isi judul Latin, judul Arab, bidang ilmu, jenjang, pengajar, deskripsi, dan harga. Alamat halaman terisi otomatis dari judul.", "Simpan. Kursus baru selalu berstatus Draf dan belum terlihat pengunjung.", "Tambahkan minimal satu pelajaran tayang, lalu pilih Tayangkan di detail kursus."],
    note: "Tombol Tayangkan menyebut apa yang masih kurang bila syaratnya belum lengkap." },
  { title: "Menambah dan mengurutkan pelajaran, mengisi matan dan catatan", image: "kursus-detail", alt: "Halaman detail kursus berisi form informasi kursus",
    steps: ["Buka detail kursus lalu pilih Tambah pelajaran.", "Isi judul, durasi, dan alamat video YouTube. Tambahkan matan Arab beserta terjemahnya per kalimat, lalu catatan pengajar dalam Markdown.", "Ubah status pelajaran ke Tayang bila sudah siap.", "Atur urutan dengan seret dan lepas, atau tombol Naikkan dan Turunkan memakai keyboard. Urutan langsung tersimpan.", "Tandai satu pelajaran sebagai pratinjau gratis agar bisa dicoba tamu."] },
  { title: "Mengganti harga kursus", image: "kursus-detail", alt: "Kolom Harga pada form informasi kursus",
    steps: ["Buka detail kursus, ubah kolom Harga (0 berarti gratis, maksimal Rp 50.000.000).", "Pilih Simpan perubahan."],
    note: "Pembeli lama tidak terpengaruh. Bila sudah ada order lunas, perubahan harga tercatat di Catatan aktivitas." },
  { title: "Mengarsipkan dan memulihkan kursus", image: "kursus", alt: "Daftar kursus dengan tombol Kelola di setiap baris",
    steps: ["Buka detail kursus, lalu bagian Arsip dan hapus.", "Pilih Arsipkan dan ketik judul kursus untuk konfirmasi.", "Kursus hilang dari katalog, tetapi siswa yang sudah terdaftar tetap bisa belajar.", "Untuk mengembalikan, buka kursus terarsip lalu pilih Pulihkan."],
    note: "Hapus permanen hanya untuk admin, hanya pada kursus terarsip, dan ditolak bila ada pembeli." },
  { title: "Mengubah nomor WhatsApp dan teks tanya jawab", image: "konten", alt: "Halaman Isi website berisi beranda, kontak, dan tanya jawab",
    steps: ["Buka Isi website.", "Ubah WhatsApp, email, atau jam layanan di bagian Kontak pengelola lalu simpan.", "Ubah atau urutkan pertanyaan di bagian Tanya jawab. Kosongkan pertanyaan dan jawaban untuk menghapusnya.", "Bila salah, buka Riwayat versi di bagian yang sama lalu pilih Pulihkan versi ini."],
    note: "Setiap penyimpanan membuat versi baru, dan pemulihan tidak menghapus riwayat." },
  { title: "Mengubah dan menerbitkan kebijakan privasi, syarat, dan refund", image: "konten", alt: "Bagian dokumen legal di halaman Isi website",
    steps: ["Buka Isi website lalu gulir ke dokumen yang ingin diubah.", "Edit isi di kolom Markdown dan periksa pratinjaunya.", "Pilih Terbitkan versi baru. Versi lama tetap tersimpan di Versi terdahulu."],
    note: "Draf awal wajib ditinjau pengelola, sebaiknya juga penasihat hukum, sebelum diterbitkan." },
  { title: "Menjadikan seseorang pengajar atau admin", image: "pengguna", alt: "Daftar pengguna dengan pencarian dan filter peran",
    steps: ["Orangnya harus sudah pernah masuk pakai Google.", "Buka User, cari nama atau email, lalu buka akunnya.", "Pilih peran baru, tulis alasan (wajib bila ke atau dari Admin), centang konfirmasi, lalu simpan.", "Untuk pengajar, buka Pengajar dan hubungkan profilnya ke akun itu."],
    note: "Peran akun sendiri tidak dapat diubah dan harus selalu ada minimal satu admin." },
  { title: "Membuka akses kursus secara manual", image: "pengguna", alt: "Halaman user tempat akses kursus dikelola",
    steps: ["Buka User lalu akun yang bersangkutan.", "Pada bagian akses kursus, pilih kursusnya dan tulis alasan.", "Simpan. Tindakan tercatat di Catatan aktivitas."],
    note: "Pakai hanya bila ada bukti pembayaran atau alasan yang sah, misalnya beasiswa. Untuk mencabut akses, pilih Nonaktifkan akses dan tulis alasannya." },
  { title: "Memeriksa pembayaran yang nyangkut", image: "pembayaran", alt: "Daftar pembayaran dengan tab status",
    steps: ["Buka Pembayaran dan pilih tab Menunggu, atau lihat kartu Perlu perhatian di Ringkasan.", "Buka tagihannya lalu pilih Cek ulang ke Mayar.", "Bila Mayar menyatakan lunas, akses terbuka otomatis.", "Bila bukti pembayaran sah tetapi akses belum terbuka, pilih Buka akses manual dan tulis alasan."],
    note: "Refund dilakukan di dashboard Mayar. Gunakan kolom catatan internal untuk mencatatnya." },
  { title: "Membaca Ringkasan dan Catatan aktivitas", image: "ringkasan", alt: "Halaman Ringkasan berisi kartu angka pengguna, pendaftar, dan pemasukan",
    steps: ["Buka Ringkasan untuk melihat pengguna baru, pendaftar per kursus, pemasukan, dan hal yang perlu perhatian.", "Buka Catatan aktivitas untuk melihat siapa mengubah apa dan kapan. Saring menurut aksi, tanggal, atau pelaku.", "Pilih Unduh CSV untuk menyimpan salinannya."],
    note: "Pemasukan adalah jumlah kotor sebelum biaya Mayar." },
];

export function AdminHelp() {
  return <>
    <ManageHeading title="Panduan pengelola" text="Sepuluh tugas yang paling sering dikerjakan, lengkap dengan tampilan layar.">
      <PrintButton />
    </ManageHeading>
    {GUIDES.map((g, i) => (
      <section className="card pad help-guide" key={g.title}>
        <p className="eyebrow">Panduan {i + 1}</p>
        <h2>{g.title}</h2>
        <ol className="help-steps">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        {g.note && <p className="small muted"><strong>Catatan:</strong> {g.note}</p>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="help-shot" src={withBase(`/bantuan/${g.image}.png`)} alt={g.alt} width={1280} height={760} loading="lazy" />
      </section>
    ))}
  </>;
}
