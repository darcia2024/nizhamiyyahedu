import type { PrismaClient } from "@prisma/client";

// Kelas yang dijual: Daurah Aqliyah (Mantiq + Ushul Fiqh) dari poster resmi Dar Nizhamiyyah.
// Dipakai seed lokal (prisma/seed.ts) dan data awal production (prisma/seed-production.ts).
// Semua upsert tidak menimpa data yang sudah diubah admin: kursus dan pengajar yang sudah ada dibiarkan,
// pelajaran hanya dibuat bila kursus belum punya pelajaran sama sekali.

type CourseSeed = {
  slug: string; title: string; titleAr: string; field: string; price: number; sort: number; desc: string; sessions: number;
  teacher?: "afrozul" | "reza"; bundle?: string[];
  /** Thumbnail kelas 16:9 untuk kartu dan halaman detail (public/kelas). */
  image?: string;
  /** Rekaman YouTube (tidak publik) per pertemuan: [id video, durasi menit]. */
  videos?: [string, number][];
};

export const TEACHERS = {
  afrozul: {
    id: "teacher-afrozul",
    displayName: "Ust. Afrozul Mukhoiyirin, Lc., Dipl.",
    alumni: "Mahasiswa pascasarjana Kuliah Ulum Islamiyyah, jurusan Fikih Am",
    bio: "Mengampu dars Ushul Fiqh dengan Matan Waraqat di Dar Nizhamiyyah, Gamaliya, Kairo.",
    photoUrl: "/kelas/afrozul.jpg",
  },
  reza: {
    id: "teacher-reza",
    displayName: "Ust. M. Reza Pahlevi, Lc., Dipl.",
    alumni: "Mahasiswa S2 jurusan Aqidah, Universitas Al-Azhar Kairo",
    bio: "Mengampu dars Ilmu Mantiq dengan Matan Isaghuji di Dar Nizhamiyyah, Gamaliya, Kairo.",
    photoUrl: "/kelas/reza.jpg",
  },
};

export const COURSES: CourseSeed[] = [
  {
    slug: "dauroh-ushul-fiqh", title: "Dauroh Ushul Fiqh Nizhamiyyah", titleAr: "الورقات", field: "USHUL_FIQH", price: 70000, sort: 1, teacher: "afrozul",
    desc: "Dars ilmu ushul fiqh dengan Matan al-Waraqat karya Imam al-Haramain al-Juwaini, dalam 8 pertemuan. Bagian dari Daurah Aqliyah Dar Nizhamiyyah.",
    sessions: 8, image: "/kelas/thumb-ushul-fiqh.jpg",
    videos: [["AeVUzyzxDaM", 61], ["imYDWt7k_1I", 116], ["RvkYATLEVSU", 97], ["Uf2G5X9KTGk", 100]],
  },
  {
    slug: "dauroh-mantiq", title: "Dauroh Mantiq Nizhamiyyah", titleAr: "إيساغوجي", field: "MANTIQ", price: 70000, sort: 2, teacher: "reza",
    desc: "Dars ilmu mantiq dengan Matan Isaghuji karya Imam Atsiruddin al-Abhari, dalam 5 pertemuan. Bagian dari Daurah Aqliyah Dar Nizhamiyyah.",
    sessions: 5, image: "/kelas/thumb-mantiq.jpg",
    videos: [["97lvSGc_Rp4", 112], ["umo8GS8TZ4E", 123], ["kSAVzow9dw8", 91], ["jStHUpZr21s", 91]],
  },
  {
    slug: "dauroh-aqliyat", title: "Dauroh Aqliyat", titleAr: "الدورة العقلية", field: "AQLIYAT", price: 100000, sort: 0,
    desc: "Paket Daurah Aqliyah: kelas Mantiq (Matan Isaghuji) dan Ushul Fiqh (Matan Waraqat) sekaligus. Dua ilmu alat yang saling melengkapi untuk memahami cara ulama menetapkan hukum.",
    sessions: 0, bundle: ["dauroh-ushul-fiqh", "dauroh-mantiq"],
  },
];

/** Isi pengajar dan kelas. teacherUserIds menautkan profil pengajar ke akun (hanya dipakai seed lokal). */
export async function seedCatalog(db: PrismaClient, opts: { createdById?: string; teacherUserIds?: Partial<Record<keyof typeof TEACHERS, string>> } = {}) {
  const teacherIds: Record<string, string> = {};
  for (const [key, t] of Object.entries(TEACHERS) as [keyof typeof TEACHERS, (typeof TEACHERS)["afrozul"]][]) {
    const userId = opts.teacherUserIds?.[key];
    const existing = userId ? await db.teacherProfile.findUnique({ where: { userId } }) : await db.teacherProfile.findUnique({ where: { id: t.id } });
    const profile = existing ?? (await db.teacherProfile.create({ data: { ...t, userId: userId ?? null } }));
    // Foto hanya diisi bila masih kosong; foto yang diunggah admin tidak ditimpa.
    if (!profile.photoUrl) await db.teacherProfile.update({ where: { id: profile.id }, data: { photoUrl: t.photoUrl } });
    teacherIds[key] = profile.id;
  }

  const ids: Record<string, string> = {};
  for (const c of COURSES) {
    const course = await db.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug, title: c.title, titleAr: c.titleAr, description: c.desc, field: c.field, level: "ULA",
        priceRupiah: c.price, status: "PUBLISHED", sortOrder: c.sort, teacherId: c.teacher ? teacherIds[c.teacher] : null,
        createdById: opts.createdById ?? null,
        bundleCourseIds: c.bundle ? JSON.stringify(c.bundle.map((slug) => ids[slug]).filter(Boolean)) : null,
      },
    });
    ids[c.slug] = course.id;
    if (c.image && !course.coverUrl) await db.course.update({ where: { id: course.id }, data: { coverUrl: c.image } });
    if (c.sessions && (await db.lesson.count({ where: { courseId: course.id } })) === 0) {
      for (let p = 1; p <= c.sessions; p++) {
        // Pertemuan yang belum ada rekamannya tampil "video menyusul"; diisi admin saat rekaman diupload.
        const [videoId, durationMin] = c.videos?.[p - 1] ?? [];
        await db.lesson.create({
          data: {
            // Pertemuan 1 bisa ditonton gratis tanpa beli, supaya calon user bisa mencoba dulu.
            courseId: course.id, title: `Pertemuan ${p}`, position: p, status: "PUBLISHED", isFreePreview: p === 1 && !!videoId,
            videoUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null, durationMin: durationMin ?? null,
          },
        });
      }
    }
  }
  return ids;
}
