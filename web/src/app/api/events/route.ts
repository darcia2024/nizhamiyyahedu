import {z} from "zod";
import {db} from "@/lib/db";
import {rateLimit} from "@/lib/rate-limit";
const schema=z.object({courseId:z.string().min(1).max(80)});
export async function POST(req:Request){
  if(req.headers.get("origin")!==new URL(req.url).origin)return new Response(null,{status:403});
  const ip=(req.headers.get("x-forwarded-for")??"unknown").split(",")[0].trim();
  if(!await rateLimit(`view:${ip}`,30,60))return new Response(null,{status:429});
  let body;try{body=schema.safeParse(await req.json());}catch{return new Response(null,{status:400});}
  if(!body.success)return new Response(null,{status:400});
  const c=await db.course.findFirst({where:{id:body.data.courseId,status:"PUBLISHED",archivedAt:null},select:{id:true}});
  if(c)await db.event.create({data:{name:"course_view",courseId:c.id}});
  return new Response(null,{status:204});
}
