import { beforeEach, describe, expect, it, vi } from "vitest";
import { discountedAmount, normalizeVoucherCode, parseEmailList, voucherProblem, type VoucherRule } from "@/lib/vouchers";

const { db, createInvoice } = vi.hoisted(() => {
  const db = {
    user: { update: vi.fn() },
    course: { findUnique: vi.fn() },
    enrollment: { findMany: vi.fn(), upsert: vi.fn() },
    voucher: { findUnique: vi.fn() },
    order: { updateMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    event: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  return { db, createInvoice: vi.fn() };
});
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/mayar", () => ({ createInvoice, fetchTransaction: vi.fn(), mayarSimulated: () => false }));

import { createOrder } from "@/lib/orders";
import type { CurrentUser } from "@/lib/auth-guard";

const rule: VoucherRule = { percent: 50, courseId: null, allowedEmails: null, maxUses: null, expiresAt: null, active: true };
const ctx = { courseId: "c1", email: "a@b.test", uses: 0, usedByUser: 0 };

describe("aturan voucher", () => {
  it("menghitung harga setelah diskon", () => {
    expect(discountedAmount(70000, 50)).toBe(35000);
    expect(discountedAmount(70000, 100)).toBe(0);
    expect(discountedAmount(70000, 33)).toBe(46900);
    expect(discountedAmount(99999, 1)).toBe(98999);
  });
  it("merapikan kode dan daftar email", () => {
    expect(normalizeVoucherCode(" muridlama ")).toBe("MURIDLAMA");
    expect(parseEmailList("A@b.test, c@d.test\ne@f.test")).toEqual(["a@b.test", "c@d.test", "e@f.test"]);
  });
  it("menerima voucher yang valid", () => expect(voucherProblem(rule, ctx)).toBeNull());
  it("menolak nonaktif, kedaluwarsa, salah kursus, email lain, sudah dipakai, dan kuota habis", () => {
    expect(voucherProblem({ ...rule, active: false }, ctx)).toMatch(/tidak aktif/);
    expect(voucherProblem({ ...rule, expiresAt: new Date(0) }, ctx)).toMatch(/kedaluwarsa/);
    expect(voucherProblem({ ...rule, courseId: "c2" }, ctx)).toMatch(/kelas ini/);
    expect(voucherProblem({ ...rule, allowedEmails: "x@y.test" }, ctx)).toMatch(/akunmu/);
    expect(voucherProblem(rule, { ...ctx, usedByUser: 1 })).toMatch(/pernah/);
    expect(voucherProblem({ ...rule, maxUses: 2 }, { ...ctx, uses: 2 })).toMatch(/Kuota/);
  });
  it("mencocokkan email tanpa peduli huruf besar", () => {
    expect(voucherProblem({ ...rule, allowedEmails: "A@B.test" }, ctx)).toBeNull();
  });
});

describe("tagihan dengan voucher", () => {
  const user = { id: "u1", email: "a@b.test", name: "A" } as CurrentUser;
  const voucher = { ...rule, id: "v1", code: "HEMAT" };
  const order = { id: "o1", userId: "u1", courseId: "c1", status: "PENDING", expiresAt: new Date(Date.now() + 1000) };

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db));
    db.course.findUnique.mockResolvedValue({ id: "c1", status: "PUBLISHED", archivedAt: null, priceRupiah: 70000, title: "K", bundleCourseIds: null });
    db.enrollment.findMany.mockResolvedValue([]);
    db.order.findFirst.mockResolvedValue(null);
    db.order.count.mockResolvedValue(0);
    db.voucher.findUnique.mockResolvedValue(voucher);
    createInvoice.mockResolvedValue({ id: "m1", link: "https://myr.id/x" });
  });

  it("menagih harga setelah diskon dan mencatat vouchernya", async () => {
    db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...order, ...data }));
    const r = await createOrder(user, "c1", "081234567890", "hemat");
    expect(r).toMatchObject({ ok: true, amount: 35000 });
    expect(db.order.create.mock.calls[0][0].data).toMatchObject({ amount: 35000, voucherId: "v1", voucherCode: "HEMAT", originalAmount: 70000 });
    expect(createInvoice.mock.calls[0][0].amount).toBe(35000);
  });

  it("voucher 100% membuka kelas tanpa membuat tagihan Mayar", async () => {
    db.voucher.findUnique.mockResolvedValue({ ...voucher, percent: 100 });
    db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...order, ...data }));
    db.order.findUnique.mockResolvedValue({ ...order, amount: 0 });
    const r = await createOrder(user, "c1", "081234567890", "HEMAT");
    expect(r).toMatchObject({ ok: true, amount: 0, free: true });
    expect(createInvoice).not.toHaveBeenCalled();
    expect(db.enrollment.upsert).toHaveBeenCalledTimes(1);
    expect(db.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }));
  });

  it("menolak voucher kalau masih ada tagihan menunggu", async () => {
    db.order.findFirst.mockResolvedValue({ ...order, amount: 70000, payUrl: "https://myr.id/lama" });
    const r = await createOrder(user, "c1", "081234567890", "HEMAT");
    expect(r).toMatchObject({ ok: false, field: "voucher" });
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it("menolak kode yang tidak ada, tanpa membuat tagihan", async () => {
    db.voucher.findUnique.mockResolvedValue(null);
    const r = await createOrder(user, "c1", "081234567890", "NGAWUR");
    expect(r).toMatchObject({ ok: false, field: "voucher" });
    expect(db.order.create).not.toHaveBeenCalled();
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("tanpa voucher tetap memakai harga penuh", async () => {
    db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...order, ...data }));
    const r = await createOrder(user, "c1", "081234567890");
    expect(r).toMatchObject({ ok: true, amount: 70000 });
    expect(db.voucher.findUnique).not.toHaveBeenCalled();
  });
});
