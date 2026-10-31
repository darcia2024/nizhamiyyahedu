import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: { course: { findFirst: vi.fn() }, event: { create: vi.fn() } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn().mockResolvedValue(true) }));
const { POST } = await import("@/app/api/events/route");

afterEach(() => vi.unstubAllEnvs());

// Body kosong membuat permintaan yang lolos pemeriksaan asal berakhir 400, jadi 403 vs 400 membedakan keduanya tanpa database.
const post = (origin?: string) => POST(new Request("https://nizhamiyyahedu-web.vercel.app/api/events", { method: "POST", headers: origin ? { origin } : {}, body: "{}" }));

describe("pencatat kursus dilihat: pemeriksaan asal", () => {
  it("menerima asal alamat server dan alamat publik situs (di belakang rewrite)", async () => {
    vi.stubEnv("APP_URL", "https://nizhamiyyahedu.vercel.app");
    expect((await post("https://nizhamiyyahedu-web.vercel.app")).status).toBe(400);
    expect((await post("https://nizhamiyyahedu.vercel.app")).status).toBe(400);
  });

  it("menolak asal lain dan permintaan tanpa Origin", async () => {
    vi.stubEnv("APP_URL", "https://nizhamiyyahedu.vercel.app");
    expect((await post("https://evil.example")).status).toBe(403);
    expect((await post()).status).toBe(403);
  });
});
