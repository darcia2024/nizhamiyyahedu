"use server";
import {getCurrentUser} from "@/lib/auth-guard";
import {db} from "@/lib/db";
import {normalizePhone} from "@/lib/phone";
import {fail,type ActionResult} from "@/lib/action";
import {revalidatePath} from "next/cache";
export async function saveProfile(_p:ActionResult,fd:FormData):Promise<ActionResult>{
  const user=await getCurrentUser();if(!user)return fail("Masuk lagi dulu ya.");
  const raw=String(fd.get("whatsapp")??"");const phone=raw.trim()?normalizePhone(raw):null;
  if(phone&&!phone.ok)return fail(phone.message,{whatsapp:phone.message});
  await db.user.update({where:{id:user.id},data:{whatsapp:phone&&phone.ok?phone.value:null}});
  revalidatePath("/dashboard/profil");return {ok:true,message:"Nomor WhatsApp tersimpan."};
}
