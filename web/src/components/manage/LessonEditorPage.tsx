import { ActionForm, Field } from "@/components/ActionForm";
import { MatanEditor, NotesEditor } from "@/components/LessonEditors";
import { parseMatan } from "@/components/Markdown";
import { saveLesson } from "@/app/actions/manage";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export async function LessonEditorPage({ courseId, lessonId }: { courseId: string; lessonId: string | null }) {
  const lesson = lessonId ? await db.lesson.findFirst({ where: { id: lessonId, courseId } }) : null;
  if (lessonId && !lesson) notFound();
  return (
    <section className="card pad" aria-labelledby="les-h">
      <h2 id="les-h" style={{ marginBottom: 16 }}>{lesson ? `Pelajaran ${lesson.position}` : "Pelajaran baru"}</h2>
      <ActionForm action={saveLesson} submit={lesson ? "Simpan pelajaran" : "Buat pelajaran (draf)"} testId="save-lesson">
        <input type="hidden" name="courseId" value={courseId} />
        {lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
        <Field name="title" label="Judul pelajaran" defaultValue={lesson?.title} full />
        <Field name="durationMin" label="Durasi (menit)" type="number" defaultValue={lesson?.durationMin} min={0} max={600} />
        <Field name="videoUrl" label="URL video" defaultValue={lesson?.videoUrl} placeholder="https://www.youtube.com/watch?v=…" hint="YouTube atau file .mp4/.webm dari host yang diizinkan. Tautan lain ditolak." />
        <MatanEditor initial={parseMatan(lesson?.matan)} />
        <NotesEditor initial={lesson?.notesMd ?? ""} />
      </ActionForm>
    </section>
  );
}
