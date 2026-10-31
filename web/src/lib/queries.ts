import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import { normalizeArabic } from "@/lib/slug";
import { FIELD_LABEL, type Field, type Level } from "@/lib/constants";
import { parseBundle } from "@/lib/bundle";

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  titleAr: true,
  description: true,
  field: true,
  level: true,
  priceRupiah: true,
  status: true,
  archivedAt: true,
  bundleCourseIds: true,
  coverUrl: true,
  teacher: { select: { id: true, displayName: true, bio: true, alumni: true, sanad: true, photoUrl: true } },
  lessons: { where: { status: "PUBLISHED" }, select: { id: true, durationMin: true, isFreePreview:true } },
} as const;

export type CourseCard = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  description: string;
  field: Field;
  level: Level;
  priceRupiah: number;
  teacherName: string | null;
  /** Foto kitab yang dikaji (sampul kartu); null bila belum diisi. */
  image: string | null;
  lessonCount: number;
  totalMin: number;
  hasFreePreview:boolean;
  /** Id kursus isi paket; kosong untuk kursus biasa. */
  bundleOf: string[];
};

export const isBundleCard = (c: Pick<CourseCard, "bundleOf">) => c.bundleOf.length > 0;

type Raw = Awaited<ReturnType<typeof listRaw>>[number];
function toCard(c: Raw): CourseCard {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    titleAr: c.titleAr,
    description: c.description,
    field: c.field as Field,
    level: c.level as Level,
    priceRupiah: c.priceRupiah,
    teacherName: c.teacher?.displayName ?? null,
    image: c.coverUrl,
    lessonCount: c.lessons.length,
    totalMin: c.lessons.reduce((a, l) => a + (l.durationMin ?? 0), 0),
    hasFreePreview:c.lessons.some(l=>l.isFreePreview),
    bundleOf: parseBundle(c.bundleCourseIds),
  };
}

/** Paket menampilkan jumlah pelajaran dan pengajar dari kursus-kursus isinya. */
function withBundleTotals(cards: CourseCard[]): CourseCard[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  return cards.map((c) => {
    if (!c.bundleOf.length) return c;
    const items = c.bundleOf.map((id) => byId.get(id)).filter((x): x is CourseCard => !!x);
    const teachers = Array.from(new Set(items.map((i) => i.teacherName).filter((t): t is string => !!t)));
    return {
      ...c,
      lessonCount: items.reduce((a, i) => a + i.lessonCount, 0),
      totalMin: items.reduce((a, i) => a + i.totalMin, 0),
      teacherName: c.teacherName ?? (teachers.length === 1 ? teachers[0] : null),
    };
  });
}

async function listRaw() {
  return db.course.findMany({
    where: { status: "PUBLISHED", archivedAt: null },
    select: courseSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Semua kursus tayang. Dicache 5 menit dan dibuang lewat tag "catalog" saat admin menyimpan. */
export const getPublishedCourses = unstable_cache(
  async (): Promise<CourseCard[]> => withBundleTotals((await listRaw()).map(toCard)),
  ["published-courses"],
  { tags: ["catalog", "home"], revalidate: 300 },
);

export type CatalogFilter = { q?: string; field?: string; level?: string; free?: boolean; sort?: string };

export function filterCourses(all: CourseCard[], f: CatalogFilter): CourseCard[] {
  let out = all;
  const q = (f.q ?? "").trim();
  if (q.length >= 2) {
    const lq = q.toLowerCase();
    const aq = normalizeArabic(q);
    out = out.filter(
      (c) =>
        c.title.toLowerCase().includes(lq) ||
        (c.titleAr && normalizeArabic(c.titleAr).includes(aq)) ||
        (c.teacherName ?? "").toLowerCase().includes(lq) ||
        FIELD_LABEL[c.field].toLowerCase().includes(lq),
    );
  }
  if (f.field) out = out.filter((c) => c.field === f.field);
  if (f.level) out = out.filter((c) => c.level === f.level);
  if (f.free) out = out.filter((c) => c.priceRupiah === 0);
  if (f.sort === "murah") out = [...out].sort((a, b) => a.priceRupiah - b.priceRupiah);
  else if (f.sort === "mahal") out = [...out].sort((a, b) => b.priceRupiah - a.priceRupiah);
  return out;
}

export const getCourseBySlug = cache(async (slug: string) => {
  return db.course.findUnique({
    where: { slug },
    include: {
      teacher: true,
      lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" }, select: { id: true, title: true, position: true, durationMin: true, isFreePreview: true } },
    },
  });
});

export const getTeachersForHome = unstable_cache(
  async () => db.teacherProfile.findMany({ where: { showOnHome: true }, orderBy: { displayName: "asc" } }),
  ["home-teachers"],
  { tags: ["home"], revalidate: 300 },
);

/** Peta marhalah: bidang × jenjang -> kursus pertama. */
export function buildMarhalahMap(courses: CourseCard[]) {
  const levels = ["ULA", "WUSTHA", "ULYA"] as Level[];
  // Paket bundling tidak masuk peta; yang dipetakan kursus satuannya.
  const singles = courses.filter((c) => !c.bundleOf.length);
  const fields = Array.from(new Set(singles.map((c) => c.field)));
  return { fields, levels, cell: (f: Field, l: Level) => singles.find((c) => c.field === f && c.level === l) ?? null };
}
