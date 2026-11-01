"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { adminSearch, type SearchHit } from "@/app/actions/admin-bulk";

type Hit = SearchHit;

/** Kotak cari global panel admin. Buka dengan Ctrl+K / Cmd+K. */
export function AdminSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) input.current?.focus(); else { setQ(""); setHits([]); } }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const results = await adminSearch(q);
        if (!ctl.signal.aborted) setHits(results);
      } catch { /* offline */ }
      if (!ctl.signal.aborted) setBusy(false);
    }, 220);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const go = (href: string) => { setOpen(false); router.push(href); };
  return (
    <>
      <button type="button" className="btn btn-ghost sm admin-search-btn" onClick={() => setOpen(true)} aria-label="Cari di panel admin (Ctrl+K)"><Search size={16} aria-hidden="true" /> <span>Cari</span> <kbd>Ctrl K</kbd></button>
      {open && (
        <div className="admin-search-back" onClick={() => setOpen(false)}>
          <div className="admin-search card" role="dialog" aria-modal="true" aria-label="Cari di panel admin" onClick={(e) => e.stopPropagation()}>
            <input ref={input} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari user, kursus, atau tagihan…" maxLength={80}
              onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) go(hits[0].href); }} />
            <ul>
              {hits.map((h) => (
                <li key={h.href}><button type="button" onClick={() => go(h.href)}><span className="badge">{h.type}</span><b>{h.title}</b><small className="muted">{h.sub}</small></button></li>
              ))}
            </ul>
            {q.trim().length >= 2 && !busy && !hits.length && <p className="small muted">Tidak ada hasil.</p>}
          </div>
        </div>
      )}
    </>
  );
}
