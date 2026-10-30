export const INSTAGRAM_HANDLE = "nizhamiyyahedu";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export type SocialPost = {
  /** Kode postingan Instagram, dipakai untuk tautan dan nama berkas di public/sosmed. */
  code: string;
  image?: string;
  /** Tanggal unggah (WIB), untuk label. */
  date: string;
  /** Deskripsi gambar untuk pembaca layar. */
  alt: string;
};

/**
 * Postingan Instagram @nizhamiyyahedu yang ditampilkan di galeri beranda.
 * Gambar diunduh sekali ke public/sosmed (tidak memakai tautan CDN Instagram karena kedaluwarsa).
 * Untuk menambah atau mengganti postingan: simpan gambarnya sebagai public/sosmed/ig-<kode>.jpg lalu tambahkan di sini.
 */
export const SOCIAL_POSTS: SocialPost[] = [
  { code: "Dd2txABCI5p", date: "28 September 2026", alt: "Poster kelas Ilmu Ushul Fiqh dengan matan Waraqat, 8 pertemuan" },
  { code: "Dd2tlOuiDEB", date: "28 September 2026", alt: "Poster kelas Ilmu Mantiq dengan matan Isaghuji, 5 pertemuan" },
  { code: "DdtnQ5woE2C", date: "25 September 2026", alt: "Poster seminar keilmuan tentang Ilmu Aqliyat dalam metodologi penetapan hukum, narasumber dan moderator, 27 September 2026" },
  { code: "DdrthOdROOC", date: "24 September 2026", alt: "Poster nadwah ilmiah tentang pentingnya ilmu aqliyat dalam metodologi istinbat, disiarkan langsung di YouTube" },
  { code: "DdoMHHZCEYI", date: "23 September 2026", alt: "Ilustrasi kisah dua ulama, Al-Jurjani dan At-Taftazani, yang diuji dalam debat di hadapan sang penakluk" },
  { code: "DdFEst8EWHh", date: "9 September 2026", alt: "Ulasan jujur dari peserta nadwah tentang acara Nizhamiyyah" },
  { code: "Dc_69LKkcJr", date: "7 September 2026", alt: "Poster nadwah ilmiah tentang hadis dan 65 tahun pengabdian seorang guru besar, dengan foto kegiatan" },
  { code: "Dc1UoyTors6", date: "3 September 2026", alt: "Poster nadwah ilmiah kisah pengabdian 65 tahun perjalanan keilmuan guru besar tafsir Universitas Al-Azhar, 6 September 2026" },
];

export const socialPostUrl = (code: string) => `https://www.instagram.com/p/${code}/`;
export const socialImage = (code: string) => `/sosmed/ig-${code}.jpg`;
