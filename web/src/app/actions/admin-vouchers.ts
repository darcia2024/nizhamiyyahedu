"use server";
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

/** Isian tanggal dan jam di form dianggap WIB. Kosong = null, format salah = undefined. */
function wibDateTime(raw: FormDataEntryValue | null): Date | null | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}:00+07:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function optionalWhole(raw: FormDataEntryValue | null, min: number): number | null | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= min && n <= 1_000_000_000 ? n : undefined;
}

export async function saveVoucher(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const admin = await adminOnly();
  if (!admin) return fail(DENIED);
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  if (!name) return fail("Nama diskon wajib diisi.", { name: "Wajib diisi." });
  const code = normalizeVoucherCode(fd.get("code"));
  if (!code) return fail("Isi kode kupon, atau tekan Generate.", { code: "Wajib diisi." });
  if (!VOUCHER_CODE.test(code)) return fail("Kode kupon 3 sampai 30 karakter: huruf, angka, tanda - atau _.", { code: "Format kode belum benar." });

  const discountType = fd.get("discountType") === "NOMINAL" ? "NOMINAL" : "PERCENT";
  const value = Number(fd.get("value"));
  if (discountType === "PERCENT" && (!Number.isInteger(value) || value < 1 || value > 100)) return fail("Besaran persen harus angka bulat 1 sampai 100.", { value: "Isi 1 sampai 100." });
  if (discountType === "NOMINAL" && (!Number.isInteger(value) || value < 1 || value > 1_000_000_000)) return fail("Besaran rupiah harus angka bulat minimal 1.", { value: "Isi nominal rupiah." });

  const minPurchase = optionalWhole(fd.get("minPurchase"), 0);
  if (minPurchase === undefined) return fail("Minimum pembelian harus angka bulat, atau dikosongkan.", { minPurchase: "Periksa lagi angkanya." });

  const pickedCourses = fd.get("productType") === "SELECTED" ? [...new Set(fd.getAll("courseIds").map(String).filter(Boolean))] : [];
  if (fd.get("productType") === "SELECTED" && !pickedCourses.length) return fail("Centang minimal satu kelas.");
  if (pickedCourses.length && (await db.course.count({ where: { id: { in: pickedCourses } } })) !== pickedCourses.length) return fail("Ada kelas yang tidak ditemukan. Muat ulang halaman.");

  const singleUse = fd.get("couponType") === "SINGLE";
  const maxUses = optionalWhole(fd.get("maxUses"), 1);
  if (maxUses === undefined) return fail("Batas pemakaian harus angka bulat minimal 1, atau dikosongkan.", { maxUses: "Minimal 1." });

  const emails = fd.get("customerType") === "SELECTED" ? parseEmailList(String(fd.get("allowedEmails") ?? "")) : [];
  if (fd.get("customerType") === "SELECTED" && !emails.length) return fail("Isi email pelanggan yang boleh memakai kupon ini.", { allowedEmails: "Wajib diisi." });
  const badEmail = emails.find((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (badEmail) return fail(`Email belum benar: ${badEmail}`, { allowedEmails: "Periksa lagi daftar emailnya." });

  const startsAt = wibDateTime(fd.get("startsAt"));
  const expiresAt = wibDateTime(fd.get("expiresAt"));
  if (startsAt === undefined || expiresAt === undefined) return fail("Tanggal belum benar.");
  if (startsAt && expiresAt && expiresAt <= startsAt) return fail("Tanggal kedaluwarsa harus setelah waktu mulai.");

  try {
    const v = await db.voucher.create({
      data: {
        code, name, discountType, percent: discountType === "PERCENT" ? value : 0, amountOff: discountType === "NOMINAL" ? value : null,
        minPurchase: minPurchase || null, singleUse, courseIds: pickedCourses.length ? JSON.stringify(pickedCourses) : null, allowedEmails: emails.join(", ") || null, maxUses, startsAt, expiresAt,
      },
    });
    await audit(admin, "VOUCHER_CREATE", "Voucher", v.id, { after: { code, name, discountType, value, courses: pickedCourses, singleUse, maxUses, minPurchase, startsAt, expiresAt, emails: emails.length } });
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
