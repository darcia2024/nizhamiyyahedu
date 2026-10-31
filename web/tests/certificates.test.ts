import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  db: {
    certificate: { findUnique: vi.fn(), upsert: vi.fn() },
    course: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn() },
    lessonProgress: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db: m.db }));

import { holderName, isCertificateCode, issueCertificate } from "@/lib/certificates";

const user = { id: "u1", name: "Fahma Daru", email: "daru@contoh.test" };
const course = {
  id: "c1", title: "Dauroh Ushul Fiqh", titleAr: "أصول الفقه", teacher: { displayName: "Ust. A" },
  lessons: [{ id: "l1", durationMin: 60 }, { id: "l2", durationMin: 30 }],
};
const done = (...d: string[]) => d.map((iso) => ({ completedAt: new Date(iso) }));

beforeEach(() => {
  vi.resetAllMocks();
  m.db.certificate.findUnique.mockResolvedValue(null);
  m.db.course.findUnique.mockResolvedValue(course);
  m.db.enrollment.findUnique.mockResolvedValue({ status: "ACTIVE" });
  m.db.certificate.upsert.mockImplementation(async ({ create }) => ({ id: "x", revokedAt: null, ...create }));
});

describe("nomor sertifikat", () => {
  it("hanya menerima bentuk NZ-tahun-8 hex besar", () => {
    expect(isCertificateCode("NZ-2026-3F9A12CC")).toBe(true);
    for (const bad of ["nz-2026-3f9a12cc", "NZ-2026-3F9A12C", "NZ-26-3F9A12CC", "NZ-2026-3F9A12CCZ", "' OR 1=1", ""]) expect(isCertificateCode(bad)).toBe(false);
  });
  it("nama pemegang: nama akun, atau bagian depan email", () => {
    expect(holderName(user)).toBe("Fahma Daru");
    expect(holderName({ name: "  ", email: "daru@contoh.test" })).toBe("daru");
  });
});

describe("issueCertificate", () => {
  it("terbit saat semua pelajaran selesai, memakai salinan nama dan judul serta tanggal selesai terakhir", async () => {
    m.db.lessonProgress.findMany.mockResolvedValue(done("2026-10-01T00:00:00Z", "2026-10-05T00:00:00Z"));
    const r = await issueCertificate(user, "c1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.certificate).toMatchObject({ holderName: "Fahma Daru", courseTitle: "Dauroh Ushul Fiqh", teacherName: "Ust. A", lessonCount: 2, totalMin: 90 });
    expect(r.certificate.code).toMatch(/^NZ-2026-[0-9A-F]{8}$/);
    expect(r.certificate.finishedAt.toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("belum terbit bila pelajaran belum selesai semua", async () => {
    m.db.lessonProgress.findMany.mockResolvedValue(done("2026-10-01T00:00:00Z"));
    expect(await issueCertificate(user, "c1")).toMatchObject({ ok: false, reason: "unfinished", total: 2, done: 1 });
    expect(m.db.certificate.upsert).not.toHaveBeenCalled();
  });

  it("belum terbit bila tidak punya akses aktif (mis. dicabut)", async () => {
    m.db.enrollment.findUnique.mockResolvedValue({ status: "REVOKED" });
    expect(await issueCertificate(user, "c1")).toMatchObject({ ok: false, reason: "not-enrolled" });
    m.db.enrollment.findUnique.mockResolvedValue(null);
    expect(await issueCertificate(user, "c1")).toMatchObject({ ok: false, reason: "not-enrolled" });
  });

  it("idempoten: yang sudah terbit dikembalikan apa adanya tanpa menghitung ulang", async () => {
    const old = { id: "old", code: "NZ-2025-AAAAAAAA", holderName: "Nama Lama" };
    m.db.certificate.findUnique.mockResolvedValue(old);
    const r = await issueCertificate(user, "c1");
    expect(r).toEqual({ ok: true, certificate: old });
    expect(m.db.course.findUnique).not.toHaveBeenCalled();
  });

  it("kelas tidak ada", async () => {
    m.db.course.findUnique.mockResolvedValue(null);
    expect(await issueCertificate(user, "zzz")).toMatchObject({ ok: false, reason: "no-course" });
  });
});
