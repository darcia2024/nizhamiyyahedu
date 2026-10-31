import { describe, expect, it } from "vitest";
import config from "../next.config";

type Rule = { source: string; headers: { key: string; value: string }[] };

// Next.js menimpa header bernama sama dengan aturan yang cocok belakangan, jadi nilai akhir sebuah path = aturan terakhir yang cocok.
async function effective(path: string) {
  const rules = (await config.headers!()) as Rule[];
  const matches = (src: string) => {
    if (src === "/(.*)") return true;
    const prefix = src.replace(/\/:[^/]+\*$/, "").replace(/\/:path\*$/, "");
    return path === prefix || path.startsWith(`${prefix}/`);
  };
  const out = new Map<string, string>();
  for (const r of rules.filter((x) => matches(x.source))) for (const h of r.headers) out.set(h.key, h.value);
  return out;
}

describe("header keamanan frame", () => {
  it("halaman biasa tidak boleh dibingkai siapa pun dan hanya boleh membingkai YouTube", async () => {
    const h = await effective("/kursus-lain/../dashboard");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("Content-Security-Policy")).toBe("frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com");
  });

  it("halaman kursus boleh menampilkan halaman bayar Mayar di iframe, tapi tetap tidak boleh dibingkai", async () => {
    for (const p of ["/kursus", "/kursus/dauroh-mantiq"]) {
      const csp = (await effective(p)).get("Content-Security-Policy")!;
      expect(csp).toContain("frame-src https:");
      expect(csp).toContain("frame-ancestors 'none'");
    }
  });

  it("halaman status pembayaran hanya boleh dibingkai situs sendiri", async () => {
    const h = await effective("/dashboard/pembayaran/abc");
    expect(h.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(h.get("Content-Security-Policy")).toContain("frame-ancestors 'self'");
  });

  it("bagian dashboard lain tetap tertutup untuk iframe", async () => {
    for (const p of ["/dashboard", "/dashboard/katalog", "/admin"]) {
      expect((await effective(p)).get("X-Frame-Options")).toBe("DENY");
    }
  });
});
