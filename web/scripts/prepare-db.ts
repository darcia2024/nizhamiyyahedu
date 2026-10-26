import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
loadEnvConfig(process.cwd());
const db=new PrismaClient();
async function main() {
try {
  const url=process.env.DATABASE_URL??"";
  if(!url.startsWith("file:")) throw new Error("Gunakan skema database yang cocok dengan provider hosting.");
  const filename=resolve("prisma",url.slice(5));
  mkdirSync(dirname(filename),{recursive:true});
  appendFileSync(filename,"");
  execFileSync(process.execPath,[resolve("node_modules/prisma/build/index.js"),"db","push","--skip-generate"],{stdio:"inherit"});
  // Invariant PRD 10.1. Also present in production migration SQL.
  await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Order_one_pending" ON "Order" ("userId", "courseId") WHERE "status" = \'PENDING\'');
  console.log("Database siap. Batas satu tagihan aktif diterapkan.");
} finally { await db.$disconnect(); }
}
main().catch(()=>{ console.error("Persiapan database gagal. Periksa konfigurasi dan duplikat order PENDING."); process.exitCode=1; });
