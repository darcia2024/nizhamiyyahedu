import { createHash } from "node:crypto";
import { normalizePhone } from "@/lib/phone";

export const NOTE_MAX = 5000;

/** Rapikan catatan: NFC, buang karakter kontrol (kecuali baris baru dan tab), potong spasi di ujung. */
export function normalizeNote(raw: string): string {
  return (raw ?? "")
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

const WIB_OFFSET_MS = 7 * 3600 * 1000;

/** Kunci hari (YYYY-MM-DD) menurut WIB. */
export function wibDayKey(d: Date): string {
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Hari beruntun belajar. Tetap berlanjut bila hari ini belum belajar tetapi kemarin sudah. */
export function streakDays(dates: Date[], now: Date = new Date()): number {
  const days = new Set(dates.map(wibDayKey));
  let cursor = new Date(now.getTime());
  if (!days.has(wibDayKey(cursor))) cursor = new Date(cursor.getTime() - 24 * 3600 * 1000);
  let n = 0;
  while (days.has(wibDayKey(cursor))) {
    n += 1;
    cursor = new Date(cursor.getTime() - 24 * 3600 * 1000);
  }
  return n;
}

/** Deret aktivitas N hari terakhir (terlama ke terbaru): jumlah kejadian per hari WIB. */
export function activityByDay(dates: Date[], days: number, now: Date = new Date()): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(wibDayKey(d), (counts.get(wibDayKey(d)) ?? 0) + 1);
  const out: { key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = wibDayKey(new Date(now.getTime() - i * 24 * 3600 * 1000));
    out.push({ key, count: counts.get(key) ?? 0 });
  }
  return out;
}

/** Kursus dianggap selesai bila ada pelajaran tayang dan semuanya sudah ditandai selesai. */
export function courseFinished(total: number, done: number): boolean {
  return total > 0 && done >= total;
}

/** Nomor sertifikat stabil untuk pasangan siswa dan kursus, mis. NZ-2026-3F9A12CC. */
export function certificateNo(userId: string, courseId: string, finishedAt: Date): string {
  const hash = createHash("sha256").update(`${userId}:${courseId}`).digest("hex").slice(0, 8).toUpperCase();
  return `NZ-${finishedAt.getUTCFullYear()}-${hash}`;
}

/** Tautan WhatsApp berisi pesan awal. Null bila nomor kontak belum diisi atau tidak valid. */
export function whatsappLink(contactNumber: string, text: string): string | null {
  const n = normalizePhone(contactNumber);
  if (!n.ok) return null;
  return `https://wa.me/${n.value}?text=${encodeURIComponent(text)}`;
}
