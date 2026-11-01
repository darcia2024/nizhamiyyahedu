"use server";
import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth-guard";
import { cancelOrder } from "@/lib/orders";

export async function cancelMyOrder(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Silakan masuk dulu.");
  const id = String(fd.get("orderId") ?? "");
  const r = await cancelOrder(user.id, id);
  revalidatePath("/dashboard/pembayaran");
  revalidatePath(`/dashboard/pembayaran/${id}`);
  if (r === "not_found") return fail("Tagihan tidak ditemukan.");
  if (r === "not_pending") return fail("Tagihan ini sudah tidak bisa dibatalkan.");
  if (r === "paid") return { ok: true, message: "Tagihan ini ternyata sudah lunas, jadi tidak dibatalkan. Kelasnya sudah terbuka." };
  await audit(user, "ORDER_CANCEL", "Order", id);
  return { ok: true, message: "Pesanan dibatalkan." };
}
