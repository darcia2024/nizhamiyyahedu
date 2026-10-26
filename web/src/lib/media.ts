import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
export const uploadDirectory=()=>join(process.cwd(),"uploads");
export async function saveTeacherPhoto(file:File):Promise<{ok:true;url:string}|{ok:false;error:string}>{
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||! /\.(jpe?g|png|webp)$/i.test(file.name))return {ok:false,error:"Gunakan foto JPG, PNG, atau WebP."};
  if(file.size>1024*1024)return {ok:false,error:"Ukuran foto maksimal 1 MB."};
  try {
    const image=sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:16_000_000});
    const meta=await image.metadata();
    if(!["jpeg","png","webp"].includes(meta.format??""))return {ok:false,error:"Isi file bukan foto yang didukung."};
    const bytes=await image.rotate().resize(640,640,{fit:"cover",withoutEnlargement:true}).webp({quality:82}).toBuffer();
    const name=`${randomUUID()}.webp`;
    await mkdir(uploadDirectory(),{recursive:true});
    await writeFile(join(uploadDirectory(),name),bytes,{flag:"wx"});
    return {ok:true,url:`/api/media/${name}`};
  } catch { return {ok:false,error:"Foto tidak bisa diproses. Pilih file gambar lain."}; }
}
