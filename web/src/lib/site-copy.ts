/** Public copy managed by superadmin. Keys stay stable for stored content versions. */
export const SITE_COPY_DEFAULTS = {
  heroAccent: "Tumbuh ilmunya.",
  heroPrimary: "Jelajahi kursus",
  heroPreview: "Coba pelajaran",
  searchKicker: "Mulai dari yang kamu butuhkan",
  searchTitle: "Sudah punya kitab pilihan?",
  searchPlaceholder: "Cari kitab atau bidang ilmu",
  journeyKicker: "Cara belajar",
  journeyTitle: "Belajar dengan alur yang jelas.",
  journeyText: "Pilih satu kitab, kenali pengajarnya, lalu mulai. Materinya tersusun supaya kamu bisa fokus memahami.",
  pathKicker: "Peta belajar",
  pathTitle: "Naik jenjang tanpa kehilangan arah.",
  pathText: "Kursus dikelompokkan per bidang ilmu dan tingkat kesulitan. Mulai dari fondasi, naik kalau sudah siap.",
  catalogKicker: "Pilihan kursus",
  catalogTitle: "Satu kitab. Satu langkah lebih paham.",
  catalogText: "Kenali materinya, lihat silabusnya, dan pilih tempat mulai yang sesuai dengan kemampuan kamu.",
  teacherKicker: "Pengajar",
  teacherTitle: "Dibimbing oleh orang yang memahami kitabnya.",
  faqKicker: "Masih penasaran?",
  faqTitle: "Sebelum mulai belajar.",
  faqText: "Jawaban singkat sebelum kamu mulai belajar.",
  ctaTitle: "Mulai dari satu kitab.",
  ctaAccent: "Lanjut sesuai ritme kamu.",
  ctaText: "Intip silabusnya, coba satu pelajaran gratis, baru putuskan.",
  socialKicker: "Sosial media",
  socialTitle: "Intip kegiatan kami di Instagram.",
  socialText: "Kelas, nadwah ilmiah, dan kabar terbaru dari Nizhamiyyah Edu di Mesir. Ikuti supaya nggak ketinggalan jadwal berikutnya.",
  instagramHandle: "nizhamiyyahedu",
  footerDescription: "Kelas kitab daring dengan kurikulum berjenjang ala pesantren dan universitas di Timur Tengah.",
  footerCopyright: "Nizhamiyyah Edu · belajarditimurtengah.com",
};
export type SiteCopy = typeof SITE_COPY_DEFAULTS;
export const COPY_GROUPS: { title: string; fields: { key: keyof SiteCopy; label: string }[] }[] = [
  { title: "Tombol beranda", fields: [{key:"heroAccent",label:"Judul baris kedua"},{key:"heroPrimary",label:"Tombol katalog"},{key:"heroPreview",label:"Tombol pratinjau"}] },
  { title: "Pencarian", fields: [{key:"searchKicker",label:"Label"},{key:"searchTitle",label:"Judul"},{key:"searchPlaceholder",label:"Petunjuk pencarian"}] },
  { title: "Cara belajar", fields: [{key:"journeyKicker",label:"Label"},{key:"journeyTitle",label:"Judul"},{key:"journeyText",label:"Penjelasan"}] },
  { title: "Peta belajar", fields: [{key:"pathKicker",label:"Label"},{key:"pathTitle",label:"Judul"},{key:"pathText",label:"Penjelasan"}] },
  { title: "Katalog", fields: [{key:"catalogKicker",label:"Label"},{key:"catalogTitle",label:"Judul"},{key:"catalogText",label:"Penjelasan"}] },
  { title: "Pengajar", fields: [{key:"teacherKicker",label:"Label"},{key:"teacherTitle",label:"Judul"}] },
  { title: "Tanya jawab", fields: [{key:"faqKicker",label:"Label"},{key:"faqTitle",label:"Judul"},{key:"faqText",label:"Penjelasan"}] },
  { title: "Ajakan akhir", fields: [{key:"ctaTitle",label:"Judul baris pertama"},{key:"ctaAccent",label:"Judul baris kedua"},{key:"ctaText",label:"Penjelasan"}] },
  { title: "Instagram", fields: [{key:"socialKicker",label:"Label"},{key:"socialTitle",label:"Judul"},{key:"socialText",label:"Penjelasan"},{key:"instagramHandle",label:"Username Instagram (tanpa @)"}] },
  { title: "Footer", fields: [{key:"footerDescription",label:"Tentang website"},{key:"footerCopyright",label:"Nama dan keterangan hak cipta"}] },
];

export function validateSiteCopy(fd: FormData): { ok: true; value: SiteCopy } | { ok: false; error: string; field: string } {
  const value = {} as SiteCopy;
  for (const key of Object.keys(SITE_COPY_DEFAULTS) as (keyof SiteCopy)[]) {
    const text = String(fd.get(key) ?? "").trim();
    if (!text || text.length > 600) return { ok: false, error: "Isi 1 sampai 600 karakter.", field: key };
    value[key] = text;
  }
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(value.instagramHandle)) return { ok: false, error: "Username Instagram tidak valid.", field: "instagramHandle" };
  return { ok: true, value };
}
