"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, type ActionResult } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth-guard";
import { normalizeVoucherCode, parseEmailList, VOUCHER_CODE } from "@/lib/vouchers";

async function adminOnly() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}
const DENIED = "Hanya admin yang boleh melakukan ini.";

export async function saveVoucher(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail(DENIED);
  const code = normalizeVoucherCode(fd.get("code")) || `NZ-${randomBytes(4).toString("hex").toUpperCase()}`;
  if (!VOUCHER_CODE.test(code)) return fail("Kode 3 sampai 30 karakter: huruf, angka, tanda - atau _.", { code: "Format kode belum benar." });
  const percent = Number(fd.get("percent"));
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) return fail("Diskon harus angka bulat 1 sampai 100.", { percent: "Isi 1 sampai 100." });
  const courseId = String(fd.get("courseId") ?? "") || null;
  if (courseId && !(await db.course.findUnique({ where: { id: courseId }, select: { id: true } }))) return fail("Kursus tidak ditemukan.", { courseId: "Kursus tidak ditemukan." });
  const emails = parseEmailList(String(fd.get("allowedEmails") ?? ""));
  const badEmail = emails.find((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (badEmail) return fail(`Email belum benar: ${badEmail}`, { allowedEmails: "Periksa lagi daftar emailnya." });
  const rawMax = String(fd.get("maxUses") ?? "").trim();
  const maxUses = rawMax ? Number(rawMax) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return fail("Kuota harus angka bulat minimal 1, atau dikosongkan.", { maxUses: "Minimal 1." });
  const rawDate = String(fd.get("expiresAt") ?? "").trim();
  if (rawDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return fail("Tanggal belum benar.");
  const expiresAt = rawDate ? new Date(`${rawDate}T23:59:59+07:00`) : null;
  try {
    const v = await db.voucher.create({ data: { code, percent, courseId, allowedEmails: emails.join(", ") || null, maxUses, expiresAt } });
    await audit(admin, "VOUCHER_CREATE", "Voucher", v.id, { after: { code, percent, courseId, maxUses, expiresAt, emails: emails.length } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("Kode ini sudah dipakai voucher lain.", { code: "Kode sudah dipakai." });
    throw e;
  }
  revalidatePath("/admin/voucher");
  return { ok: true, message: `Voucher ${code} dibuat.` };
}

export async function setVoucherActive(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail(DENIED);
  const id = String(fd.get("id") ?? "");
  const active = fd.get("active") === "1";
  const v = await db.voucher.findUnique({ where: { id } });
  if (!v) return fail("Voucher tidak ditemukan.");
  await db.voucher.update({ where: { id }, data: { active } });
  await audit(admin, "VOUCHER_STATUS", "Voucher", id, { before: { code: v.code, active: v.active }, after: { active } });
  revalidatePath("/admin/voucher");
  return { ok: true, message: active ? "Voucher diaktifkan." : "Voucher dinonaktifkan." };
}

/** Voucher yang pernah dipakai tidak dihapus, supaya riwayat diskon di tagihan tetap utuh. */
export async function deleteVoucher(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail(DENIED);
  const id = String(fd.get("id") ?? "");
  const v = await db.voucher.findUnique({ where: { id }, select: { code: true, _count: { select: { orders: true } } } });
  if (!v) return fail("Voucher tidak ditemukan.");
  if (v._count.orders) return fail("Voucher ini sudah pernah dipakai. Nonaktifkan saja.");
  await db.voucher.delete({ where: { id } });
  await audit(admin, "VOUCHER_DELETE", "Voucher", id, { before: { code: v.code } });
  revalidatePath("/admin/voucher");
  return { ok: true, message: "Voucher dihapus." };
}
