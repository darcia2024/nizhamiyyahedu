"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { fail, fromZod, type ActionResult } from "@/lib/action";
import { createOrder } from "@/lib/orders";
import type { PayData } from "@/lib/pay";

const checkoutSchema = z.object({
  courseId: z.string().min(1),
  whatsapp: z.string().max(40, "Nomor terlalu panjang."),
  agree: z.literal("on", { message: "Centang persetujuan Syarat dan ketentuan serta Kebijakan refund." }),
});

/** Membuat (atau memakai ulang) tagihan lalu mengembalikan tautan bayar; pop-up di browser yang menampilkannya. */
export async function startCheckout(_prev: ActionResult<PayData>, fd: FormData): Promise<ActionResult<PayData>> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const parsed = checkoutSchema.safeParse({
    courseId: fd.get("courseId"),
    whatsapp: String(fd.get("whatsapp") ?? ""),
    agree: fd.get("agree") ?? undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);

  const r = await createOrder(user, parsed.data.courseId, parsed.data.whatsapp);
  if (!r.ok) return fail(r.error, r.field ? { [r.field]: r.error } : undefined);
  return { ok: true, data: { orderId: r.orderId, payUrl: r.redirectUrl } };
}

export async function enrollFree(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesimu sudah berakhir. Masuk lagi dulu ya.");
  const courseId = String(fd.get("courseId") ?? "");
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED" || course.archivedAt) return fail("Kursus ini tidak tersedia.");
  if (course.priceRupiah > 0) return fail("Kursus ini berbayar.");
  const current = await db.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});
  if(current?.status === "REVOKED") return fail("Akses kursusmu dinonaktifkan admin. Hubungi pengelola kalau mau dibuka lagi.");
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: { status: "ACTIVE" },
    create: { userId: user.id, courseId, status: "ACTIVE", source: "FREE" },
  });
  redirect(`/dashboard/kursus/${course.slug}`);
}
