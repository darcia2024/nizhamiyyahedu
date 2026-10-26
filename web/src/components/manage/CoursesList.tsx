import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth-guard";
import { FIELD_LABEL, LEVEL_LABEL, type Field, type Level } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { Empty, Pagination, SearchFilters } from "./ManageUI";
export async function CoursesList({user, base, query}: {user: CurrentUser; base: string; query: Record<string,string|undefined>}) {
  const page = Math.max(1, Number(query.page) || 1), q=(query.q??"").trim().slice(0,80);
  const where: Prisma.CourseWhereInput = { ...(user.role === "ADMIN" ? {} : { teacher: { userId: user.id } }), ...(q ? {title: { contains: q }} : {}), ...(query.status === "ARCHIVED" ? {archivedAt: {not: null}} : {archivedAt: null, ...(["PUBLISHED","DRAFT"].includes(query.status??"") ? {status:query.status} : {})}) };
  const [rows,count] = await Promise.all([db.course.findMany({where,include:{teacher:true,_count:{select:{lessons:true,enrollments:true}}},orderBy:{createdAt:"desc"},take:25,skip:(page-1)*25}),db.course.count({where})]);
  return <><SearchFilters q={q} status={query.status} placeholder="Cari nama kursus..." statuses={[{value:"PUBLISHED",label:"Tayang"},{value:"DRAFT",label:"Draf"},{value:"ARCHIVED",label:"Arsip"}]} />
  {rows.length ? <div className="card table-box"><table className="t responsive-table"><thead><tr><th>Kursus</th><th>Pengajar</th><th>Harga</th><th>Status</th><th>Pendaftar</th><th>Aksi</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}>
  <td data-label="Kursus"><Link className="table-title" href={`${base}/${c.id}`}>{c.title}</Link><small className="muted">{FIELD_LABEL[c.field as Field]} / {LEVEL_LABEL[c.level as Level]} / {c._count.lessons} pelajaran</small></td><td data-label="Pengajar">{c.teacher?.displayName??"Belum dipilih"}</td><td data-label="Harga">{rupiah(c.priceRupiah)}</td><td data-label="Status"><span className={`badge ${c.archivedAt ? "off" : c.status === "PUBLISHED" ? "ok" : "wait"}`}>{c.archivedAt?"Arsip":c.status === "PUBLISHED"?"Tayang":"Draf"}</span></td><td data-label="Pendaftar">{c._count.enrollments}</td><td data-label="Aksi"><Link className="btn btn-ghost sm" href={`${base}/${c.id}`}>Kelola</Link></td></tr>)}</tbody></table></div> : <Empty title="Tidak ada kursus" text="Ubah pencarian atau buat kursus pertama sebagai draf." />}
  <Pagination page={page} count={count} base={base} query={query} /></>;
}
