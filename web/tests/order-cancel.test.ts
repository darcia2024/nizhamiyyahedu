import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, fetchTransaction } = vi.hoisted(() => {
  const db = {
    order: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    course: { findUnique: vi.fn() },
    enrollment: { upsert: vi.fn() },
    event: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db));
  return { db, fetchTransaction: vi.fn() };
});
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/mayar", () => ({ createInvoice: vi.fn(), fetchTransaction, mayarSimulated: () => false }));

import { cancelOrder, settleOrder } from "@/lib/orders";

const pending = { id: "o1", userId: "u1", courseId: "c1", amount: 70000, status: "PENDING", mayarId: "m1", expiresAt: new Date(Date.now() + 3600000) };

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db));
  db.order.updateMany.mockResolvedValue({ count: 1 });
  fetchTransaction.mockResolvedValue({ status: "PENDING", amount: 70000, currency: "IDR" });
});

describe("batal pesanan", () => {
  it("hanya mencari tagihan milik user itu sendiri", async () => {
    db.order.findFirst.mockResolvedValue(null);
    expect(await cancelOrder("u2", "o1")).toBe("not_found");
    expect(db.order.findFirst).toHaveBeenCalledWith({ where: { id: "o1", userId: "u2" } });
    expect(db.order.updateMany).not.toHaveBeenCalled();
  });

  it("membatalkan tagihan yang masih menunggu", async () => {
    db.order.findFirst.mockResolvedValue(pending);
    expect(await cancelOrder("u1", "o1")).toBe("cancelled");
    expect(db.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: "PENDING" }, data: { status: "CANCELLED" } });
  });

  it("menolak tagihan lunas atau kedaluwarsa", async () => {
    db.order.findFirst.mockResolvedValue({ ...pending, status: "PAID" });
    expect(await cancelOrder("u1", "o1")).toBe("not_pending");
    db.order.findFirst.mockResolvedValue({ ...pending, expiresAt: new Date(0) });
    expect(await cancelOrder("u1", "o1")).toBe("not_pending");
    expect(db.order.updateMany).not.toHaveBeenCalled();
  });

  it("tidak membatalkan kalau ternyata sudah lunas di Mayar", async () => {
    db.order.findFirst.mockResolvedValue(pending);
    fetchTransaction.mockResolvedValue({ status: "PAID", amount: 70000, currency: "IDR" });
    db.order.findUnique.mockImplementation(async ({ select }: { select?: unknown }) => (select ? { status: "PAID" } : pending));
    db.course.findUnique.mockResolvedValue({ id: "c1", bundleCourseIds: null });
    db.order.updateMany.mockResolvedValue({ count: 0 });
    expect(await cancelOrder("u1", "o1")).toBe("paid");
  });

  it("tetap bisa membatalkan kalau Mayar sedang gangguan", async () => {
    db.order.findFirst.mockResolvedValue(pending);
    fetchTransaction.mockRejectedValue(new Error("timeout"));
    expect(await cancelOrder("u1", "o1")).toBe("cancelled");
  });

  it("pembayaran setelah dibatalkan tetap diakui dan membuka kelas", async () => {
    db.order.findUnique.mockResolvedValue({ ...pending, status: "CANCELLED" });
    db.course.findUnique.mockResolvedValue({ id: "c1", bundleCourseIds: null });
    expect(await settleOrder("o1", 70000)).toBe("paid");
    expect(db.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }));
    expect(db.enrollment.upsert).toHaveBeenCalledTimes(1);
  });
});
