import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => {
  const many = () => ({ deleteMany: vi.fn() });
  const db = {
    user: { findUnique: vi.fn(), delete: vi.fn() },
    order: { count: vi.fn(), deleteMany: vi.fn() },
    certificate: { count: vi.fn(), deleteMany: vi.fn() },
    lessonProgress: many(), lessonNote: many(), note: many(), enrollment: many(), event: many(),
    $transaction: vi.fn(),
  };
  return { db };
});
vi.mock("@/lib/db", () => ({ db }));

import { deleteUserAccount } from "@/lib/user-delete";

const student = { id: "u1", email: "a@b.test", name: "A", role: "STUDENT", teacherProfile: null };

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db));
  db.user.findUnique.mockResolvedValue(student);
  db.order.count.mockResolvedValue(0);
  db.certificate.count.mockResolvedValue(0);
});

const expectRefused = async (pattern: RegExp, actor = "admin") => {
  const r = await deleteUserAccount(actor, "u1");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.reason).toMatch(pattern);
  expect(db.user.delete).not.toHaveBeenCalled();
  expect(db.order.deleteMany).not.toHaveBeenCalled();
};

describe("hapus user", () => {
  it("menghapus akun dan semua datanya", async () => {
    expect(await deleteUserAccount("admin", "u1")).toEqual({ ok: true, email: "a@b.test", name: "A" });
    for (const t of [db.lessonProgress, db.lessonNote, db.note, db.enrollment, db.order, db.certificate, db.event]) {
      expect(t.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    }
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("menolak akun sendiri, admin, dan pengajar", async () => {
    await expectRefused(/sendiri/, "u1");
    db.user.findUnique.mockResolvedValue({ ...student, role: "ADMIN" });
    await expectRefused(/admin/i);
    db.user.findUnique.mockResolvedValue({ ...student, teacherProfile: { id: "t1" } });
    await expectRefused(/pengajar/);
  });

  it("menolak user yang sudah membeli", async () => {
    db.order.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expectRefused(/membeli/);
  });

  it("menolak selama tautan bayar masih hidup, termasuk tagihan yang dibatalkan", async () => {
    db.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    await expectRefused(/tagihan/);
    const where = db.order.count.mock.calls[1][0].where;
    expect(where.status.in).toEqual(["PENDING", "CANCELLED"]);
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it("menolak user yang punya sertifikat berlaku", async () => {
    db.certificate.count.mockResolvedValue(1);
    await expectRefused(/sertifikat/);
  });

  it("menolak user yang tidak ada", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expectRefused(/tidak ditemukan/);
  });
});
