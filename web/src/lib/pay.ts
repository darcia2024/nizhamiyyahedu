/** Data yang dikirim server ke browser untuk membuka pop-up pembayaran. */
export type PayData = { orderId: string; payUrl: string };

/** Pesan dari halaman balasan Mayar (di dalam iframe) ke pop-up di halaman induk. */
export const PAY_MESSAGE = "nz-pay-status";
