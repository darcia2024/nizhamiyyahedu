/**
 * Permintaan tulis dari browser hanya diterima bila Origin-nya alamat situs sendiri: alamat server ini atau alamat publik
 * (APP_URL), karena rewrite Vercel membuat keduanya berbeda.
 */
export function sameOrigin(req: Request): boolean {
  const allowed = new Set([new URL(req.url).origin]);
  try {
    if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  } catch { /* APP_URL tidak valid: abaikan */ }
  return allowed.has(req.headers.get("origin") ?? "");
}

/** Baca JSON dengan batas ukuran; null bila rusak atau terlalu besar. */
export async function readJson(req: Request, maxBytes = 100_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v: unknown = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
