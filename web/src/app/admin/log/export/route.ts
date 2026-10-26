import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { csvResponse } from "@/lib/csv";
import { dateTimeWib } from "@/lib/format";
import { logWhere } from "@/components/manage/AdminLog";
export async function GET(req:Request){
  const u=await getCurrentUser(); if(!u||u.role!=="ADMIN")return Response.json({error:"Akses ditolak."},{status:403});
  const q=Object.fromEntries(new URL(req.url).searchParams);
  const logs=await db.auditLog.findMany({where:logWhere(q),orderBy:{createdAt:"desc"},take:5000});
  return csvResponse([["Waktu WIB","Pelaku","Aksi","Target","Sebelum","Sesudah","Alasan"],...logs.map(l=>[dateTimeWib(l.createdAt),l.actorName,l.action,l.targetType,l.before,l.after,l.reason])],"catatan-aktivitas");
}
