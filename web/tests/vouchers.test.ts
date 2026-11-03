import { beforeEach, describe, expect, it, vi } from "vitest";
import { discountedAmount, discountLabel, normalizeVoucherCode, parseEmailList, voucherProblem, type VoucherRule } from "@/lib/vouchers";

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

const rule: VoucherRule = { courseId: null, allowedEmails: null, maxUses: null, minPurchase: null, singleUse: false, startsAt: null, expiresAt: null, active: true };
const ctx = { courseId: "c1", price: 70000, email: "a@b.test", uses: 0, usedByUser: 0 };
const pct = (percent: number) => ({ discountType: "PERCENT", percent, amountOff: null });
const rp = (amountOff: number) => ({ discountType: "NOMINAL", percent: 0, amountOff });

describe("aturan voucher", () => {
  it("menghitung harga setelah diskon persen", () => {
    expect(discountedAmount(70000, pct(50))).toBe(35000);
    expect(discountedAmount(70000, pct(100))).toBe(0);
    expect(discountedAmount(70000, pct(33))).toBe(46900);
    expect(discountedAmount(99999, pct(1))).toBe(98999);
  });
  it("menghitung harga setelah diskon nominal, tidak pernah minus", () => {
    expect(discountedAmount(70000, rp(20000))).toBe(50000);
    expect(discountedAmount(70000, rp(70000))).toBe(0);
    expect(discountedAmount(70000, rp(90000))).toBe(0);
  });
  it("menulis besaran diskon", () => {
    expect(discountLabel(pct(25))).toBe("25%");
    expect(discountLabel(rp(20000))).toBe("Rp 20.000");
  });
  it("kupon sekali pakai: tiap akun sekali, orang lain tetap bisa", () => {
    expect(voucherProblem({ ...rule, singleUse: true }, ctx)).toBeNull();
    expect(voucherProblem({ ...rule, singleUse: true }, { ...ctx, uses: 9 })).toBeNull();
    expect(voucherProblem({ ...rule, singleUse: true }, { ...ctx, uses: 1, usedByUser: 1 })).toMatch(/pernah kamu pakai/);
  });
  it("kupon berulang: akun yang sama boleh memakai lagi", () => {
    expect(voucherProblem(rule, { ...ctx, uses: 3, usedByUser: 3 })).toBeNull();
  });
  it("batas pemakaian berlaku untuk kedua tipe", () => {
    expect(voucherProblem({ ...rule, maxUses: 2 }, { ...ctx, uses: 1 })).toBeNull();
    expect(voucherProblem({ ...rule, maxUses: 2 }, { ...ctx, uses: 2 })).toMatch(/Kuota/);
    expect(voucherProblem({ ...rule, singleUse: true, maxUses: 2 }, { ...ctx, uses: 2 })).toMatch(/Kuota/);
  });
  it("mengikuti waktu mulai dan minimum pembelian", () => {
    expect(voucherProblem({ ...rule, startsAt: new Date(Date.now() + 60000) }, ctx)).toMatch(/belum/);
    expect(voucherProblem({ ...rule, startsAt: new Date(0) }, ctx)).toBeNull();
    expect(voucherProblem({ ...rule, minPurchase: 100000 }, ctx)).toMatch(/minimal Rp 100\.000/);
    expect(voucherProblem({ ...rule, minPurchase: 70000 }, ctx)).toBeNull();
  });
  it("merapikan kode dan daftar email", () => {
    expect(normalizeVoucherCode(" muridlama ")).toBe("MURIDLAMA");
    expect(parseEmailList("A@b.test, c@d.test\ne@f.test")).toEqual(["a@b.test", "c@d.test", "e@f.test"]);
  });
  it("menerima voucher yang valid", () => expect(voucherProblem(rule, ctx)).toBeNull());
  it("menolak nonaktif, kedaluwarsa, salah kursus, email lain, dan kuota habis", () => {
    expect(voucherProblem({ ...rule, active: false }, ctx)).toMatch(/tidak aktif/);
    expect(voucherProblem({ ...rule, expiresAt: new Date(0) }, ctx)).toMatch(/kedaluwarsa/);
    expect(voucherProblem({ ...rule, courseId: "c2" }, ctx)).toMatch(/kelas ini/);
    expect(voucherProblem({ ...rule, allowedEmails: "x@y.test" }, ctx)).toMatch(/akunmu/);
    expect(voucherProblem({ ...rule, maxUses: 2 }, { ...ctx, uses: 2 })).toMatch(/Kuota/);
  });
  it("mencocokkan email tanpa peduli huruf besar", () => {
    expect(voucherProblem({ ...rule, allowedEmails: "A@B.test" }, ctx)).toBeNull();
  });
});

describe("tagihan dengan voucher", () => {
  const user = { id: "u1", email: "a@b.test", name: "A" } as CurrentUser;
  const voucher = { ...rule, ...pct(50), id: "v1", code: "HEMAT" };
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

  it("diskon nominal sebesar harga juga membuka kelas tanpa Mayar", async () => {
    db.voucher.findUnique.mockResolvedValue({ ...voucher, ...rp(70000) });
    db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...order, ...data }));
    db.order.findUnique.mockResolvedValue({ ...order, amount: 0 });
    expect(await createOrder(user, "c1", "081234567890", "HEMAT")).toMatchObject({ ok: true, amount: 0, free: true });
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("kupon sekali pakai ditolak hanya untuk akun yang sudah memakainya", async () => {
    db.voucher.findUnique.mockResolvedValue({ ...voucher, singleUse: true });
    db.order.count.mockImplementation(async ({ where }: { where: { userId?: string } }) => (where.userId ? 1 : 5));
    expect(await createOrder(user, "c1", "081234567890", "HEMAT")).toMatchObject({ ok: false, field: "voucher" });
    expect(db.order.create).not.toHaveBeenCalled();
    db.order.count.mockImplementation(async ({ where }: { where: { userId?: string } }) => (where.userId ? 0 : 5));
    db.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...order, ...data }));
    expect(await createOrder(user, "c1", "081234567890", "HEMAT")).toMatchObject({ ok: true, amount: 35000 });
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
