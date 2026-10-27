import Link from "next/link";
import { ArrowRight, Check, MessageCircleQuestion, PlayCircle } from "lucide-react";
import { Markdown, MatanList, parseMatan } from "@/components/Markdown";
import { SubmitButton } from "@/components/SubmitButton";
import { ActionForm, Field as FormField } from "@/components/ActionForm";
import { saveNote } from "@/app/dashboard/catatan/actions";
import { NOTE_MAX } from "@/lib/learning";
import { toggleComplete } from "@/app/dashboard/kursus/[slug]/pelajaran/actions";
import { parseVideoUrl } from "@/lib/video";
import { FIELD_LABEL, FIELD_TONE, type Field } from "@/lib/constants";
import { hoursLabel, initials } from "@/lib/format";

export type LessonLite = { id: string; title: string; position: number; durationMin: number | null };

export type LessonViewProps = {
  mode: "student" | "preview" | "guest";
  course: { slug: string; title: string; field: string; teacherName: string | null };
  lesson: { id: string; title: string; position: number; durationMin: number | null; videoUrl: string | null; matan: string | null; notesMd: string | null };
  lessons: LessonLite[];
  completed: Set<string>;
  note?: string;
  askUrl?: string | null;
  basePath: string; // mis. /dashboard/kursus/slug/pelajaran
};

function VideoBox({ url }: { url: string | null }) {
  const v = parseVideoUrl(url);
  if (!v) {
    return (
      <div className="video" role="img" aria-label="Video belum tersedia">
        <div className="ph"><PlayCircle size={44} aria-hidden="true" /><span>Video pelajaran belum diunggah</span></div>
      </div>
    );
  }
  return (
    <div className="video">
      {v.kind === "youtube" ? (
        <iframe
          src={v.embedUrl}
          title="Video pelajaran"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video controls preload="metadata" src={v.src} />
      )}
    </div>
  );
}

export function LessonView({ mode, course, lesson, lessons, completed, note = "", askUrl = null, basePath }: LessonViewProps) {
  const field = course.field as Field;
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const next = idx >= 0 ? lessons[idx + 1] : undefined;
  const isDone = completed.has(lesson.id);
  const doneCount = lessons.filter((l) => completed.has(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const leftMin = lessons.filter((l) => !completed.has(l.id)).reduce((a, l) => a + (l.durationMin ?? 0), 0);
  const matan = parseMatan(lesson.matan);

  const syllabus = (
    <nav className="dash-list" aria-label="Daftar pelajaran">
      {lessons.map((l) => {
        const d = completed.has(l.id);
        const cur = l.id === lesson.id;
        return (
          <Link key={l.id} href={`${basePath}/${l.id}`} className={d ? "done" : ""} aria-current={cur ? "page" : undefined}>
            <span className="n" aria-hidden="true">{d ? "✓" : l.position}</span>
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span className="t">{l.position}. {l.title}</span>
              <small>{l.durationMin ? `${l.durationMin} menit` : "—"}{cur ? " · sedang dibuka" : d ? " · selesai" : ""}</small>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="cols">
      <div className="center">
        {mode === "preview" && <div className="preview-banner" role="status">Mode pratinjau pengajar. Progres tidak dicatat.</div>}
        {mode === "guest" && (
          <div className="alert info-box" role="status" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <span>Ini pelajaran pratinjau gratis. Daftar untuk membuka semua pelajaran.</span>
            <Link className="btn btn-primary sm" href={`/kursus/${course.slug}`}>Lihat kursus dan daftar</Link>
          </div>
        )}

        <VideoBox url={lesson.videoUrl} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className={`tag f-${FIELD_TONE[field]}`}>{FIELD_LABEL[field]}</span>
            <span className="tag plain" style={{ background: "#fff" }}>Pelajaran {lesson.position} dari {lessons.length}{lesson.durationMin ? ` · ${lesson.durationMin} menit` : ""}</span>
          </div>
          <h1>{lesson.title}</h1>
          {course.teacherName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="avatar sm" aria-hidden="true" style={{ width: 34, height: 34 }}>{initials(course.teacherName)}</span>
              <span><b style={{ fontSize: 14 }}>{course.teacherName}</b><br /><small className="muted">Pengajar</small></span>
            </div>
          )}
        </div>

        {matan.length > 0 && (
          <section className="card lesson-box" aria-labelledby="matan-h">
            <div className="sec-hd"><h2 id="matan-h">Matan</h2><span className="badge">{matan.length} kalimat</span></div>
            <MatanList blocks={matan} />
          </section>
        )}

        {lesson.notesMd && (
          <section className="card lesson-box" aria-labelledby="cat-h">
            <h2 id="cat-h">Catatan pengajar</h2>
            <Markdown source={lesson.notesMd} />
          </section>
        )}

        {mode === "student" && (
          <section className="card lesson-box" aria-labelledby="cs-h" data-testid="my-note">
            <div className="sec-hd"><h2 id="cs-h">Catatan saya</h2><Link href="/dashboard/catatan">Semua catatan</Link></div>
            <ActionForm action={saveNote} submit="Simpan catatan" pendingText="Menyimpan…">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <FormField name="body" label="Catatan pribadi (cuma kamu yang bisa lihat)" type="textarea" rows={5} defaultValue={note} maxLength={NOTE_MAX} full />
            </ActionForm>
            {askUrl && (
              <p className="ask-row">
                <MessageCircleQuestion size={18} aria-hidden="true" />
                <span>Ada yang belum paham?</span>
                <a className="btn btn-ghost sm" href={askUrl} target="_blank" rel="noopener noreferrer" data-testid="ask-wa">Tanya lewat WhatsApp</a>
              </p>
            )}
          </section>
        )}
        {mode === "student" && (
          <div className="card done-bar">
            <span className={`state${isDone ? " on" : ""}`} data-testid="done-state">
              <i aria-hidden="true"><Check size={14} /></i>
              {isDone ? "Pelajaran ini sudah selesai" : "Belum ditandai selesai"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <form action={toggleComplete}>
                <input type="hidden" name="lessonId" value={lesson.id} />
                <input type="hidden" name="done" value={isDone ? "0" : "1"} />
                <SubmitButton className={isDone ? "btn btn-ghost sm" : "btn btn-soft sm"} testId="toggle-done">{isDone ? "Batalkan tanda selesai" : "Tandai selesai"}</SubmitButton>
              </form>
              {next ? (
                <Link className="pill-dark" href={`${basePath}/${next.id}`}>Pelajaran berikutnya<i><ArrowRight size={14} aria-hidden="true" /></i></Link>
              ) : (
                <Link className="pill-dark" href="/dashboard/kursus">Selesaikan kursus<i><ArrowRight size={14} aria-hidden="true" /></i></Link>
              )}
            </div>
          </div>
        )}
        {mode === "preview" && next && (
          <div className="card done-bar"><span className="muted">Pelajaran berikutnya: {next.title}</span>
            <Link className="pill-dark" href={`${basePath}/${next.id}`}>Buka<i><ArrowRight size={14} aria-hidden="true" /></i></Link></div>
        )}

        <details className="card lesson-box syl-mobile">
          <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Silabus dan progres ({doneCount}/{lessons.length})</summary>
          <div style={{ marginTop: 12 }}>{syllabus}</div>
        </details>
      </div>

      {mode !== "guest" && (
        <aside className="right syl-desktop" aria-label="Progres dan silabus">
          {mode === "student" && (
            <>
              <h2 style={{ fontWeight: 700 }}>Progres kursus</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="ring" style={{ ["--deg" as string]: `${Math.round(pct * 3.6)}deg`, width: 96, height: 96 }} role="img" aria-label={`${pct} persen selesai`}>
                  <div style={{ width: 80, height: 80, fontSize: 20, fontWeight: 700 }} className="num"><span>{pct}%</span></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <b style={{ fontSize: 16 }}>{doneCount} dari {lessons.length} selesai</b>
                  {leftMin > 0 && <span className="small muted">Sisa sekitar {hoursLabel(leftMin).replace("± ", "")} belajar</span>}
                </div>
              </div>
            </>
          )}
          <div className="sec-hd"><h2 style={{ fontSize: 17 }}>Silabus</h2><span className="small muted">{lessons.length} pelajaran</span></div>
          {syllabus}
        </aside>
      )}
    </div>
  );
}
