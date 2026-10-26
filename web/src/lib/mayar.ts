/**
 * Klien Mayar. Tanpa MAYAR_API_KEY (lokal) dipakai mode simulasi:
 * invoice mengarah ke /dev/mayar/[orderId] yang menyediakan tombol "bayar" uji.
 *
 * Kontrak API v1: https://docs.mayar.id/api-reference/reqpayment/create
 * Status: https://docs.mayar.id/api-reference/reqpayment/detail
 * Transaksi sandbox dengan akun merchant tetap wajib sebelum rilis.
 */
const base = () => process.env.MAYAR_API_BASE ?? "https://api.mayar.id/hl/v1";
const key = () => process.env.MAYAR_API_KEY ?? "";

export const mayarSimulated = () => process.env.NODE_ENV !== "production" && !key();

export type Invoice = { id: string; link: string };

export async function createInvoice(p: {
  orderId: string;
  name: string;
  email: string;
  mobile: string;
  amount: number;
  description: string;
  redirectUrl: string;
  expiresAt: Date;
}): Promise<Invoice> {
  if (mayarSimulated()) {
    return { id: `sim_${p.orderId}`, link: `${process.env.APP_URL ?? ""}/dev/mayar/${p.orderId}` };
  }
  if (!key()) throw new Error("Mayar belum dikonfigurasi di server.");
  const res = await fetch(`${base()}/payment/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: p.name,
      email: p.email,
      mobile: p.mobile,
      amount: p.amount,
      description: p.description,
      redirectUrl: p.redirectUrl,
      expiredAt: p.expiresAt.toISOString(),
      extraData: { orderId: p.orderId },
    }),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Mayar create gagal: ${res.status}`);
  const json = (await res.json()) as { data?: { id?: string; link?: string } };
  if (!json.data?.id || !json.data.link) throw new Error("Respons Mayar tidak lengkap");
  return { id: json.data.id, link: json.data.link };
}

export type MayarTx = { status: "PAID" | "PENDING" | "FAILED" | "EXPIRED"; amount: number; currency: string; orderId?: string };

/** Ambil ulang transaksi langsung ke Mayar (server-to-server). Mode simulasi membaca order lokal di pemanggil. */
export async function fetchTransaction(mayarId: string): Promise<MayarTx | null> {
  if (mayarSimulated()) return null;
  if (!key()) return null;
  const res = await fetch(`${base()}/payment/${encodeURIComponent(mayarId)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { id?:string; status?: string; amount?: number; currency?:string; extraData?: { orderId?: string } } };
  const d = json.data;
  if (!d || d.id !== mayarId || !Number.isSafeInteger(d.amount) || Number(d.amount)<0) return null;
  const s = String(d.status ?? "").toLowerCase();
  const status = s === "paid" || s === "success" || s === "settled" ? "PAID" : s === "expired" ? "EXPIRED" : s === "failed" ? "FAILED" : "PENDING";
  return { status, amount: Number(d.amount), currency: (d.currency??"IDR").toUpperCase(), orderId: d.extraData?.orderId };
}
