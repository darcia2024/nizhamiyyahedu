import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchYoutubeTitle } from "@/lib/youtube-title";

const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("judul dari YouTube", () => {
  it("mengambil judul video", async () => {
    const f = reply({ title: "  Mantiq Pertemuan 3 " });
    vi.stubGlobal("fetch", f);
    expect(await fetchYoutubeTitle(url)).toBe("Mantiq Pertemuan 3");
    expect(String((f.mock.calls as unknown[][])[0][0])).toContain(encodeURIComponent(url));
  });

  it("memotong judul sampai batas 120 karakter", async () => {
    vi.stubGlobal("fetch", reply({ title: "a".repeat(200) }));
    expect(await fetchYoutubeTitle(url)).toHaveLength(120);
  });

  it("null untuk video privat, gangguan jaringan, dan judul terlalu pendek", async () => {
    vi.stubGlobal("fetch", reply({}, 401));
    expect(await fetchYoutubeTitle(url)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    expect(await fetchYoutubeTitle(url)).toBeNull();
    vi.stubGlobal("fetch", reply({ title: "a" }));
    expect(await fetchYoutubeTitle(url)).toBeNull();
  });

  it("tidak memanggil YouTube kalau bukan tautan YouTube", async () => {
    const f = reply({ title: "x" });
    vi.stubGlobal("fetch", f);
    expect(await fetchYoutubeTitle("https://contoh.test/a.mp4")).toBeNull();
    expect(await fetchYoutubeTitle(null)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
