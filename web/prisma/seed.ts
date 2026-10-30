import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Kelas yang dijual: Daurah Aqliyah (Mantiq + Ushul Fiqh) dari poster resmi Dar Nizhamiyyah.
// Akun @contoh.test hanya untuk pengembangan dan demo. Tautan video YouTube diisi lewat admin.
async function main() {
  if(process.env.NODE_ENV === "production") throw new Error("Data contoh tidak boleh diisi di production.");
  const admin = await db.user.upsert({
    where: { email: "admin@contoh.test" },
    update: {},
    create: { email: "admin@contoh.test", name: "Admin Contoh", role: "ADMIN" },
  });
  const teacherUser = await db.user.upsert({
    where: { email: "ustadz@contoh.test" },
    update: {},
    create: { email: "ustadz@contoh.test", name: "Ustadz Contoh", role: "TEACHER" },
  });
  const student = await db.user.upsert({
    where: { email: "siswa@contoh.test" },
    update: {},
    create: { email: "siswa@contoh.test", name: "Ahmad Fauzi", role: "STUDENT", whatsapp: "6281234567890" },
  });

  const afrozul = await db.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      displayName: "Ust. Afrozul Mukhoiyirin, Lc., Dipl.",
      alumni: "Mahasiswa pascasarjana Kuliah Ulum Islamiyyah, jurusan Fikih Am",
      bio: "Mengampu dars Ushul Fiqh dengan Matan Waraqat di Dar Nizhamiyyah, Gamaliya, Kairo.",
    },
  });
  const reza = await db.teacherProfile.upsert({
    where: { id: "seed-teacher-2" },
    update: {},
    create: {
      id: "seed-teacher-2",
      displayName: "Ust. M. Reza Pahlevi, Lc., Dipl.",
      alumni: "Mahasiswa S2 jurusan Aqidah, Universitas Al-Azhar Kairo",
      bio: "Mengampu dars Ilmu Mantiq dengan Matan Isaghuji di Dar Nizhamiyyah, Gamaliya, Kairo.",
    },
  });

  const ushul = await upsertCourse({
    slug: "dauroh-ushul-fiqh", title: "Dauroh Ushul Fiqh Nizhamiyyah", titleAr: "الورقات", field: "USHUL_FIQH", price: 70000, sort: 1, teacherId: afrozul.id,
    desc: "Dars ilmu ushul fiqh dengan Matan al-Waraqat karya Imam al-Haramain al-Juwaini, dalam 8 pertemuan. Bagian dari Daurah Aqliyah Dar Nizhamiyyah.",
    sessions: 8,
  });
  const mantiq = await upsertCourse({
    slug: "dauroh-mantiq", title: "Dauroh Mantiq Nizhamiyyah", titleAr: "إيساغوجي", field: "MANTIQ", price: 70000, sort: 2, teacherId: reza.id,
    desc: "Dars ilmu mantiq dengan Matan Isaghuji karya Imam Atsiruddin al-Abhari, dalam 5 pertemuan. Bagian dari Daurah Aqliyah Dar Nizhamiyyah.",
    sessions: 5,
  });
  await upsertCourse({
    slug: "dauroh-aqliyat", title: "Dauroh Aqliyat", titleAr: "الدورة العقلية", field: "AQLIYAT", price: 100000, sort: 0, teacherId: null,
    desc: "Paket Daurah Aqliyah: kelas Mantiq (Matan Isaghuji) dan Ushul Fiqh (Matan Waraqat) sekaligus. Dua ilmu alat yang saling melengkapi untuk memahami cara ulama menetapkan hukum.",
    sessions: 0, bundle: [ushul.id, mantiq.id],
  });

  async function upsertCourse(c: { slug: string; title: string; titleAr: string; field: string; price: number; sort: number; teacherId: string | null; desc: string; sessions: number; bundle?: string[] }) {
    const course = await db.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug, title: c.title, titleAr: c.titleAr, description: c.desc, field: c.field, level: "ULA",
        priceRupiah: c.price, status: "PUBLISHED", sortOrder: c.sort, teacherId: c.teacherId, createdById: admin.id,
        bundleCourseIds: c.bundle ? JSON.stringify(c.bundle) : null,
      },
    });
    if (c.sessions && (await db.lesson.count({ where: { courseId: course.id } })) === 0) {
      for (let p = 1; p <= c.sessions; p++) {
        // Video YouTube menyusul; diisi admin per pertemuan.
        await db.lesson.create({ data: { courseId: course.id, title: `Pertemuan ${p}`, position: p, status: "PUBLISHED", videoUrl: null } });
      }
    }
    return course;
  }

  // Akun user demo sudah punya kelas Ushul Fiqh dan menyelesaikan 3 pertemuan pertama.
  await db.enrollment.upsert({ where: { userId_courseId: { userId: student.id, courseId: ushul.id } }, update: {}, create: { userId: student.id, courseId: ushul.id, source: "PAID" } });
  const first = await db.lesson.findMany({ where: { courseId: ushul.id }, orderBy: { position: "asc" }, take: 3 });
  for (const l of first) {
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: l.id } },
      update: {},
      create: { userId: student.id, lessonId: l.id, completedAt: new Date() },
    });
  }
  console.log("Seed selesai. Akun uji: admin@contoh.test, ustadz@contoh.test, siswa@contoh.test");
}

main().finally(() => db.$disconnect());
