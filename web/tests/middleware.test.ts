import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const req = (url: string, cookie?: string) => new NextRequest(url, { headers: cookie ? { cookie } : {} });
const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("beranda untuk pengguna yang sudah login", () => {
  it("pengunjung tanpa sesi tetap melihat beranda", () => {
    expect(passes(middleware(req("https://x.test/")))).toBe(true);
  });

  it("sesi di https dialihkan ke /dashboard", () => {
    const res = middleware(req("https://x.test/", "__Secure-authjs.session-token=abc"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("sesi di http dan cookie yang dipecah juga dialihkan", () => {
    for (const cookie of ["authjs.session-token=abc", "authjs.session-token.0=a; authjs.session-token.1=b"]) {
      expect(middleware(req("http://x.test/", cookie)).status).toBe(307);
    }
  });

  it("cookie lain tidak dianggap sesi", () => {
    expect(passes(middleware(req("https://x.test/", "authjs.csrf-token=abc; theme=dark")))).toBe(true);
  });

  it("?publik=1 menampilkan beranda walau sudah login", () => {
    expect(passes(middleware(req("https://x.test/?publik=1", "authjs.session-token=abc")))).toBe(true);
  });
});
