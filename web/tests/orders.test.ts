import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
// Tes integrasi memakai Postgres sungguhan dari TEST_DATABASE_URL (database khusus tes, bukan production).
// Tanpa TEST_DATABASE_URL tes ini dilewati.
loadEnvConfig(process.cwd());
const testUrl=process.env.TEST_DATABASE_URL??"";
vi.mock("@/lib/db",async()=>{
  const {PrismaClient}=await import("@prisma/client");
  return {db:new PrismaClient({datasourceUrl:process.env.TEST_DATABASE_URL||"postgresql://skip@localhost:5432/skip"})};
});
vi.mock("@/lib/mayar",()=>({createInvoice:vi.fn(async(p:{orderId:string})=>({id:`test_${p.orderId}`,link:`http://localhost:3200/dev/mayar/${p.orderId}`}))}));
import { db } from "@/lib/db";
import { createOrder, effectiveStatus, settleOrder } from "@/lib/orders";
import type { CurrentUser } from "@/lib/auth-guard";
import { getUserProgress } from "@/lib/progress";
let user:CurrentUser, courseId:string;
beforeAll(async()=>{
  if(!testUrl)return;
  execFileSync(process.execPath,[resolve("node_modules/prisma/build/index.js"),"migrate","deploy"],{env:{...process.env,DATABASE_URL:testUrl,DIRECT_URL:testUrl},stdio:"pipe"});
  user=await db.user.create({data:{email:`orders-${Date.now()}@test.local`,role:"STUDENT",name:"User uji"}}) as CurrentUser;
  const c=await db.course.create({data:{title:"Kursus bayar",slug:`test-${Date.now()}`,field:"NAHWU",level:"ULA",status:"PUBLISHED",priceRupiah:150000}});courseId=c.id;
},30000);
afterAll(async()=>{if(testUrl)await db.$disconnect();});
describe.skipIf(!testUrl)("order lifecycle with real Postgres transactions",()=>{
  let id:string;
  it("reuses the pending invoice",async()=>{const a=await createOrder(user,courseId,"081234567890");expect(a.ok).toBe(true);if(!a.ok)throw new Error(a.error);id=a.orderId;const b=await createOrder(user,courseId,"081234567890");expect(b.ok&&b.orderId).toBe(id);expect(await db.order.count({where:{userId:user.id,courseId,status:"PENDING"}})).toBe(1);});
  it("database rejects duplicate pending orders",async()=>{await expect(db.order.create({data:{userId:user.id,courseId,amount:150000,whatsapp:"6281234567890",expiresAt:new Date(Date.now()+10000)}})).rejects.toMatchObject({code:"P2002"});});
  it("rejects amount mismatch without granting access",async()=>{expect(await settleOrder(id,1)).toBe("amount_mismatch");expect(await db.enrollment.count({where:{userId:user.id,courseId}})).toBe(0);});
  it("settles once and grants one enrollment",async()=>{expect(await settleOrder(id,150000)).toBe("paid");expect(await settleOrder(id,150000)).toBe("already");expect(await db.enrollment.count({where:{userId:user.id,courseId,status:"ACTIVE"}})).toBe(1);expect(await db.event.count({where:{userId:user.id,name:"order_paid"}})).toBe(1);});
  it("reflects real expiry immediately",()=>{expect(effectiveStatus({status:"PENDING",expiresAt:new Date(0)})).toBe("EXPIRED");});
  it("bundle payment opens every course in the bundle",async()=>{
    const stamp=Date.now();
    const a=await db.course.create({data:{title:"Isi A",slug:`isi-a-${stamp}`,field:"MANTIQ",level:"ULA",status:"PUBLISHED",priceRupiah:70000}});
    const b=await db.course.create({data:{title:"Isi B",slug:`isi-b-${stamp}`,field:"USHUL_FIQH",level:"ULA",status:"PUBLISHED",priceRupiah:70000}});
    const pack=await db.course.create({data:{title:"Paket",slug:`paket-${stamp}`,field:"AQLIYAT",level:"ULA",status:"PUBLISHED",priceRupiah:100000,bundleCourseIds:JSON.stringify([a.id,b.id])}});
    const r=await createOrder(user,pack.id,"081234567890");if(!r.ok)throw new Error(r.error);
    expect(await settleOrder(r.orderId,100000)).toBe("paid");
    expect(await db.enrollment.count({where:{userId:user.id,courseId:{in:[a.id,b.id]},status:"ACTIVE"}})).toBe(2);
    const again=await createOrder(user,pack.id,"081234567890");expect(again.ok).toBe(false);
  });
  it("keeps an enrolled archived course in the user library",async()=>{await db.course.update({where:{id:courseId},data:{archivedAt:new Date()}});expect((await getUserProgress(user.id)).some(c=>c.courseId===courseId)).toBe(true);});
});
