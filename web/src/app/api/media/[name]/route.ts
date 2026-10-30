import { getImage } from "@/lib/storage";
export const runtime="nodejs";
export async function GET(_r:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  if(!/^[a-f0-9-]{36}\.webp$/.test(name))return new Response(null,{status:404});
  const file=await getImage(name);
  if(!file)return new Response(null,{status:404});
  return new Response(file,{headers:{"Content-Type":"image/webp","X-Content-Type-Options":"nosniff","Cache-Control":"public, max-age=31536000, immutable"}});
}
