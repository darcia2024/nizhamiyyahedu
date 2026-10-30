import { db } from "@/lib/db";
import { withBase } from "@/lib/base-path";
import { dateTimeWib } from "@/lib/format";
import { Empty, ManageHeading, Pagination } from "./ManageUI";
import { Prisma } from "@prisma/client";
export function logWhere(query:Record<string,string|undefined>):Prisma.AuditLogWhereInput {
  const start=query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from)?new Date(`${query.from}T00:00:00+07:00`):undefined;
  const end=query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)?new Date(`${query.to}T23:59:59+07:00`):undefined;
  return {...(query.action?{action:query.action}:{}),...(query.q?{actorName:{ contains: query.q.slice(0,80), mode: "insensitive" as const }}:{}),...(start||end?{createdAt:{gte:start,lte:end}}:{})};
}
export async function AdminLog({query}: {query:Record<string,string|undefined>}) {
  const page=Math.max(1,Number(query.page)||1),where=logWhere(query);
  const [rows,count,actions]=await Promise.all([db.auditLog.findMany({where,orderBy:{createdAt:"desc"},take:25,skip:(page-1)*25}),db.auditLog.count({where}),db.auditLog.findMany({select:{action:true},distinct:["action"]})]);
  const params=new URLSearchParams();Object.entries(query).forEach(([k,v])=>{if(v)params.set(k,v);});
  return <><ManageHeading title="Catatan aktivitas" text="Perubahan penting disimpan bersama pelaku dan alasan tindakan."><a className="btn btn-ghost" href={withBase(`/admin/log/export?${params}`)}>Unduh CSV</a></ManageHeading>
  <form className="manage-filters"><label><span className="sr-only">Nama pelaku</span><input className="input" name="q" placeholder="Cari nama pelaku" defaultValue={query.q}/></label><label><span className="sr-only">Aksi</span><select className="select" name="action" defaultValue={query.action??""}><option value="">Semua aksi</option>{actions.map(a=><option key={a.action}>{a.action}</option>)}</select></label><label className="small">Dari<input className="input" type="date" name="from" defaultValue={query.from}/></label><label className="small">Sampai<input className="input" type="date" name="to" defaultValue={query.to}/></label><button className="btn btn-primary">Tampilkan</button></form>
  {rows.length?<div className="card table-box"><table className="t responsive-table"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi dan target</th><th>Rincian</th></tr></thead><tbody>{rows.map(l=><tr key={l.id}><td data-label="Waktu">{dateTimeWib(l.createdAt)}</td><td data-label="Pelaku">{l.actorName??"Admin"}</td><td data-label="Aksi"><b>{l.action}</b><small>{l.targetType}</small></td><td data-label="Rincian"><details><summary>Lihat perubahan</summary><p>{l.reason??"Tanpa alasan tambahan"}</p><p className="small muted">Sebelum</p><pre className="code-preview">{l.before??"-"}</pre><p className="small muted">Sesudah</p><pre className="code-preview">{l.after??"-"}</pre></details></td></tr>)}</tbody></table></div>:<Empty title="Belum ada catatan"/>}<Pagination page={page} count={count} base="/admin/log" query={query}/></>;
}
