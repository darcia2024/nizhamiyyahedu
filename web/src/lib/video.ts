const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export type VideoSource =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "file"; src: string };

function allowedFileHosts(): string[] {
  return (process.env.VIDEO_HOST_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Mengembalikan sumber video aman, atau null bila URL tidak diizinkan (PRD 9.4). */
export function parseVideoUrl(input: string | null | undefined): VideoSource | null {
  if (!input) return null;
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
    if (id && YT_ID.test(id)) {
      return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    return null;
  }

  if (/\.(mp4|webm)$/i.test(u.pathname) && allowedFileHosts().includes(host)) {
    return { kind: "file", src: u.toString() };
  }
  return null;
}
