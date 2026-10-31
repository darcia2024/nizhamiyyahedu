import { cache } from "react";
import { db } from "@/lib/db";
import type { Field, Level } from "@/lib/constants";

export type CourseProgress = {
  courseId: string;
  slug: string;
  title: string;
  titleAr: string | null;
  field: Field;
  level: Level;
  /** Thumbnail kelas (16:9); null bila belum diisi. */
  image: string | null;
  teacherName: string | null;
  total: number;
  done: number;
  remainingMin: number;
  lastOpenedAt: Date | null;
  resumeLessonId: string | null;
  resumeTitle: string | null;
  resumePosition: number | null;
  finished: boolean;
};

/** Aturan "Lanjutkan belajar" (PRD 9.2): pelajaran terakhir dibuka bila belum selesai, jika tidak yang belum selesai pertama. */
export function pickResume<L extends { id: string; position: number }>(
  lessons: L[],
  completed: Set<string>,
  lastOpened: Map<string, Date>,
): L | null {
  const sorted = [...lessons].sort((a, b) => a.position - b.position);
  let last: L | null = null;
  let lastAt = 0;
  for (const l of sorted) {
    const t = lastOpened.get(l.id)?.getTime() ?? 0;
    if (t > lastAt) { lastAt = t; last = l; }
  }
  if (last && !completed.has(last.id)) return last;
  return sorted.find((l) => !completed.has(l.id)) ?? null;
}

export const getUserProgress = cache(async (userId: string): Promise<CourseProgress[]> => {
  const enrollments = await db.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      course: {
        include: {
          teacher: { select: { displayName: true } },
          lessons: { where: { status: "PUBLISHED" }, select: { id: true, title: true, position: true, durationMin: true }, orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const prog = await db.lessonProgress.findMany({ where: { userId } });
  const completed = new Set(prog.filter((p) => p.completedAt).map((p) => p.lessonId));
  const opened = new Map(prog.map((p) => [p.lessonId, p.lastOpenedAt]));

  const rows = enrollments.map((e) => {
    const c = e.course;
    const ls = c.lessons;
    const done = ls.filter((l) => completed.has(l.id)).length;
    const next = pickResume(ls, completed, opened);
    const times = ls.map((l) => opened.get(l.id)?.getTime() ?? 0);
    const lastAt = times.length ? Math.max(...times) : 0;
    return {
      courseId: c.id,
      slug: c.slug,
      title: c.title,
      titleAr: c.titleAr,
      field: c.field as Field,
      level: c.level as Level,
      image: c.coverUrl,
      teacherName: c.teacher?.displayName ?? null,
      total: ls.length,
      done,
      remainingMin: ls.filter((l) => !completed.has(l.id)).reduce((a, l) => a + (l.durationMin ?? 0), 0),
      lastOpenedAt: lastAt ? new Date(lastAt) : null,
      resumeLessonId: next?.id ?? null,
      resumeTitle: next?.title ?? null,
      resumePosition: next?.position ?? null,
      finished: ls.length > 0 && done === ls.length,
    } satisfies CourseProgress;
  });
  // kursus yang terakhir dibuka di depan
  return rows.sort((a, b) => (b.lastOpenedAt?.getTime() ?? 0) - (a.lastOpenedAt?.getTime() ?? 0));
});
