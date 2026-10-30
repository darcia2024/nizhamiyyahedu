import { PrismaClient } from "@prisma/client";
import { seedCatalog } from "./catalog";

// Data awal production (Supabase), dijalankan otomatis setiap build Vercel.
// Aman diulang: hanya mengisi yang belum ada, perubahan admin tidak ditimpa. Tidak membuat akun uji.
const db = new PrismaClient();

async function main() {
  await seedCatalog(db);
  console.log("Data awal production siap: 3 kelas Daurah Aqliyah.");
}

main()
  .catch((e) => { console.error("Data awal production gagal:", e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
