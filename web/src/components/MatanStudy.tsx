"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Shuffle } from "lucide-react";

export type MatanSection = { lessonId: string; title: string; position: number; blocks: { ar: string; id: string }[] };
type Mode = "baca" | "hafal" | "uji";
type Item = { key: string; lessonId: string; position: number; title: string; ar: string; id: string };

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "baca", label: "Baca", hint: "Teks Arab dan terjemah tampil semua." },
  { key: "hafal", label: "Hafalan", hint: "Terjemah tampil sebagai petunjuk. Ketuk kotak untuk membuka teks Arab." },
  { key: "uji", label: "Uji terjemah", hint: "Teks Arab tampil. Tebak artinya, lalu ketuk untuk membuka terjemah." },
];

function shuffled<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Belajar matan: mode baca, hafalan (Arab disembunyikan), dan uji terjemah, dengan penanda "sudah hafal" tersimpan di perangkat. */
export function MatanStudy({ slug, sections }: { slug: string; sections: MatanSection[] }) {
  const items = useMemo<Item[]>(
    () => sections.flatMap((s) => s.blocks.map((b, i) => ({ key: `${s.lessonId}:${i}`, lessonId: s.lessonId, position: s.position, title: s.title, ar: b.ar, id: b.id }))),
    [sections],
  );
  const [mode, setMode] = useState<Mode>("baca");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [seed, setSeed] = useState(0);
  const storeKey = `matan-hafal:${slug}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setKnown(new Set(JSON.parse(raw) as string[]));
    } catch { /* penyimpanan tidak tersedia, abaikan */ }
  }, [storeKey]);

  function toggleKnown(key: string) {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(storeKey, JSON.stringify([...next])); } catch { /* abaikan */ }
      return next;
    });
  }
  function toggleOpen(key: string) {
    setOpen((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }
  function changeMode(m: Mode) { setMode(m); setOpen(new Set()); }

  const order = seed ? shuffled(items, seed) : items;
  const knownCount = items.filter((i) => known.has(i.key)).length;
  const hint = MODES.find((m) => m.key === mode)!.hint;

  const renderItem = (it: Item, label?: string) => {
    const hideAr = mode === "hafal" && !open.has(it.key);
    const hideTr = mode === "uji" && !open.has(it.key);
    const covered = hideAr || hideTr;
    const isKnown = known.has(it.key);
    return (
      <div key={it.key} className={`mt-item${isKnown ? " known" : ""}`}>
        {label && <p className="mt-label">{label}</p>}
        <div className="mt-body">
          {hideAr ? (
            <button type="button" className="mt-cover" onClick={() => toggleOpen(it.key)} aria-label="Tampilkan teks Arab">
              <Eye size={18} aria-hidden="true" /> Ketuk untuk menampilkan teks Arab
            </button>
          ) : (
            <p className="ar mt-ar" lang="ar" dir="rtl">{it.ar}</p>
          )}
          {it.id && (hideTr ? (
            <button type="button" className="mt-cover tr" onClick={() => toggleOpen(it.key)} aria-label="Tampilkan terjemah">
              <Eye size={18} aria-hidden="true" /> Ketuk untuk menampilkan terjemah
            </button>
          ) : (
            <p className="mt-tr">{it.id}</p>
          ))}
        </div>
        <div className="mt-actions">
          {mode !== "baca" && !covered && (
            <button type="button" className="btn btn-ghost sm" onClick={() => toggleOpen(it.key)}><EyeOff size={15} aria-hidden="true" /> Tutup lagi</button>
          )}
          <button type="button" className={`btn sm ${isKnown ? "btn-soft" : "btn-ghost"}`} aria-pressed={isKnown} onClick={() => toggleKnown(it.key)}>
            <Check size={15} aria-hidden="true" /> {isKnown ? "Sudah hafal" : "Tandai hafal"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="stack">
      <div className="card mt-bar">
        <div className="mt-modes" role="group" aria-label="Mode belajar matan">
          {MODES.map((m) => <button key={m.key} type="button" aria-pressed={mode === m.key} onClick={() => changeMode(m.key)}>{m.label}</button>)}
        </div>
        <div className="mt-tools">
          <button type="button" className="btn btn-ghost sm" onClick={() => setSeed((s) => (s ? s + 7919 : Date.now() % 100000 + 1))}><Shuffle size={15} aria-hidden="true" /> {seed ? "Acak lagi" : "Acak urutan"}</button>
          {seed > 0 && <button type="button" className="btn btn-ghost sm" onClick={() => setSeed(0)}>Urut kembali</button>}
        </div>
        <p className="small muted mt-hint" role="status">{hint}</p>
        <div className="mt-progress">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={knownCount} aria-label="Kalimat yang sudah hafal"><div style={{ width: `${items.length ? (knownCount / items.length) * 100 : 0}%` }} /></div>
          <span className="small num">{knownCount} dari {items.length} kalimat sudah hafal</span>
        </div>
      </div>

      {seed
        ? <div className="stack">{order.map((it) => renderItem(it, `Pelajaran ${it.position}: ${it.title}`))}</div>
        : sections.map((s) => (
            <section key={s.lessonId} className="stack" aria-label={`Pelajaran ${s.position}`}>
              <div className="sec-hd">
                <h2>Pelajaran {s.position}: {s.title}</h2>
                <Link href={`/dashboard/kursus/${slug}/pelajaran/${s.lessonId}`}>Buka pelajaran</Link>
              </div>
              {s.blocks.map((_, i) => renderItem(items.find((x) => x.key === `${s.lessonId}:${i}`)!))}
            </section>
          ))}
    </div>
  );
}
