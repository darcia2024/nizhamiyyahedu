import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadDirectory } from "@/lib/media";
export const runtime="nodejs";
export async function GET(_r:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  if(!/^[a-f0-9-]{36}\.webp$/.test(name))return new Response(null,{status:404});
  try {const file=await readFile(join(uploadDirectory(),name));return new Response(file,{headers:{"Content-Type":"image/webp","X-Content-Type-Options":"nosniff","Cache-Control":"public, max-age=31536000, immutable"}});} catch{return new Response(null,{status:404});}
}
