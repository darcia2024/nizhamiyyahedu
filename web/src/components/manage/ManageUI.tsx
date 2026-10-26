import Link from "next/link";
import type { ReactNode } from "react";
export function ManageHeading({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return <div className="manage-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{text && <p className="muted">{text}</p>}</div>{children}</div>;
}
export function Empty({ title = "Belum ada data", text = "Data akan tampil di sini setelah ditambahkan." }: { title?: string; text?: string }) {
  return <div className="empty-state card"><h2>{title}</h2><p className="muted">{text}</p></div>;
}
export function Pagination({ page, count, base, query = {} }: { page: number; count: number; base: string; query?: Record<string, string | undefined> }) {
  const total = Math.max(1, Math.ceil(count / 25));
  const href = (n: number) => { const s = new URLSearchParams(); Object.entries(query).forEach(([k,v]) => { if (v) s.set(k,v); }); s.set("page", String(n)); return `${base}?${s}`; };
  return <div className="pagination"><span className="small muted">{count} hasil / Halaman {page} dari {total}</span><div>{page > 1 && <Link className="btn btn-ghost sm" href={href(page-1)}>Sebelumnya</Link>}{page < total && <Link className="btn btn-ghost sm" href={href(page+1)}>Berikutnya</Link>}</div></div>;
}
export function SearchFilters({ q, status, statuses, placeholder = "Cari..." }: { q?: string; status?: string; statuses?: {value: string; label: string}[]; placeholder?: string }) {
  return <form className="manage-filters" method="get"><label className="grow"><span className="sr-only">Pencarian</span><input className="input" name="q" defaultValue={q} maxLength={80} placeholder={placeholder} /></label>{statuses && <label><span className="sr-only">Filter status</span><select className="select" name="status" defaultValue={status ?? ""}><option value="">Semua status</option>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>}<button className="btn btn-primary">Tampilkan</button></form>;
}
