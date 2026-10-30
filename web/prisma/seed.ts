import { PrismaClient } from "@prisma/client";
import { seedCatalog } from "./catalog";

const db = new PrismaClient();

// Data pengembangan lokal: kelas asli (prisma/catalog.ts) + akun uji @contoh.test untuk login uji.
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

  const ids = await seedCatalog(db, { createdById: admin.id, teacherUserIds: { afrozul: teacherUser.id } });
  const ushul = ids["dauroh-ushul-fiqh"];

  // Akun user uji sudah punya kelas Ushul Fiqh dan menyelesaikan 3 pertemuan pertama.
  await db.enrollment.upsert({ where: { userId_courseId: { userId: student.id, courseId: ushul } }, update: {}, create: { userId: student.id, courseId: ushul, source: "PAID" } });
  const first = await db.lesson.findMany({ where: { courseId: ushul }, orderBy: { position: "asc" }, take: 3 });
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
