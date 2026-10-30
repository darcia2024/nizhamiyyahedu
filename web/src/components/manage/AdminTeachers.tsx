import { db } from "@/lib/db";
import { saveTeacher, deleteTeacher } from "@/app/actions/manage";
import { ActionForm, Field, InlineAction } from "@/components/ActionForm";
import { ManageHeading, SearchFilters, Pagination, Empty } from "./ManageUI";
export async function AdminTeachers({query={}}:{query?:Record<string,string|undefined>}){
  const page=Math.max(1,Math.floor(Number(query.page)||1)),q=(query.q??"").slice(0,80);
  const where={...(q?{displayName:{ contains: q, mode: "insensitive" as const }}:{}),...(["visible","hidden"].includes(query.status??"")?{showOnHome:query.status==="visible"}:{})};
  const [teachers,count]=await Promise.all([db.teacherProfile.findMany({where,include:{user:true,_count:{select:{courses:true}}},orderBy:{displayName:"asc"},take:25,skip:(page-1)*25}),db.teacherProfile.count({where})]);
  return <><ManageHeading title="Pengajar" text="Profil pengajar ditampilkan di katalog, detail kursus, dan beranda."/>
    <SearchFilters q={q} status={query.status} placeholder="Cari nama pengajar..." statuses={[{value:"visible",label:"Tampil di beranda"},{value:"hidden",label:"Disembunyikan"}]}/>
    <details className="card pad"><summary>Tambah pengajar</summary><TeacherForm/></details>
    {teachers.map(t=><section className="card pad" key={t.id}><div className="manage-heading"><div><h2>{t.displayName}</h2><p className="small muted">{t._count.courses} kursus / {t.user?.email??"Belum ditautkan ke akun"}</p></div><span className={`badge ${t.showOnHome?"ok":"off"}`}>{t.showOnHome?"Tampil di beranda":"Disembunyikan"}</span></div><TeacherForm teacher={t}/>{!t._count.courses&&<details className="admin-disclosure"><summary>Hapus profil pengajar</summary><p className="small muted">Profil ini akan dihapus. Akun user tidak ikut dihapus.</p><InlineAction action={deleteTeacher} fields={{id:t.id}} label="Konfirmasi hapus profil" className="btn btn-danger sm"/></details>}</section>)}
    {!teachers.length&&<Empty title="Tidak ada pengajar yang cocok"/>}<Pagination page={page} count={count} base="/admin/pengajar" query={query}/>
  </>;
}
function TeacherForm({teacher:t}: {teacher?:{id:string;displayName:string;bio:string;alumni:string|null;sanad:string|null;photoUrl:string|null;showOnHome:boolean;user?:{email:string}|null}}){
  return <ActionForm action={saveTeacher} submit={t?"Simpan profil":"Tambah pengajar"}>{t&&<input type="hidden" name="id" value={t.id}/>}<Field name="displayName" label="Nama pengajar" defaultValue={t?.displayName}/><Field name="userEmail" label="Email akun pengajar" type="email" defaultValue={t?.user?.email} hint="Akun perlu masuk dengan Google terlebih dahulu."/><Field name="alumni" label="Alumni" defaultValue={t?.alumni}/><Field name="sanad" label="Keterangan sanad" defaultValue={t?.sanad}/><Field name="bio" label="Tentang pengajar" type="textarea" defaultValue={t?.bio} full/><label className="field full">Foto pengajar<input className="input" name="photo" type="file" accept="image/jpeg,image/png,image/webp"/><span className="hint">Maksimal 1 MB. Disimpan ulang sebagai WebP tanpa metadata pribadi.</span></label>{t?.photoUrl&&<img src={t.photoUrl} width={80} height={80} alt={`Foto ${t.displayName}`} style={{borderRadius:"50%",objectFit:"cover"}}/>}<Field name="showOnHome" type="checkbox" label="Tampilkan di beranda" defaultValue={t?.showOnHome??true} full/></ActionForm>;
}
