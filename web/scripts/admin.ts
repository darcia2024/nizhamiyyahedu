import {loadEnvConfig} from "@next/env";
import {PrismaClient} from "@prisma/client";
loadEnvConfig(process.cwd());
const db=new PrismaClient();
async function main(){
  const email=(process.argv[2]??"").toLowerCase().trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Gunakan: npm run admin:create -- email@domain.com");
  const user=await db.user.findUnique({where:{email}});
  if(!user)throw new Error("Akun belum ada. Masuk dengan Google di website terlebih dahulu.");
  await db.$transaction([db.user.update({where:{id:user.id},data:{role:"ADMIN"}}),db.auditLog.create({data:{actorId:"setup-cli",actorName:"Pengelola hosting",action:"ROLE_CHANGE",targetType:"User",targetId:user.id,before:JSON.stringify(user.role),after:JSON.stringify("ADMIN"),reason:"Penyiapan admin melalui CLI hosting"}})]);
  console.log("Peran admin berhasil diberikan ke akun yang dipilih.");
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
