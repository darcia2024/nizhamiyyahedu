import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  note: { count: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
  lessonNote: { upsert: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  lesson: { findUnique: vi.fn() },
  enrollment: { findUnique: vi.fn() },
};
vi.mock("@/lib/db", () => ({ db }));
const auth = { getCurrentUser: vi.fn() };
vi.mock("@/lib/auth-guard", () => auth);
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(true) }));

const { POST } = await import("@/app/api/notes/route");
const { PATCH, DELETE } = await import("@/app/api/notes/[id]/route");
const { PUT } = await import("@/app/api/notes/lesson/[lessonId]/route");

const ORIGIN = "https://nizhamiyyahedu.vercel.app";
const req = (method: string, body?: unknown, origin: string | null = ORIGIN) =>
  new Request(`${ORIGIN}/api/notes`, { method, headers: { "content-type": "application/json", ...(origin ? { origin } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
const ctx = <T extends object>(v: T) => ({ params: Promise.resolve(v) });

beforeEach(() => {
  vi.clearAllMocks();
  auth.getCurrentUser.mockResolvedValue({ id: "u1", role: "STUDENT" });
  db.note.count.mockResolvedValue(3);
  db.note.create.mockResolvedValue({ id: "n1", updatedAt: new Date("2026-11-01T00:00:00Z") });
});

describe("POST /api/notes", () => {
  it("menolak asal asing dan pengguna yang belum login", async () => {
    expect((await POST(req("POST", { body: "x" }, "https://evil.example"))).status).toBe(403);
    auth.getCurrentUser.mockResolvedValue(null);
    expect((await POST(req("POST", { body: "x" }))).status).toBe(401);
    expect(db.note.create).not.toHaveBeenCalled();
  });

  it("membuat catatan milik pengguna yang login, judul dirapikan jadi satu baris", async () => {
    const res = await POST(req("POST", { title: "  Ringkasan\nbab 1  ", body: "isi catatan" }));
    expect(res.status).toBe(201);
    expect(db.note.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", title: "Ringkasan bab 1", body: "isi catatan", pinned: false, courseId: null });
  });

  it("menolak isi yang melebihi batas dan menolak kelas yang belum diikuti", async () => {
    expect((await POST(req("POST", { body: "a".repeat(20001) }))).status).toBe(400);
    db.enrollment.findUnique.mockResolvedValue(null);
    expect((await POST(req("POST", { body: "x", courseId: "c-lain" }))).status).toBe(400);
    expect(db.note.create).not.toHaveBeenCalled();
  });

  it("membatasi jumlah catatan per pengguna", async () => {
    db.note.count.mockResolvedValue(500);
    expect((await POST(req("POST", { body: "x" }))).status).toBe(400);
  });
});

describe("PATCH dan DELETE /api/notes/[id]", () => {
  it("hanya mengubah catatan milik sendiri (milik orang lain terlihat seperti tidak ada)", async () => {
    db.note.updateMany.mockResolvedValue({ count: 0 });
    const res = await PATCH(req("PATCH", { body: "ubah" }), ctx({ id: "n-orang-lain" }));
    expect(res.status).toBe(404);
    expect(db.note.updateMany.mock.calls[0][0].where).toEqual({ id: "n-orang-lain", userId: "u1" });
  });

  it("menyimpan perubahan sebagian dan menghapus dengan filter pemilik", async () => {
    db.note.updateMany.mockResolvedValue({ count: 1 });
    db.note.findFirst.mockResolvedValue({ updatedAt: new Date("2026-11-01T01:00:00Z") });
    const ok = await PATCH(req("PATCH", { pinned: true }), ctx({ id: "n1" }));
    expect(ok.status).toBe(200);
    expect(db.note.updateMany.mock.calls[0][0].data).toEqual({ pinned: true });
    await DELETE(req("DELETE"), ctx({ id: "n1" }));
    expect(db.note.deleteMany).toHaveBeenCalledWith({ where: { id: "n1", userId: "u1" } });
  });
});

describe("PUT /api/notes/lesson/[lessonId]", () => {
  it("butuh akses aktif ke kursus untuk menulis catatan pelajaran", async () => {
    db.lesson.findUnique.mockResolvedValue({ courseId: "c1", status: "PUBLISHED" });
    db.enrollment.findUnique.mockResolvedValue(null);
    expect((await PUT(req("PUT", { body: "isi" }), ctx({ lessonId: "l1" }))).status).toBe(403);
    expect(db.lessonNote.upsert).not.toHaveBeenCalled();
  });

  it("menyimpan isi, dan isi kosong berarti catatannya dihapus", async () => {
    db.lesson.findUnique.mockResolvedValue({ courseId: "c1", status: "PUBLISHED" });
    db.enrollment.findUnique.mockResolvedValue({ status: "ACTIVE" });
    db.lessonNote.upsert.mockResolvedValue({ updatedAt: new Date("2026-11-01T00:00:00Z") });
    expect((await PUT(req("PUT", { body: "isi", pinned: true }), ctx({ lessonId: "l1" }))).status).toBe(200);
    expect(db.lessonNote.upsert.mock.calls[0][0].create).toMatchObject({ userId: "u1", lessonId: "l1", body: "isi", pinned: true });
    const del = await PUT(req("PUT", { body: "   " }), ctx({ lessonId: "l1" }));
    expect(await del.json()).toMatchObject({ ok: true, deleted: true });
    expect(db.lessonNote.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", lessonId: "l1" } });
  });
});
