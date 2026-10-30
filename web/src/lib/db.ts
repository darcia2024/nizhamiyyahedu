import { PrismaClient } from "@prisma/client";

// Satu PrismaClient per proses. Di pengembangan disimpan di globalThis supaya hot reload tidak membuka koneksi baru terus.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
