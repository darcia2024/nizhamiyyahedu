import { createHash } from "node:crypto";

export const TUTORIAL_COOKIE = "tutorial_pin";

const pin = () => process.env.TUTORIAL_PIN || "0001";

export const isTutorialPin = (input: string) => input.trim() === pin();

/** Isi cookie: turunan PIN dan AUTH_SECRET, jadi tidak bisa ditebak dan otomatis batal kalau PIN diganti. */
export const tutorialToken = () => createHash("sha256").update(`tutorial:${pin()}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");
