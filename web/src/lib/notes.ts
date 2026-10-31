import { NOTE_MAX, normalizeNote } from "@/lib/note-text";

export const NOTE_TITLE_MAX = 120;
/** Catatan bebas boleh lebih panjang daripada catatan per pelajaran (NOTE_MAX). */
export const FREE_NOTE_MAX = 20000;
export const MAX_NOTES_PER_USER = 500;
export { NOTE_MAX };

/** Satu baris di daftar catatan. `cid` stabil di browser; `serverId` kosong sampai catatan baru pertama kali tersimpan. */
export type NoteItem = {
  cid: string;
  kind: "free" | "lesson";
  /** id Note (free) atau id pelajaran (lesson); null untuk catatan baru yang belum tersimpan. */
  serverId: string | null;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
  courseId: string | null;
  courseTitle: string | null;
  /** Hanya catatan pelajaran. */
  lesson?: { title: string; position: number; courseSlug: string };
};

/** Judul satu baris: baris baru jadi spasi, dirapikan, dipotong. */
export function cleanTitle(raw: unknown): string {
  return normalizeNote(String(raw ?? "")).replace(/\s*\n\s*/g, " ").slice(0, NOTE_TITLE_MAX);
}

/** Isi catatan: rapikan seperti catatan pelajaran. Mengembalikan null bila melebihi batas. */
export function cleanBody(raw: unknown, max: number): string | null {
  const body = normalizeNote(String(raw ?? ""));
  return body.length > max ? null : body;
}
