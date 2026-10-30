/** Paket bundling: Course.bundleCourseIds berisi JSON daftar id kursus yang dibuka oleh satu pembelian. */
export function parseBundle(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? Array.from(new Set(v.filter((x): x is string => typeof x === "string" && x.length > 0))) : [];
  } catch {
    return [];
  }
}

export const isBundle = (c: { bundleCourseIds: string | null }) => parseBundle(c.bundleCourseIds).length > 0;

/** Kursus yang benar-benar dibuka saat kursus ini dibeli: isi paket, atau kursus itu sendiri. */
export const unlockedCourseIds = (c: { id: string; bundleCourseIds: string | null }) => {
  const items = parseBundle(c.bundleCourseIds);
  return items.length ? items : [c.id];
};
