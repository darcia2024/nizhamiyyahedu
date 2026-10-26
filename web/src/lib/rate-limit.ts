import { db } from "@/lib/db";

/** Fixed-window sederhana di DB. true = lolos, false = kena batas. */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const now = new Date();
  await db.rateLimit.upsert({
      where: { key },
      update: {},
      create: { key, count: 0, resetAt: new Date(now.getTime() + windowSec * 1000) },
  });
  return db.$transaction(async tx=>{
    await tx.rateLimit.updateMany({where:{key,resetAt:{lte:now}},data:{count:0,resetAt:new Date(now.getTime()+windowSec*1000)}});
    const result=await tx.rateLimit.updateMany({where:{key,count:{lt:max}},data:{count:{increment:1}}});
    return result.count===1;
  });
}
