import { getCurrentUser, canManageCourse } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { csvResponse } from "@/lib/csv";
export async function GET(_r:Request,{params}:{params:Promise<{courseId:string}>}){
  const u=await getCurrentUser(),{courseId}=await params;
  if(!u||!await canManageCourse(u,courseId))return Response.json({error:"Akses ditolak."},{status:403});
  const [enrollments,lessons]=await Promise.all([db.enrollment.findMany({where:{courseId,status:"ACTIVE"},include:{user:true}}),db.lesson.findMany({where:{courseId,status:"PUBLISHED"},include:{progress:{where:{completedAt:{not:null}}}},orderBy:{position:"asc"}})]);
  return csvResponse([["Nama","Email",...lessons.map(l=>l.title),"Progres (%)"],...enrollments.map(e=>{const done=lessons.filter(l=>l.progress.some(p=>p.userId===e.userId));return [e.user.name,e.user.email,...lessons.map(l=>done.some(d=>d.id===l.id)?"Selesai":"Belum"),lessons.length?Math.round(done.length/lessons.length*100):0];})],"progres-user");
}
