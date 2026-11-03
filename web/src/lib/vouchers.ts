/** Aturan voucher tanpa akses database, supaya mudah diuji dan dipakai ulang. */
export const VOUCHER_CODE = /^[A-Z0-9_-]{3,30}$/;

export const normalizeVoucherCode = (raw: unknown) => String(raw ?? "").trim().toUpperCase();

export type VoucherDiscount = { discountType: string; percent: number; amountOff: number | null };

/** Harga setelah diskon, dibulatkan ke rupiah terdekat. Hasil 0 berarti gratis dan tidak melewati Mayar. */
export function discountedAmount(price: number, d: VoucherDiscount): number {
  if (d.discountType === "NOMINAL") return Math.max(0, price - (d.amountOff ?? 0));
  return Math.max(0, Math.round((price * (100 - d.percent)) / 100));
}

export const discountLabel = (d: VoucherDiscount) =>
  d.discountType === "NOMINAL" ? `Rp ${new Intl.NumberFormat("id-ID").format(d.amountOff ?? 0)}` : `${d.percent}%`;

export const parseEmailList = (raw: string | null | undefined) =>
  (raw ?? "").split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

export type VoucherRule = {
  courseId: string | null; allowedEmails: string | null; maxUses: number | null; minPurchase: number | null;
  singleUse: boolean; startsAt: Date | null; expiresAt: Date | null; active: boolean;
};

/** Pesan penolakan, atau null bila voucher boleh dipakai. uses dan usedByUser menghitung yang lunas ditambah tagihan aktif. */
export function voucherProblem(v: VoucherRule, ctx: { courseId: string; price: number; email: string; uses: number; usedByUser: number; now?: Date }): string | null {
  const now = (ctx.now ?? new Date()).getTime();
  if (!v.active) return "Voucher ini sudah tidak aktif.";
  if (v.startsAt && v.startsAt.getTime() > now) return "Voucher ini belum bisa dipakai.";
  if (v.expiresAt && v.expiresAt.getTime() < now) return "Voucher ini sudah kedaluwarsa.";
  if (v.courseId && v.courseId !== ctx.courseId) return "Voucher ini tidak berlaku untuk kelas ini.";
  if (v.minPurchase && ctx.price < v.minPurchase) return `Voucher ini hanya untuk pembelian minimal Rp ${new Intl.NumberFormat("id-ID").format(v.minPurchase)}.`;
  const emails = parseEmailList(v.allowedEmails);
  if (emails.length && !emails.includes(ctx.email.trim().toLowerCase())) return "Voucher ini tidak berlaku untuk akunmu.";
  if (v.singleUse && ctx.usedByUser > 0) return "Voucher ini sudah pernah kamu pakai.";
  if (v.maxUses !== null && ctx.uses >= v.maxUses) return "Kuota voucher ini sudah habis.";
  return null;
}
