"use server";
import { cookies, headers } from "next/headers";
import { fail, type ActionResult } from "@/lib/action";
import { withBase } from "@/lib/base-path";
import { rateLimit } from "@/lib/rate-limit";
import { isTutorialPin, TUTORIAL_COOKIE, tutorialToken } from "@/lib/tutorial-pin";

export async function unlockTutorial(_p: ActionResult, fd: FormData): Promise<ActionResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`tutorial:${ip}`, 10, 300))) return fail("Terlalu banyak percobaan. Coba lagi beberapa menit lagi.");
  if (!isTutorialPin(String(fd.get("pin") ?? ""))) return fail("PIN belum benar.", { pin: "PIN belum benar." });
  (await cookies()).set(TUTORIAL_COOKIE, tutorialToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: withBase("/tutorial"), maxAge: 60 * 60 * 24 * 30 });
  return { ok: true, message: "PIN benar. Membuka tutorial…" };
}
