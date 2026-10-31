import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { readJson, sameOrigin } from "@/lib/origin";
import { FREE_NOTE_MAX, MAX_NOTES_PER_USER, cleanBody, cleanTitle } from "@/lib/notes";
import { ownedCourseId } from "@/lib/notes-server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const err = (status: number, message: string) => NextResponse.json({ ok: false, error: message }, { status, headers: noStore });

/** Buat catatan bebas baru. Dipanggil saat catatan baru pertama kali berisi sesuatu. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return err(403, "Permintaan ditolak.");
  const user = await getCurrentUser();
  if (!user) return err(401, "Sesimu sudah berakhir. Masuk lagi dulu ya.");
  if (!(await rateLimit(`note:${user.id}`, 180, 60))) return err(429, "Terlalu cepat. Tunggu sebentar.");

  const json = await readJson(req);
  if (!json) return err(400, "Data tidak valid.");
  const body = cleanBody(json.body, FREE_NOTE_MAX);
  if (body === null) return err(400, `Catatan terlalu panjang. Maksimal ${FREE_NOTE_MAX.toLocaleString("id-ID")} karakter.`);
  const courseId = "courseId" in json ? await ownedCourseId(user.id, json.courseId) : null;
  if (courseId === undefined) return err(400, "Kelas tidak valid.");
  if ((await db.note.count({ where: { userId: user.id } })) >= MAX_NOTES_PER_USER) return err(400, `Batas ${MAX_NOTES_PER_USER} catatan tercapai. Hapus yang tidak dipakai dulu.`);

  const note = await db.note.create({
    data: { userId: user.id, title: cleanTitle(json.title), body, pinned: json.pinned === true, courseId },
    select: { id: true, updatedAt: true },
  });
  return NextResponse.json({ ok: true, id: note.id, updatedAt: note.updatedAt.toISOString() }, { status: 201, headers: noStore });
}
