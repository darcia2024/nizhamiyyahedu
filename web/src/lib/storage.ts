import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Tempat menyimpan gambar unggahan admin. Di production memakai Supabase Storage (bucket publik "media"),
// karena disk server Vercel tidak permanen. Tanpa SUPABASE_URL (pengembangan lokal) memakai folder uploads/.
const BUCKET = "media";
const supabase = () => {
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return url && key ? { url, key } : null;
};
export const uploadDirectory = () => join(process.cwd(), "uploads");

async function ensureBucket(s: { url: string; key: string }) {
  await fetch(`${s.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.key}`, apikey: s.key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, allowed_mime_types: ["image/webp"], file_size_limit: 6 * 1024 * 1024 }),
  });
}

export async function putImage(name: string, bytes: Buffer): Promise<void> {
  const s = supabase();
  if (!s) {
    await mkdir(uploadDirectory(), { recursive: true });
    await writeFile(join(uploadDirectory(), name), bytes, { flag: "wx" });
    return;
  }
  const upload = () => fetch(`${s.url}/storage/v1/object/${BUCKET}/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.key}`, apikey: s.key, "Content-Type": "image/webp", "Cache-Control": "31536000", "x-upsert": "false" },
    body: new Uint8Array(bytes),
  });
  let res = await upload();
  // Bucket belum ada pada unggahan pertama: buat lalu coba sekali lagi.
  if (!res.ok && (res.status === 404 || res.status === 400)) {
    await ensureBucket(s);
    res = await upload();
  }
  if (!res.ok) throw new Error(`Unggah ke Supabase Storage gagal (${res.status}).`);
}

export async function getImage(name: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const s = supabase();
  if (!s) {
    try { return new Uint8Array(await readFile(join(uploadDirectory(), name))); } catch { return null; }
  }
  const res = await fetch(`${s.url}/storage/v1/object/public/${BUCKET}/${name}`, { cache: "force-cache" });
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}
