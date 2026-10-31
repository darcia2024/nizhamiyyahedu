"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CircleAlert, NotebookPen, Pin, PinOff, Plus, Search, Trash2, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { FREE_NOTE_MAX, NOTE_MAX, NOTE_TITLE_MAX, type NoteItem } from "@/lib/notes";
import "@/styles/notes.css";

type Course = { id: string; title: string };
type Save = "saved" | "dirty" | "saving" | "error";

const DEBOUNCE_MS = 800;
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);

function when(iso: string) {
  const d = new Date(iso);
  const today = dayKey(new Date());
  if (dayKey(d) === today) return timeFmt.format(d).replace(".", ":");
  const y = new Date(Date.now() - 86400000);
  return dayKey(d) === dayKey(y) ? "Kemarin" : dateFmt.format(d);
}

const firstLine = (s: string) => s.split("\n").find((l) => l.trim())?.trim().slice(0, 80) ?? "";
const heading = (n: NoteItem) => n.title.trim() || (n.lesson ? `Pelajaran ${n.lesson.position}: ${n.lesson.title}` : firstLine(n.body) || "Catatan baru");
/** Cuplikan di daftar: isi catatan; untuk catatan tanpa judul, baris pertamanya sudah jadi judul jadi yang ditampilkan sisanya. */
const snippet = (n: NoteItem) => {
  const lines = n.body.split("\n").map((l) => l.trim()).filter(Boolean);
  const text = n.title.trim() || n.lesson ? lines.join(" ") : lines.slice(1).join(" ");
  return text.slice(0, 110);
};
const isEmpty = (n: NoteItem) => !n.title.trim() && !n.body.trim();

/**
 * Aplikasi catatan: daftar di kiri, editor di kanan. Mengetik langsung tersimpan sendiri (jeda sebentar setelah berhenti
 * mengetik, saat pindah catatan, dan saat tab ditinggalkan), jadi tidak ada tombol simpan.
 * Catatan bebas dan catatan per pelajaran tampil bersama; catatan pelajaran judulnya otomatis dari pelajarannya.
 */
export function NotesApp({ initial, courses, initialKey, startNew }: { initial: NoteItem[]; courses: Course[]; initialKey: string | null; startNew: boolean }) {
  // Sumber kebenaran sinkron: Map diubah seketika (tanpa menunggu render), lalu disalin ke state untuk digambar.
  const store = useRef(new Map<string, NoteItem>(initial.map((n) => [n.cid, n])));
  const [items, setItems] = useState<NoteItem[]>(initial);
  const [sel, setSelState] = useState<string | null>(initialKey && store.current.has(initialKey) ? initialKey : null);
  const selRef = useRef<string | null>(sel);
  const setSel = useCallback((cid: string | null) => { selRef.current = cid; setSelState(cid); }, []);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [saveState, setSaveState] = useState<Record<string, Save>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inflight = useRef(new Set<string>());
  const again = useRef(new Set<string>());
  const dirty = useRef(new Set<string>());
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const commit = useCallback(() => setItems(Array.from(store.current.values())), []);
  const mark = useCallback((cid: string, s: Save) => setSaveState((m) => ({ ...m, [cid]: s })), []);
  const patch = useCallback((cid: string, p: Partial<NoteItem>, touch = true) => {
    const cur = store.current.get(cid);
    if (!cur) return;
    store.current.set(cid, { ...cur, ...p, ...(touch ? { updatedAt: new Date().toISOString() } : {}) });
    commit();
  }, [commit]);

  // ---------- Simpan ----------
  const requestFor = useCallback((n: NoteItem): { url: string; init: RequestInit } | null => {
    const headers = { "Content-Type": "application/json" };
    if (n.kind === "lesson") {
      if (!n.serverId || !n.body.trim()) return null; // catatan pelajaran yang dikosongkan dihapus saat ditinggalkan, bukan saat mengetik
      return { url: withBase(`/api/notes/lesson/${n.serverId}`), init: { method: "PUT", headers, body: JSON.stringify({ body: n.body, pinned: n.pinned }) } };
    }
    if (!n.serverId && isEmpty(n)) return null;
    const payload = JSON.stringify({ title: n.title, body: n.body, pinned: n.pinned, courseId: n.courseId });
    return n.serverId
      ? { url: withBase(`/api/notes/${n.serverId}`), init: { method: "PATCH", headers, body: payload } }
      : { url: withBase("/api/notes"), init: { method: "POST", headers, body: payload } };
  }, []);

  const save = useCallback(async (cid: string) => {
    const t = timers.current.get(cid);
    if (t) { clearTimeout(t); timers.current.delete(cid); }
    const n = store.current.get(cid);
    if (!n) return;
    if (inflight.current.has(cid)) { again.current.add(cid); return; }
    const req = requestFor(n);
    if (!req) { dirty.current.delete(cid); mark(cid, "saved"); return; }
    inflight.current.add(cid);
    dirty.current.delete(cid);
    mark(cid, "saving");
    try {
      const res = await fetch(req.url, req.init);
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Gagal menyimpan.");
      if (n.kind === "free" && !n.serverId && j.id) patch(cid, { serverId: j.id }, false);
      setMessage(null);
      mark(cid, "saved");
    } catch (e) {
      dirty.current.add(cid);
      mark(cid, "error");
      setMessage(e instanceof Error && e.message ? e.message : "Gagal menyimpan. Periksa koneksimu.");
    } finally {
      inflight.current.delete(cid);
      if (again.current.delete(cid)) void save(cid);
    }
  }, [mark, patch, requestFor]);

  const queue = useCallback((cid: string, delay = DEBOUNCE_MS) => {
    const t = timers.current.get(cid);
    if (t) clearTimeout(t);
    dirty.current.add(cid);
    mark(cid, "dirty");
    timers.current.set(cid, setTimeout(() => void save(cid), delay));
  }, [mark, save]);

  /** Kirim semua yang belum tersimpan, aman dipakai saat tab ditutup (keepalive). */
  const flush = useCallback(() => {
    for (const cid of Array.from(dirty.current)) {
      const t = timers.current.get(cid);
      if (t) { clearTimeout(t); timers.current.delete(cid); }
      const n = store.current.get(cid);
      const req = n && requestFor(n);
      if (req) void fetch(req.url, { ...req.init, keepalive: true }).catch(() => undefined);
      dirty.current.delete(cid);
    }
  }, [requestFor]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (sel) void save(sel); }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("keydown", onKey);
      flush();
    };
  }, [flush, save, sel]);

  // ---------- Aksi ----------
  const remove = useCallback((cid: string) => {
    const n = store.current.get(cid);
    if (!n) return;
    const t = timers.current.get(cid);
    if (t) { clearTimeout(t); timers.current.delete(cid); }
    dirty.current.delete(cid);
    store.current.delete(cid);
    commit();
    if (n.serverId) {
      const url = n.kind === "free" ? `/api/notes/${n.serverId}` : `/api/notes/lesson/${n.serverId}`;
      void fetch(withBase(url), { method: "DELETE", keepalive: true }).catch(() => undefined);
    }
  }, [commit]);

  /** Catatan yang ditinggalkan dalam keadaan kosong tidak perlu disimpan: dibuang. */
  const leave = useCallback((cid: string | null) => {
    if (!cid) return;
    const n = store.current.get(cid);
    if (n && isEmpty(n)) remove(cid);
    else if (dirty.current.has(cid)) void save(cid);
  }, [remove, save]);

  const select = useCallback((cid: string | null) => {
    setConfirmDel(false);
    const prev = selRef.current;
    if (prev && prev !== cid) leave(prev);
    setSel(cid);
  }, [leave, setSel]);

  const create = useCallback(() => {
    const cid = `t:${crypto.randomUUID()}`;
    const fixed = courseFilter && courses.some((c) => c.id === courseFilter) ? courseFilter : null;
    store.current.set(cid, { cid, kind: "free", serverId: null, title: "", body: "", pinned: false, updatedAt: new Date().toISOString(), courseId: fixed, courseTitle: courses.find((c) => c.id === fixed)?.title ?? null });
    commit();
    select(cid);
    setQuery("");
    setTimeout(() => titleRef.current?.focus(), 0);
  }, [commit, courseFilter, courses, select]);

  useEffect(() => { if (startNew) create(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Tampilan ----------
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((n) => (!courseFilter || n.courseId === courseFilter) && (!q || [n.title, n.body, n.lesson?.title, n.courseTitle].some((s) => s?.toLowerCase().includes(q))))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [items, query, courseFilter]);
  const pinned = visible.filter((n) => n.pinned);
  const rest = visible.filter((n) => !n.pinned);
  const cur = sel ? items.find((n) => n.cid === sel) ?? null : null;
  const state: Save = (cur && saveState[cur.cid]) || "saved";
  const max = cur?.kind === "lesson" ? NOTE_MAX : FREE_NOTE_MAX;

  const row = (n: NoteItem) => (
    <li key={n.cid}>
      <button type="button" className="nt-item" aria-current={n.cid === sel ? "true" : undefined} onClick={() => select(n.cid)}>
        <span className="nt-item-top">
          <b dir="auto">{heading(n)}</b>
          {n.pinned && <Pin size={13} aria-label="Disematkan" />}
        </span>
        {(snippet(n) || !n.body.trim()) && <span className="nt-item-snip" dir="auto">{snippet(n) || "Belum ada isi"}</span>}
        <span className="nt-item-meta">
          <time dateTime={n.updatedAt} suppressHydrationWarning>{when(n.updatedAt)}</time>
          {n.lesson ? <i>Pelajaran {n.lesson.position}</i> : null}
          {n.courseTitle ? <i>{n.courseTitle}</i> : null}
        </span>
      </button>
    </li>
  );

  return (
    <div className={`nt${cur ? " is-editing" : ""}`}>
      <aside className="nt-list" aria-label="Daftar catatan">
        <header>
          <h1>Catatan</h1>
          <button type="button" className="nt-new" onClick={create}><Plus size={17} aria-hidden="true" /> Catatan baru</button>
        </header>
        <div className="nt-tools">
          <label className="nt-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Cari catatan</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari catatan" maxLength={80} />
            {query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery("")}><X size={14} aria-hidden="true" /></button>}
          </label>
          {courses.length > 0 && (
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Saring per kelas">
              <option value="">Semua kelas</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
        </div>
        <div className="nt-scroll">
          {visible.length === 0 ? (
            <p className="nt-none">{items.length ? "Catatan nggak ketemu." : "Belum ada catatan. Klik “Catatan baru” untuk mulai menulis."}</p>
          ) : (
            <>
              {pinned.length > 0 && <><h2>Disematkan</h2><ul>{pinned.map(row)}</ul></>}
              {rest.length > 0 && <>{pinned.length > 0 && <h2>Lainnya</h2>}<ul>{rest.map(row)}</ul></>}
            </>
          )}
        </div>
      </aside>

      <section className="nt-editor" aria-label="Editor catatan">
        {cur ? (
          <>
            <header className="nt-bar">
              <button type="button" className="nt-back" onClick={() => select(null)}><ArrowLeft size={18} aria-hidden="true" /> Catatan</button>
              <span className={`nt-state is-${state}`} role="status" aria-live="polite">
                {state === "saving" ? "Menyimpan…" : state === "dirty" ? "Mengetik…" : state === "error" ? <><CircleAlert size={14} aria-hidden="true" /> Belum tersimpan</> : <><Check size={14} aria-hidden="true" /> Tersimpan</>}
              </span>
              <span className="nt-grow" />
              <button type="button" className="nt-icon" aria-pressed={cur.pinned} aria-label={cur.pinned ? "Lepas sematan" : "Sematkan"} title={cur.pinned ? "Lepas sematan" : "Sematkan"} onClick={() => { patch(cur.cid, { pinned: !cur.pinned }, false); queue(cur.cid, 0); }}>
                {cur.pinned ? <PinOff size={18} aria-hidden="true" /> : <Pin size={18} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={`nt-icon nt-del${confirmDel ? " is-confirm" : ""}`}
                aria-label={confirmDel ? "Klik lagi untuk menghapus" : "Hapus catatan"}
                title={confirmDel ? "Klik lagi untuk menghapus" : "Hapus catatan"}
                onClick={() => {
                  if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 5000); return; }
                  setConfirmDel(false);
                  remove(cur.cid);
                  setSel(null);
                }}
              >
                <Trash2 size={18} aria-hidden="true" />{confirmDel && <span>Yakin?</span>}
              </button>
            </header>

            {message && <p className="nt-msg" role="alert">{message}</p>}

            {cur.kind === "free" ? (
              <>
                <input
                  ref={titleRef}
                  className="nt-title"
                  dir="auto"
                  value={cur.title}
                  maxLength={NOTE_TITLE_MAX}
                  placeholder="Judul"
                  aria-label="Judul catatan"
                  onChange={(e) => { patch(cur.cid, { title: e.target.value }); queue(cur.cid); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); bodyRef.current?.focus(); } }}
                />
                <div className="nt-meta">
                  <span suppressHydrationWarning>Diubah {when(cur.updatedAt)}</span>
                  {courses.length > 0 && (
                    <label>
                      <span className="sr-only">Kelas</span>
                      <select
                        value={cur.courseId ?? ""}
                        onChange={(e) => { const id = e.target.value || null; patch(cur.cid, { courseId: id, courseTitle: courses.find((c) => c.id === id)?.title ?? null }, false); queue(cur.cid, 0); }}
                      >
                        <option value="">Tanpa kelas</option>
                        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              </>
            ) : (
              <div className="nt-lesson">
                <NotebookPen size={16} aria-hidden="true" />
                <Link href={`/dashboard/kursus/${cur.lesson?.courseSlug}/pelajaran/${cur.serverId}`}>
                  Pelajaran {cur.lesson?.position}: {cur.lesson?.title}
                </Link>
                {cur.courseTitle && <span>· {cur.courseTitle}</span>}
                <span className="nt-grow" />
                <span suppressHydrationWarning>Diubah {when(cur.updatedAt)}</span>
              </div>
            )}

            <textarea
              ref={bodyRef}
              className="nt-body"
              dir="auto"
              value={cur.body}
              maxLength={max}
              placeholder={cur.kind === "lesson" ? "Catatan untuk pelajaran ini…" : "Tulis catatanmu di sini…"}
              aria-label="Isi catatan"
              spellCheck
              onChange={(e) => { patch(cur.cid, { body: e.target.value }); queue(cur.cid); }}
              onBlur={() => { if (dirty.current.has(cur.cid)) void save(cur.cid); }}
            />
            {cur.body.length > max * 0.8 && <p className="nt-count">{cur.body.length.toLocaleString("id-ID")} / {max.toLocaleString("id-ID")}</p>}
          </>
        ) : (
          <div className="nt-blank">
            <NotebookPen size={34} aria-hidden="true" />
            <h2>{items.length ? "Pilih catatan" : "Mulai mencatat"}</h2>
            <p>{items.length ? "Pilih satu catatan di kiri, atau buat yang baru. Tulisanmu tersimpan sendiri." : "Tulis apa saja: ringkasan kajian, hafalan, pertanyaan buat ustadz. Tersimpan sendiri sambil kamu mengetik."}</p>
            <button type="button" className="btn btn-primary" onClick={create}><Plus size={17} aria-hidden="true" /> Catatan baru</button>
          </div>
        )}
      </section>
    </div>
  );
}
