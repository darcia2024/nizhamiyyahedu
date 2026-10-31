/** Aturan teks catatan yang murni (tanpa modul server), supaya aman dipakai komponen browser maupun server. */
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