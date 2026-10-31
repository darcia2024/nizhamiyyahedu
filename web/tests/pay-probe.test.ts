import { afterEach, describe, expect, it, vi } from "vitest";
import { probeEmbeddable } from "@/lib/pay-probe";

const SITE = "https://nizhamiyyahedu.vercel.app";
const reply = (headers: Record<string, string>, status = 200) => vi.fn().mockImplementation(async () => {
  const res = new Response("<html></html>", { status, headers });
  Object.defineProperty(res, "url", { value: "https://toko.myr.id/invoices/abc" });
  return res;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("probeEmbeddable: apakah halaman bayar Mayar boleh di-iframe", () => {
  it("lolos bila tidak ada larangan frame", async () => {
    vi.stubGlobal("fetch", reply({ "access-control-allow-origin": "*" }));
    expect(await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).toMatchObject({ embeddable: true, host: "toko.myr.id", status: 200 });
  });

  it("memblokir bila ada X-Frame-Options atau tantangan Cloudflare", async () => {
    vi.stubGlobal("fetch", reply({ "x-frame-options": "SAMEORIGIN" }));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(false);
    vi.stubGlobal("fetch", reply({ "cf-mitigated": "challenge" }, 403));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).reason).toMatch(/Cloudflare/);
  });

  it("frame-ancestors: boleh bila domain kita terdaftar atau *, diblokir bila tidak", async () => {
    vi.stubGlobal("fetch", reply({ "content-security-policy": `default-src 'self'; frame-ancestors 'self' ${SITE}` }));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(true);
    vi.stubGlobal("fetch", reply({ "content-security-policy": "frame-ancestors *" }));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(true);
    vi.stubGlobal("fetch", reply({ "content-security-policy": "frame-ancestors 'self' https://lain.example" }));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(false);
  });

  it("tidak menembak alamat di luar domain Mayar (anti-SSRF) dan tidak menghalangi bila gagal diperiksa", async () => {
    const f = reply({});
    vi.stubGlobal("fetch", f);
    expect((await probeEmbeddable("https://evil.example/invoices/abc", SITE)).embeddable).toBe(true);
    expect((await probeEmbeddable("http://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(true);
    expect(f).not.toHaveBeenCalled();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect((await probeEmbeddable("https://toko.myr.id/invoices/abc", SITE)).embeddable).toBe(true);
  });
});
