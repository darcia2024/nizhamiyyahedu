import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { demoMode } from "@/lib/base-path";

// Deployment demo di Vercel: sistem file hanya bisa ditulis di /tmp, jadi database contoh
// (prisma/demo.db, dibuat saat build) disalin ke sana sekali per instance. Datanya tidak permanen.
if (demoMode) {
  const url = process.env.DATABASE_URL ?? "";
  const target = url.startsWith("file:/tmp/") ? url.slice(5) : "";
  const source = join(process.cwd(), "prisma", "demo.db");
  if (target && !existsSync(target) && existsSync(source)) copyFileSync(source, target);
}

const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
