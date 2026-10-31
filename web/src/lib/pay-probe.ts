/**
 * Periksa dari server apakah halaman bayar Mayar boleh ditampilkan di dalam iframe situs kita, dengan meniru
 * permintaan iframe dari browser (header Sec-Fetch dan Referer). Hasilnya dipakai pop-up pembayaran untuk langsung
 * beralih ke jendela cadangan bila halaman Mayar melarang di-frame, dan dicatat ke log supaya penyebabnya bisa dibaca.
 */
export type Probe = {
  /** false = pasti tidak bisa di-frame; true = tidak ada larangan yang terdeteksi (belum tentu tampil: ekstensi browser, dll). */
  embeddable: boolean;
  reason: string | null;
  host: string;
  status: number | null;
};

// Hanya domain Mayar yang diperiksa, supaya fungsi ini tidak bisa dipakai menembak alamat sembarang dari server kita.
const MAYAR_HOSTS = [/(^|\.)myr\.id$/i, /(^|\.)mayar\.id$/i, /(^|\.)mayar\.club$/i, /(^|\.)mayar\.io$/i, /(^|\.)mayar\.link$/i];

export async function probeEmbeddable(payUrl: string, siteOrigin: string): Promise<Probe> {
  let u: URL;
  try { u = new URL(payUrl); } catch { return { embeddable: false, reason: "alamat tagihan tidak valid", host: "", status: null }; }
  const host = u.hostname;
  if (u.protocol !== "https:" || !MAYAR_HOSTS.some((r) => r.test(host))) return { embeddable: true, reason: null, host, status: null };

  try {
    const res = await fetch(u, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        Referer: `${siteOrigin}/`,
      },
    });
    await res.body?.cancel().catch(() => undefined);

    const xfo = res.headers.get("x-frame-options");
    const csp = res.headers.get("content-security-policy") ?? "";
    const ancestors = /frame-ancestors([^;]*)/i.exec(csp)?.[1]?.trim() ?? null;
    const challenge = res.headers.get("cf-mitigated") === "challenge";
    const finalHost = new URL(res.url).hostname;
    console.info("[pay-probe]", JSON.stringify({ host, finalHost, status: res.status, xfo, frameAncestors: ancestors, challenge }));

    if (challenge) return { embeddable: false, reason: "Mayar meminta verifikasi keamanan (Cloudflare) yang tidak bisa ditampilkan di dalam iframe", host, status: res.status };
    if (xfo) return { embeddable: false, reason: `Mayar melarang ditampilkan di situs lain (X-Frame-Options: ${xfo})`, host, status: res.status };
    if (ancestors && ancestors !== "*" && !ancestors.split(/\s+/).some((s) => s === "*" || s === siteOrigin || s === new URL(siteOrigin).host)) {
      return { embeddable: false, reason: `Mayar hanya mengizinkan domain tertentu (frame-ancestors: ${ancestors})`, host, status: res.status };
    }
    if (res.status >= 500) return { embeddable: false, reason: `Halaman Mayar sedang bermasalah (HTTP ${res.status})`, host, status: res.status };
    return { embeddable: true, reason: null, host, status: res.status };
  } catch (e) {
    console.warn("[pay-probe] gagal memeriksa", host, e instanceof Error ? e.message : e);
    // Tidak bisa diperiksa: jangan menghalangi, biarkan pop-up mencoba dan mengandalkan deteksi di browser.
    return { embeddable: true, reason: null, host, status: null };
  }
}
