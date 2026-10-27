import Link from "next/link";
import { NotebookPen, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InlineAction } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { dateTimeWib } from "@/lib/format";
import { FIELD_LABEL, FIELD_TONE, type Field } from "@/lib/constants";
import { deleteNote } from "./actions";

export const metadata = { title: "Catatan saya" };

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("/dashboard/catatan");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);

  const notes = await db.lessonNote.findMany({
    where: { userId: user.id, ...(q.length >= 2 ? { body: { contains: q } } : {}) },
    include: { lesson: { select: { id: true, title: true, position: true, course: { select: { slug: true, title: true, field: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  const groups = new Map<string, { slug: string; title: string; field: Field; items: typeof notes }>();
  for (const n of notes) {
    const c = n.lesson.course;
    if (!groups.has(c.slug)) groups.set(c.slug, { slug: c.slug, title: c.title, field: c.field as Field, items: [] });
    groups.get(c.slug)!.items.push(n);
  }

  return (
    <AppShell user={user} active="catatan">
      <div className="page-hd">
        <h1>Catatan saya</h1>
        <span className="muted">Semua catatan pribadimu dari tiap pelajaran. Cuma kamu yang bisa lihat.</span>
      </div>

      <form className="manage-filters" method="get" role="search">
        <label className="grow"><span className="sr-only">Cari catatan</span><input className="input" name="q" defaultValue={q} maxLength={80} placeholder="Cari isi catatan" /></label>
        <button className="btn btn-primary"><Search size={16} aria-hidden="true" /> Cari</button>
        {q && <Link className="btn btn-ghost" href="/dashboard/catatan">Hapus pencarian</Link>}
      </form>

      {groups.size === 0 ? (
        <div className="empty-state">
          <NotebookPen size={28} aria-hidden="true" />
          <h2>{q ? "Catatan nggak ketemu" : "Belum ada catatan"}</h2>
          <p className="muted">{q ? "Coba kata kunci lain." : "Buka pelajaran lalu tulis di bagian Catatan saya. Catatannya otomatis terkumpul di sini."}</p>
          <Link className="btn btn-primary" href="/dashboard/kursus">Buka ruang belajar</Link>
        </div>
      ) : (
        Array.from(groups.values()).map((g) => (
          <section key={g.slug} className="stack" aria-label={`Catatan ${g.title}`}>
            <div className="sec-hd">
              <h2><span className={`tag f-${FIELD_TONE[g.field]}`} style={{ marginRight: 8 }}>{FIELD_LABEL[g.field]}</span>{g.title}</h2>
              <span className="small muted">{g.items.length} catatan</span>
            </div>
            {g.items.map((n) => (
              <article key={n.lessonId} className="card note-card">
                <div className="note-hd">
                  <Link href={`/dashboard/kursus/${g.slug}/pelajaran/${n.lessonId}`}><b>Pelajaran {n.lesson.position}: {n.lesson.title}</b></Link>
                  <span className="small muted">{dateTimeWib(n.updatedAt)}</span>
                </div>
                <p className="note-body">{n.body}</p>
                <div className="note-actions">
                  <Link className="btn btn-ghost sm" href={`/dashboard/kursus/${g.slug}/pelajaran/${n.lessonId}`}>Buka pelajaran</Link>
                  <InlineAction action={deleteNote} fields={{ lessonId: n.lessonId }} label="Hapus" className="btn btn-ghost sm" />
                </div>
              </article>
            ))}
          </section>
        ))
      )}
    </AppShell>
  );
}
