import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { ActionForm, Field, InlineAction } from "@/components/ActionForm";
import { saveCourse, setCourseStatus, archiveCourse, deleteCourse, moveLesson, setLessonFlags, deleteLesson, requestPublication } from "@/app/actions/manage";
import { FIELDS, FIELD_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { db } from "@/lib/db";
import { SlugField } from "./SlugField";
import { LessonSort } from "./LessonSort";

type Teacher = { id: string; displayName: string };

export async function CourseEditor({ courseId, base, isAdmin, teachers }: { courseId: string | null; base: string; isAdmin: boolean; teachers: Teacher[] }) {
  const course = courseId
    ? await db.course.findUnique({
        where: { id: courseId },
        include: { lessons: { orderBy: { position: "asc" } }, _count: { select: { enrollments: true, orders: true } } },
      })
    : null;

  const state = course?.archivedAt ? "Diarsipkan" : course?.status === "PUBLISHED" ? "Tayang" : "Draf";

  return (
    <>
      {course && (
        <div className="card pad" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge ${course.archivedAt ? "off" : course.status === "PUBLISHED" ? "ok" : "wait"}`} data-testid="course-state">{state}</span>
            <span className="small muted">{course._count.enrollments} pendaftar · {rupiah(course.priceRupiah)}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
            <Link className="btn btn-ghost sm" href={`/kursus/${course.slug}?pratinjau=1`}>Lihat halaman publik</Link>
            <Link className="btn btn-ghost sm" href={`${base}/${course.id}/siswa`}>User</Link>
            {isAdmin && !course.archivedAt && (
              course.status === "PUBLISHED"
                ? <InlineAction action={setCourseStatus} fields={{ id: course.id, to: "DRAFT" }} label="Kembalikan ke draf" />
                : <InlineAction action={setCourseStatus} fields={{ id: course.id, to: "PUBLISHED" }} label="Tayangkan" className="btn btn-primary sm" testId="publish" />
            )}
          </div>
        </div>
      )}
      {course && !isAdmin && course.status !== "PUBLISHED" && <div className="card pad"><p className="muted">Kursus berstatus draf. Ajukan ke admin setelah pelajaran siap.</p><InlineAction action={requestPublication} fields={{id:course.id}} label="Ajukan tayang" className="btn btn-primary sm"/></div>}

      <section className="card pad" aria-labelledby="info-h">
        <h2 id="info-h" style={{ marginBottom: 16 }}>{course ? "Informasi kursus" : "Kursus baru"}</h2>
        <ActionForm action={saveCourse} submit={course ? "Simpan perubahan" : "Buat kursus (draf)"} testId="save-course">
          {course && <input type="hidden" name="id" value={course.id} />}
          <Field name="title" label="Judul (Latin)" defaultValue={course?.title} placeholder="Matan al-Ajurrumiyyah" />
          <Field name="titleAr" label="Judul Arab (untuk sampul)" defaultValue={course?.titleAr} dir="rtl" lang="ar" placeholder="متن الآجرومية" />
          <SlugField initial={course?.slug??""}/>
          <Field name="field" label="Bidang ilmu" type="select" defaultValue={course?.field ?? "NAHWU"} options={FIELDS.map((f) => ({ value: f, label: FIELD_LABEL[f] }))} />
          <Field name="level" label="Jenjang" type="select" defaultValue={course?.level ?? "ULA"} options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] }))} />
          {isAdmin ? (
            <>
              <Field name="teacherId" label="Pengajar" type="select" defaultValue={course?.teacherId ?? ""} options={[{ value: "", label: "— pilih pengajar —" }, ...teachers.map((t) => ({ value: t.id, label: t.displayName }))]} />
              <Field name="priceRupiah" label="Harga (Rp)" type="number" defaultValue={course?.priceRupiah ?? 0} min={0} max={50000000} hint="0 = gratis. Maksimal Rp 50.000.000. Pembeli lama tidak terpengaruh." />
              <Field name="sortOrder" label="Urutan di katalog" type="number" defaultValue={course?.sortOrder ?? 0} min={0} />
            </>
          ) : (
            <p className="small muted full">Harga dan pengajar diatur oleh admin. Kursus baru dibuat sebagai draf.</p>
          )}
          <Field name="description" label="Deskripsi (maks 1.000 karakter, boleh Markdown)" type="textarea" rows={5} full defaultValue={course?.description} />
        </ActionForm>
      </section>

      {course && (
        <section className="card" aria-labelledby="pel-h">
          <div className="sec-hd" style={{ padding: "20px 24px 8px" }}>
            <h2 id="pel-h">Pelajaran ({course.lessons.length})</h2>
            <Link className="btn btn-primary sm" href={`${base}/${course.id}/pelajaran/baru`}><Plus size={14} aria-hidden="true" /> Tambah pelajaran</Link>
          </div>
          {course.lessons.length>1&&<LessonSort courseId={course.id} lessons={course.lessons}/>}
          {course.lessons.length === 0 ? (
            <p className="muted" style={{ padding: "8px 24px 24px" }}>Belum ada pelajaran. Tambahkan pelajaran pertama.</p>
          ) : (
            <div className="table-box">
              <table className="t">
                <thead><tr><th>No</th><th>Judul</th><th>Status</th><th>Pratinjau gratis</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {course.lessons.map((l, i) => (
                    <tr key={l.id}>
                      <td className="num">{l.position}</td>
                      <td style={{ fontWeight: 500 }}>{l.title}{l.durationMin ? <span className="small muted"> · {l.durationMin} mnt</span> : null}</td>
                      <td>
                        <InlineAction action={setLessonFlags} fields={{ courseId: course.id, lessonId: l.id, status: l.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }}
                          label={<span className={`badge ${l.status === "PUBLISHED" ? "ok" : "wait"}`}>{l.status === "PUBLISHED" ? "Tayang" : "Draf"}</span>} className="btn btn-ghost sm" />
                      </td>
                      <td>
                        <InlineAction action={setLessonFlags} fields={{ courseId: course.id, lessonId: l.id, preview: l.isFreePreview ? "0" : "1" }}
                          label={l.isFreePreview ? "Ya (klik untuk cabut)" : "Jadikan pratinjau"} className="btn btn-ghost sm" />
                      </td>
                      <td>
                        <div className="row-actions" style={{ alignItems: "flex-start" }}>
                          <InlineAction action={moveLesson} fields={{ courseId: course.id, lessonId: l.id, dir: "up" }} label={<><ArrowUp size={14} aria-hidden="true" /><span className="sr-only">Naikkan</span></>} />
                          <InlineAction action={moveLesson} fields={{ courseId: course.id, lessonId: l.id, dir: "down" }} label={<><ArrowDown size={14} aria-hidden="true" /><span className="sr-only">Turunkan</span></>} />
                          <Link className="btn btn-ghost sm" href={`${base}/${course.id}/pelajaran/${l.id}`}><Pencil size={14} aria-hidden="true" /> Edit</Link>
                          <InlineAction action={deleteLesson} fields={{ courseId: course.id, lessonId: l.id }} label="Hapus" className="btn btn-ghost sm" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {course && (
        <section className="card pad" aria-labelledby="bahaya-h" style={{ border: "1px solid var(--danger-soft)" }}>
          <h2 id="bahaya-h" style={{ marginBottom: 8 }}>Arsip dan hapus</h2>
          {course.archivedAt ? (
            <>
              <p className="muted" style={{ marginBottom: 12 }}>Kursus diarsipkan sejak {course.archivedAt.toLocaleDateString("id-ID")}. Tidak tampil di katalog; user lama tetap bisa belajar.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                <InlineAction action={archiveCourse} fields={{ id: course.id, restore: "1" }} label="Pulihkan kursus" className="btn btn-primary sm" />
              </div>
              {isAdmin && (
                <details style={{ marginTop: 16 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 44, display: "flex", alignItems: "center", color: "var(--danger)" }}>Hapus permanen…</summary>
                  <p className="small muted" style={{ margin: "8px 0 12px" }}>Hanya bisa jika tidak ada pembeli. Tindakan ini tidak bisa dibatalkan.</p>
                  <ActionForm action={deleteCourse} submit="Hapus permanen" submitClass="btn btn-danger" className="form-grid">
                    <input type="hidden" name="id" value={course.id} />
                    <Field name="confirm" label={`Ketik judul kursus untuk konfirmasi: ${course.title}`} full />
                  </ActionForm>
                </details>
              )}
            </>
          ) : (
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 44, display: "flex", alignItems: "center" }}>Arsipkan kursus…</summary>
              <p className="small muted" style={{ margin: "8px 0 12px" }}>Kursus hilang dari katalog publik. User yang sudah terdaftar tetap bisa belajar. Bisa dipulihkan kapan saja.</p>
              <ActionForm action={archiveCourse} submit="Arsipkan kursus" submitClass="btn btn-danger" className="form-grid">
                <input type="hidden" name="id" value={course.id} />
                <Field name="confirm" label={`Ketik judul kursus untuk konfirmasi: ${course.title}`} full />
              </ActionForm>
            </details>
          )}
        </section>
      )}
    </>
  );
}
