import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { CourseEditor } from "@/components/manage/CourseEditor";
import { LessonEditorPage } from "@/components/manage/LessonEditorPage";
import { StudentsTable } from "@/components/manage/StudentsTable";
import { CoursesList } from "@/components/manage/CoursesList";
import { ManageHeading } from "@/components/manage/ManageUI";
import { AdminOverview } from "@/components/manage/AdminOverview";
import { AdminUsers } from "@/components/manage/AdminUsers";
import { AdminHelp } from "@/components/manage/AdminHelp";
import { AdminPayments } from "@/components/manage/AdminPayments";
import { AdminContent } from "@/components/manage/AdminContent";
import { AdminTeachers } from "@/components/manage/AdminTeachers";
import { AdminLog } from "@/components/manage/AdminLog";
export default async function AdminPage({params,searchParams}: {params:Promise<{segments?:string[]}>; searchParams:Promise<Record<string,string|undefined>>}) {
  const user=await requireRole(["ADMIN"],"/admin");
  const {segments:s=[]}=await params,q=await searchParams;
  if(!s.length)return <AdminOverview period={q.period}/>;
  if(s[0]==="kursus"){
    const base="/admin/kursus";
    if(s.length===1)return <><ManageHeading title="Kursus" text="Kelola isi kelas dari draf sampai siap dipelajari."><Link className="btn btn-primary" href={`${base}/baru`}>Buat kursus</Link></ManageHeading><CoursesList user={user} base={base} query={q}/></>;
    if(s.length===2 && s[1]==="baru")return <><ManageHeading title="Buat kursus"/><CourseEditor courseId={null} base={base} isAdmin teachers={await db.teacherProfile.findMany()}/></>;
    const c=await db.course.findUnique({where:{id:s[1]}});if(!c)notFound();
    if(s.length===2)return <><ManageHeading title={c.title}><Link className="btn btn-ghost" href={base}>Semua kursus</Link></ManageHeading><CourseEditor courseId={c.id} base={base} isAdmin teachers={await db.teacherProfile.findMany()}/></>;
    if(s.length===3&&s[2]==="siswa")return <><ManageHeading title={`User: ${c.title}`}/><StudentsTable courseId={c.id} linkUsers/></>;
    if(s.length===4&&s[2]==="pelajaran")return <><ManageHeading title={s[3]==="baru"?"Tambah pelajaran":"Edit pelajaran"} text={c.title}><Link className="btn btn-ghost" href={`${base}/${c.id}`}>Kembali ke kursus</Link></ManageHeading><LessonEditorPage courseId={c.id} lessonId={s[3]==="baru"?null:s[3]}/></>;
  }
  if(s[0]==="pengguna"&&s.length<=2)return <AdminUsers id={s[1]} query={q}/>;
  if(s[0]==="pembayaran"&&s.length<=2)return <AdminPayments id={s[1]} query={q}/>;
  if(s[0]==="pengajar"&&s.length===1)return <AdminTeachers query={q}/>;
  if(s[0]==="konten"&&s.length===1)return <AdminContent/>;
  if(s[0]==="log"&&s.length===1)return <AdminLog query={q}/>;
  if(s[0]==="bantuan"&&s.length===1)return <AdminHelp/>;
  notFound();
}
