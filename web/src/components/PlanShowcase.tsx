"use client";
import { useState } from "react";
import { FIELD_LABEL } from "@/lib/constants";
import type { CourseCard } from "@/lib/queries";
import { KitabGrid } from "@/components/KitabCard";

/** Pilihan kelas di beranda. Tab bidang ilmu hanya muncul kalau kelasnya sudah banyak. */
export function PlanShowcase({ courses, all = courses }: { courses: CourseCard[]; all?: CourseCard[] }) {
  const fields = Array.from(new Set(courses.map((c) => c.field)));
  const [active, setActive] = useState<string>("all");
  const shown = active === "all" ? courses : courses.filter((c) => c.field === active);
  return (
    <div>
      {courses.length > 4 && fields.length > 1 && (
        <div className="plan-tabs" role="group" aria-label="Filter bidang ilmu">
          {[["all", "Semua"], ...fields.map((f) => [f, FIELD_LABEL[f]])].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={active === key} onClick={() => setActive(key)}>{label}</button>
          ))}
        </div>
      )}
      <KitabGrid courses={shown} all={all} />
    </div>
  );
}
