import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Semua nama, harga, dan isi di bawah adalah CONTOH untuk pengembangan. Ganti lewat admin panel.
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

  const t1 = await db.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      displayName: "[Nama Ustadz]",
      alumni: "Alumni [Universitas], [Negara]",
      sanad: "Sanad Ajurrumiyyah dari [nama guru]",
      bio: "Mengajar nahwu dan sharaf. Ganti dengan profil asli.",
    },
  });
  const t2 = await db.teacherProfile.upsert({
    where: { id: "seed-teacher-2" },
    update: {},
    create: {
      id: "seed-teacher-2",
      displayName: "[Nama Ustadzah]",
      alumni: "Alumni [Universitas], [Negara]",
      bio: "Mengajar aqidah dan fiqih ibadah untuk kelas akhwat. Ganti dengan profil asli.",
    },
  });

  const courses = [
    { slug: "matan-al-ajurrumiyyah", title: "Matan al-Ajurrumiyyah", titleAr: "متن الآجرومية", field: "NAHWU", level: "ULA", price: 150000, teacher: t1.id, desc: "Kaidah dasar i'rab dan susunan kalimat Arab, bab demi bab dari matan." },
    { slug: "safinatun-najah", title: "Safinatun Najah", titleAr: "سفينة النجاة", field: "FIQIH", level: "ULA", price: 0, teacher: t1.id, desc: "Thaharah dan shalat menurut mazhab Syafi'i untuk pemula." },
    { slug: "aqidatul-awam", title: "Aqidatul Awam", titleAr: "عقيدة العوام", field: "AQIDAH", level: "ULA", price: 99000, teacher: t2.id, desc: "Lima puluh akidah pokok dalam nazham, dihafal dan dipahami maknanya." },
    { slug: "mutammimah-al-ajurrumiyyah", title: "Mutammimah al-Ajurrumiyyah", titleAr: "متممة الآجرومية", field: "NAHWU", level: "WUSTHA", price: 200000, teacher: t1.id, desc: "Lanjutan Ajurrumiyyah dengan pembahasan yang lebih rinci." },
    { slug: "matan-abi-syuja", title: "Matan Abi Syuja'", titleAr: "متن أبي شجاع", field: "FIQIH", level: "WUSTHA", price: 175000, teacher: t1.id, desc: "Fiqih Syafi'i menengah dari Taqrib Abi Syuja'." },
  ];

  const ajurrumiyyahLessons = [
    ["Muqaddimah dan adab menuntut ilmu", 12], ["Pengertian kalam", 15], ["Tanda-tanda isim", 20],
    ["Tanda-tanda fi'il", 17], ["Tanda huruf", 9], ["Bab al-I'rab", 18],
    ["Tanda-tanda rafa'", 22], ["Tanda-tanda nashab", 24], ["Tanda-tanda khafadh", 16], ["Tanda-tanda jazm", 14],
  ] as const;

  let i = 0;
  for (const c of courses) {
    const course = await db.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug, title: c.title, titleAr: c.titleAr, description: c.desc, field: c.field, level: c.level,
        priceRupiah: c.price, status: "PUBLISHED", sortOrder: i++, teacherId: c.teacher, createdById: admin.id,
      },
    });
    const count = await db.lesson.count({ where: { courseId: course.id } });
    if (count === 0) {
      const list = c.slug === "matan-al-ajurrumiyyah" ? ajurrumiyyahLessons : ajurrumiyyahLessons.slice(0, 6).map(([t, d]) => [`${t} (${c.title})`, d] as const);
      for (let p = 0; p < list.length; p++) {
        const [title, dur] = list[p];
        await db.lesson.create({
          data: {
            courseId: course.id, title, position: p + 1, status: "PUBLISHED", durationMin: dur, isFreePreview: p === 0,
            videoUrl: null, // isi lewat admin; video contoh sengaja tidak dipasang
            matan: JSON.stringify([
              { ar: "الإِعْرَابُ هُوَ تَغْيِيرُ أَوَاخِرِ الكَلِمِ لِاخْتِلَافِ العَوَامِلِ الدَّاخِلَةِ عَلَيْهَا لَفْظًا أَوْ تَقْدِيرًا", id: "I'rab adalah perubahan akhir kata karena berbedanya 'amil yang masuk padanya, baik secara lafaz maupun secara taqdir." },
              { ar: "وَأَقْسَامُهُ أَرْبَعَةٌ: رَفْعٌ، وَنَصْبٌ، وَخَفْضٌ، وَجَزْمٌ", id: "Pembagiannya ada empat: rafa', nashab, khafadh, dan jazm." },
            ]),
            notesMd: "Kata \"perubahan\" di sini berarti berubahnya harakat atau huruf di akhir kata.\nYang berubah bukan maknanya, melainkan **kedudukannya** dalam kalimat.\n\n- Rafa' dan nashab masuk pada isim dan fi'il.\n- Khafadh khusus untuk isim.\n- Jazm khusus untuk fi'il.\n\n[Materi bacaan lengkap dari pengajar.]",
          },
        });
      }
    }
  }

  const ajur = await db.course.findUnique({ where: { slug: "matan-al-ajurrumiyyah" } });
  const safi = await db.course.findUnique({ where: { slug: "safinatun-najah" } });
  if (ajur) await db.enrollment.upsert({ where: { userId_courseId: { userId: student.id, courseId: ajur.id } }, update: {}, create: { userId: student.id, courseId: ajur.id, source: "PAID" } });
  if (safi) await db.enrollment.upsert({ where: { userId_courseId: { userId: student.id, courseId: safi.id } }, update: {}, create: { userId: student.id, courseId: safi.id, source: "FREE" } });

  if (ajur) {
    const first = await db.lesson.findMany({ where: { courseId: ajur.id }, orderBy: { position: "asc" }, take: 5 });
    for (const l of first) {
      await db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: student.id, lessonId: l.id } },
        update: {},
        create: { userId: student.id, lessonId: l.id, completedAt: new Date() },
      });
    }
  }
  console.log("Seed selesai. Akun uji: admin@contoh.test, ustadz@contoh.test, siswa@contoh.test");
}

main().finally(() => db.$disconnect());
