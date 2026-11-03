/** Aturan voucher tanpa akses database, supaya mudah diuji dan dipakai ulang. */
export const VOUCHER_CODE = /^[A-Z0-9_-]{3,30}$/;

export const normalizeVoucherCode = (raw: unknown) => String(raw ?? "").trim().toUpperCase();

/** Pembulatan ke rupiah terdekat. Hasil 0 berarti gratis dan tidak melewati Mayar. */
export const discountedAmount = (price: number, percent: number) => Math.max(0, Math.round((price * (100 - percent)) / 100));

export const parseEmailList = (raw: string | null | undefined) =>
  (raw ?? "").split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

export type VoucherRule = { percent: number; courseId: string | null; allowedEmails: string | null; maxUses: number | null; expiresAt: Date | null; active: boolean };

/** Pesan penolakan, atau null bila voucher boleh dipakai. uses menghitung yang lunas ditambah tagihan aktif. */
export function voucherProblem(v: VoucherRule, ctx: { courseId: string; email: string; uses: number; usedByUser: number; now?: Date }): string | null {
  const now = ctx.now ?? new Date();
  if (!v.active) return "Voucher ini sudah tidak aktif.";
  if (v.expiresAt && v.expiresAt.getTime() < now.getTime()) return "Voucher ini sudah kedaluwarsa.";
  if (v.courseId && v.courseId !== ctx.courseId) return "Voucher ini tidak berlaku untuk kelas ini.";
  const emails = parseEmailList(v.allowedEmails);
  if (emails.length && !emails.includes(ctx.email.trim().toLowerCase())) return "Voucher ini tidak berlaku untuk akunmu.";
  if (ctx.usedByUser > 0) return "Voucher ini sudah pernah kamu pakai.";
  if (v.maxUses !== null && ctx.uses >= v.maxUses) return "Kuota voucher ini sudah habis.";
  return null;
}
