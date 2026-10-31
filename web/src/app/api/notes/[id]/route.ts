import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { readJson, sameOrigin } from "@/lib/origin";
import { FREE_NOTE_MAX, cleanBody, cleanTitle } from "@/lib/notes";
import { ownedCourseId } from "@/lib/notes-server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const err = (status: number, message: string) => NextResponse.json({ ok: false, error: message }, { status, headers: noStore });

type Ctx = { params: Promise<{ id: string }> };

/** Ubah sebagian isi catatan bebas: judul, isi, sematan, atau kelas. Hanya milik sendiri. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return err(403, "Permintaan ditolak.");
  const user = await getCurrentUser();
  if (!user) return err(401, "Sesimu sudah berakhir. Masuk lagi dulu ya.");
  if (!(await rateLimit(`note:${user.id}`, 180, 60))) return err(429, "Terlalu cepat. Tunggu sebentar.");
  const { id } = await params;

  const json = await readJson(req);
  if (!json) return err(400, "Data tidak valid.");
  const data: { title?: string; body?: string; pinned?: boolean; courseId?: string | null } = {};
  if ("title" in json) data.title = cleanTitle(json.title);
  if ("body" in json) {
    const body = cleanBody(json.body, FREE_NOTE_MAX);
    if (body === null) return err(400, `Catatan terlalu panjang. Maksimal ${FREE_NOTE_MAX.toLocaleString("id-ID")} karakter.`);
    data.body = body;
  }
  if ("pinned" in json) data.pinned = json.pinned === true;
  if ("courseId" in json) {
    const courseId = await ownedCourseId(user.id, json.courseId);
    if (courseId === undefined) return err(400, "Kelas tidak valid.");
    data.courseId = courseId;
  }

  // updateMany + userId: catatan orang lain tidak pernah tersentuh, dan tidak ada bedanya antara "tidak ada" dan "bukan milikmu".
  const res = await db.note.updateMany({ where: { id, userId: user.id }, data });
  if (!res.count) return err(404, "Catatan tidak ditemukan.");
  const note = await db.note.findFirst({ where: { id, userId: user.id }, select: { updatedAt: true } });
  return NextResponse.json({ ok: true, id, updatedAt: (note?.updatedAt ?? new Date()).toISOString() }, { headers: noStore });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return err(403, "Permintaan ditolak.");
  const user = await getCurrentUser();
  if (!user) return err(401, "Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const { id } = await params;
  await db.note.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
