import { beforeEach, describe, expect, it, vi } from "vitest";

// Sinkron status ke Mayar: hanya Mayar (bukan browser) yang boleh menyatakan lunas, dan nominalnya harus cocok.
const tx = {
  order: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  course: { findUnique: vi.fn() },
  enrollment: { upsert: vi.fn() },
  event: { create: vi.fn() },
};
const db = { ...tx, $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) };
vi.mock("@/lib/db", () => ({ db }));

const mayar = { fetchTransaction: vi.fn(), mayarSimulated: vi.fn(), createInvoice: vi.fn() };
vi.mock("@/lib/mayar", () => mayar);

const { syncOrderWithMayar } = await import("@/lib/orders");

const pending = { id: "o1", status: "PENDING", mayarId: "inv1" };
const paidTx = (over: object = {}) => ({ status: "PAID", amount: 70000, currency: "IDR", orderId: "o1", ...over });

beforeEach(() => {
  vi.clearAllMocks();
  mayar.mayarSimulated.mockReturnValue(false);
  tx.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", courseId: "c1", amount: 70000, status: "PENDING" });
  tx.course.findUnique.mockResolvedValue({ id: "c1", bundleCourseIds: null });
});

describe("syncOrderWithMayar", () => {
  it("menandai lunas dan membuka akses saat Mayar menyatakan PAID dengan nominal yang cocok", async () => {
    mayar.fetchTransaction.mockResolvedValue(paidTx());
    await syncOrderWithMayar(pending);
    expect(tx.order.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "o1" }, data: expect.objectContaining({ status: "PAID" }) }));
    expect(tx.enrollment.upsert).toHaveBeenCalledTimes(1);
  });

  it("tidak membuka akses bila nominal dari Mayar tidak sama dengan order", async () => {
    mayar.fetchTransaction.mockResolvedValue(paidTx({ amount: 1000 }));
    await syncOrderWithMayar(pending);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.enrollment.upsert).not.toHaveBeenCalled();
  });

  it("tidak menandai lunas bila transaksi milik order lain atau bukan IDR", async () => {
    for (const over of [{ orderId: "lain" }, { currency: "USD" }]) {
      mayar.fetchTransaction.mockResolvedValue(paidTx(over));
      await syncOrderWithMayar(pending);
    }
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("menandai FAILED atau EXPIRED hanya untuk order yang masih PENDING", async () => {
    mayar.fetchTransaction.mockResolvedValue({ status: "EXPIRED", amount: 70000, currency: "IDR" });
    await syncOrderWithMayar(pending);
    expect(tx.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: "PENDING" }, data: { status: "EXPIRED" } });
  });

  it("tidak bertanya ke Mayar bila order bukan PENDING, belum punya invoice, atau mode simulasi", async () => {
    await syncOrderWithMayar({ ...pending, status: "PAID" });
    await syncOrderWithMayar({ ...pending, mayarId: null });
    mayar.mayarSimulated.mockReturnValue(true);
    await syncOrderWithMayar(pending);
    expect(mayar.fetchTransaction).not.toHaveBeenCalled();
  });

  it("tidak mengubah apa pun bila Mayar tidak menjawab atau masih menunggu", async () => {
    mayar.fetchTransaction.mockResolvedValueOnce(null).mockResolvedValueOnce({ status: "PENDING", amount: 70000, currency: "IDR" });
    await syncOrderWithMayar(pending);
    await syncOrderWithMayar(pending);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });
});
