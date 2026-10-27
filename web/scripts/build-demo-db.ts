// Membuat prisma/demo.db berisi data contoh untuk deployment demo (DEMO_MODE=1).
// Saat berjalan, src/lib/db.ts menyalin file ini ke /tmp karena sistem file Vercel hanya-baca.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("prisma", "demo.db");
for (const f of [file, `${file}-journal`]) rmSync(f, { force: true });

// Seed menolak NODE_ENV=production; database ini memang hanya berisi data contoh.
const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "file:./demo.db", NODE_ENV: "development" };
const tsx = resolve("node_modules", "tsx", "dist", "cli.mjs");
for (const script of ["scripts/prepare-db.ts", "prisma/seed.ts"]) {
  execFileSync(process.execPath, [tsx, script], { env, stdio: "inherit" });
}
console.log("Database demo siap:", file);
