import { WIB } from "./constants";

export function rupiah(n: number): string {
  if (n <= 0) return "Gratis";
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

export function dateTimeWib(d: Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: WIB,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(d)
      .replace(/\./g, ":") + " WIB"
  );
}

export function dateWib(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: WIB, day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function hoursLabel(totalMin: number): string {
  if (totalMin <= 0) return "";
  const h = totalMin / 60;
  return h < 1 ? `± ${totalMin} menit` : `± ${Math.round(h * 10) / 10} jam`.replace(".", ",");
}

/** Data contoh seperti "[Nama Ustadz]" belum layak ditampilkan ke pengunjung. */
export function isPlaceholder(s?: string | null): boolean {
  return !s || s.includes("[");
}

export function firstName(name?: string | null): string {
  return (name ?? "").trim().split(/\s+/)[0] || "Penuntut ilmu";
}

export function initials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
