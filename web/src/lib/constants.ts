export const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const FIELDS = ["MANTIQ", "USHUL_FIQH", "AQLIYAT", "NAHWU", "SHARAF", "FIQIH", "AQIDAH", "HADITS", "TAFSIR", "LAINNYA"] as const;
export type Field = (typeof FIELDS)[number];
export const FIELD_LABEL: Record<Field, string> = {
  MANTIQ: "Mantiq",
  USHUL_FIQH: "Ushul Fiqh",
  AQLIYAT: "Mantiq & Ushul Fiqh",
  NAHWU: "Nahwu",
  SHARAF: "Sharaf",
  FIQIH: "Fiqih",
  AQIDAH: "Aqidah",
  HADITS: "Hadits",
  TAFSIR: "Tafsir",
  LAINNYA: "Lainnya",
};
/** Kelas CSS warna per bidang; bidang tanpa warna sendiri memakai nahwu. */
export const FIELD_TONE: Record<Field, "nahwu" | "fiqih" | "aqidah" | "aqliyah"> = {
  MANTIQ: "aqliyah",
  USHUL_FIQH: "aqliyah",
  AQLIYAT: "aqliyah",
  NAHWU: "nahwu",
  SHARAF: "nahwu",
  FIQIH: "fiqih",
  AQIDAH: "aqidah",
  HADITS: "aqidah",
  TAFSIR: "fiqih",
  LAINNYA: "nahwu",
};

export const LEVELS = ["ULA", "WUSTHA", "ULYA"] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABEL: Record<Level, string> = { ULA: "Ula", WUSTHA: "Wustha", ULYA: "Ulya" };
export const LEVEL_NOTE: Record<Level, string> = { ULA: "Pemula", WUSTHA: "Menengah", ULYA: "Lanjutan" };

export const ORDER_STATUS = ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];
export const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

export const ORDER_BADGE: Record<OrderStatus, string> = { PAID: "ok", PENDING: "wait", FAILED: "bad", CANCELLED: "bad", EXPIRED: "off" };

export const ORDER_TTL_HOURS = 24;
export const MAX_PRICE = 50_000_000;
export const WIB = "Asia/Jakarta";
