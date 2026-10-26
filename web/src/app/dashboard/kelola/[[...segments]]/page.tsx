import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requireRole, requireCourseOwner } from "@/lib/auth-guard";
import { CourseEditor } from "@/components/manage/CourseEditor";
import { LessonEditorPage } from "@/components/manage/LessonEditorPage";
import { StudentsTable } from "@/components/manage/StudentsTable";
import { CoursesList } from "@/components/manage/CoursesList";
import { ManageHeading } from "@/components/manage/ManageUI";
import { db } from "@/lib/db";
export default async function ManagePage({params,searchParams}: {params: Promise<{segments?:string[]}>; searchParams: Promise<Record<string,string|undefined>>}) {
  const user = await requireRole(["TEACHER","ADMIN"],"/dashboard/kelola");
  const {segments:s=[]} = await params;
  const base="/dashboard/kelola";
  let body;
  if (!s.length) body=<><ManageHeading eyebrow="Ruang pengajar" title="Kelola kursus" text="Susun materi, pantau progres user, dan siapkan pelajaran berikutnya."><Link className="btn btn-primary" href={`${base}/baru`}>Buat kursus</Link></ManageHeading><CoursesList user={user} base={base} query={await searchParams}/></>;
  else if(s.length===1 && s[0]==="baru") body=<><ManageHeading title="Buat kursus" text="Kursus disimpan sebagai draf. Admin memeriksa sebelum menayangkan."/><CourseEditor courseId={null} base={base} isAdmin={user.role==="ADMIN"} teachers={await db.teacherProfile.findMany()}/></>;
  else {
    await requireCourseOwner(s[0]);
    const c=await db.course.findUnique({where:{id:s[0]}}); if(!c) notFound();
    if(s.length===1) body=<><ManageHeading title={c.title}><Link className="btn btn-ghost" href={base}>Semua kursus</Link></ManageHeading><CourseEditor courseId={c.id} base={base} isAdmin={user.role==="ADMIN"} teachers={await db.teacherProfile.findMany()}/></>;
    else if(s.length===2 && s[1]==="siswa") body=<><ManageHeading title={`User: ${c.title}`}/><StudentsTable courseId={c.id} linkUsers={false}/></>;
    else if(s.length===3 && s[1]==="pelajaran") body=<><ManageHeading title={s[2]==="baru"?"Tambah pelajaran":"Edit pelajaran"} text={c.title}><Link className="btn btn-ghost" href={`${base}/${c.id}`}>Kembali ke kursus</Link></ManageHeading><LessonEditorPage courseId={c.id} lessonId={s[2]==="baru"?null:s[2]}/></>;
    else notFound();
  }
  return <AppShell user={user} active="kelola"><div className="manage-stack">{body}</div></AppShell>;
}
