import { parseVideoUrl } from "@/lib/video";

/** Judul video lewat oEmbed YouTube (tanpa API key). Video privat atau gangguan jaringan menghasilkan null. */
export async function fetchYoutubeTitle(videoUrl: string | null | undefined): Promise<string | null> {
  const v = parseVideoUrl(videoUrl);
  if (v?.kind !== "youtube") return null;
  const watch = `https://www.youtube.com/watch?v=${v.embedUrl.split("/").pop()}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const title = String(((await res.json()) as { title?: unknown }).title ?? "").trim().slice(0, 120).trim();
    return title.length >= 3 ? title : null;
  } catch {
    return null;
  }
}
