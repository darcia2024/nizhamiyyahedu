"use client";
import { useState, useId } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Plus, Trash2 } from "lucide-react";

type Block = { ar: string; id: string };

/** Editor blok matan Arab + terjemah. Menulis JSON ke input tersembunyi `matanJson` (PRD 11.4). */
export function MatanEditor({ initial }: { initial: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(initial.length ? initial : []);
  const set = (i: number, patch: Partial<Block>) => setBlocks((b) => b.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <div className="full" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="matanJson" value={JSON.stringify(blocks.filter((b) => b.ar.trim()))} />
      <div className="sec-hd"><span className="label">Matan (teks Arab + terjemah per kalimat)</span><span className="badge">{blocks.length} blok</span></div>
      {blocks.map((b, i) => (
        <fieldset key={i} className="matan" style={{ border: 0, margin: 0 }}>
          <legend className="sr-only">Blok matan {i + 1}</legend>
          <label className="small muted" htmlFor={`ar-${i}`}>Teks Arab {i + 1}</label>
          <textarea id={`ar-${i}`} className="textarea ar" dir="rtl" lang="ar" rows={2} style={{ fontSize: 24, lineHeight: 1.8, minHeight: 80 }} value={b.ar} onChange={(e) => set(i, { ar: e.target.value })} maxLength={2000} />
          <label className="small muted" htmlFor={`id-${i}`}>Terjemah</label>
          <textarea id={`id-${i}`} className="textarea" rows={2} style={{ minHeight: 64 }} value={b.id} onChange={(e) => set(i, { id: e.target.value })} maxLength={2000} />
          <div><button type="button" className="btn btn-ghost sm" onClick={() => setBlocks((x) => x.filter((_, k) => k !== i))}><Trash2 size={14} aria-hidden="true" /> Hapus blok</button></div>
        </fieldset>
      ))}
      <div><button type="button" className="btn btn-ghost sm" onClick={() => setBlocks((x) => [...x, { ar: "", id: "" }])} disabled={blocks.length >= 100}><Plus size={14} aria-hidden="true" /> Tambah blok matan</button></div>
    </div>
  );
}

export function NotesEditor({ initial, name = "notesMd" }: { initial: string; name?: string }) {
  const [v, setV] = useState(initial);
  const id=useId();
  return (
    <div className="full editor-preview">
      <div className="field">
        <label htmlFor={id}>{name === "bodyMd" ? "Isi dokumen" : "Catatan pengajar (Markdown)"}</label>
        <textarea id={id} name={name} className="textarea" rows={12} value={v} onChange={(e) => setV(e.target.value)} maxLength={50000} />
        <span className="hint">Enter = baris baru. **tebal**, *miring*, daftar dengan tanda “-”. HTML tidak diproses.</span>
      </div>
      <div className="field">
        <span className="label">Pratinjau</span>
        <div className="card pad" style={{ background: "var(--shell)", minHeight: 120 }} aria-live="polite">
          <div className="prose"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{v.replace(/([^\n])\n(?!\n|[-*\d>#])/g, "$1  \n") || "_Belum ada catatan._"}</ReactMarkdown></div>
        </div>
      </div>
    </div>
  );
}
