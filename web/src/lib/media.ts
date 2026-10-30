import sharp from "sharp";
import { withBase } from "@/lib/base-path";
import { randomUUID } from "node:crypto";
import { putImage } from "@/lib/storage";
export async function saveTeacherPhoto(file:File):Promise<{ok:true;url:string}|{ok:false;error:string}>{
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||! /\.(jpe?g|png|webp)$/i.test(file.name))return {ok:false,error:"Gunakan foto JPG, PNG, atau WebP."};
  if(file.size>1024*1024)return {ok:false,error:"Ukuran foto maksimal 1 MB."};
  try {
    const image=sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:16_000_000});
    const meta=await image.metadata();
    if(!["jpeg","png","webp"].includes(meta.format??""))return {ok:false,error:"Isi file bukan foto yang didukung."};
    const bytes=await image.rotate().resize(640,640,{fit:"cover",withoutEnlargement:true}).webp({quality:82}).toBuffer();
    const name=`${randomUUID()}.webp`;
    await putImage(name,bytes);
    return {ok:true,url:withBase(`/api/media/${name}`)};
  } catch { return {ok:false,error:"Foto tidak bisa diproses. Pilih file gambar lain."}; }
}

/** Website media keeps its original proportions; re-encoding strips embedded metadata. */
export async function saveSiteImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) return { ok: false, error: "Gunakan gambar JPG, PNG, atau WebP." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Ukuran gambar maksimal 5 MB." };
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000 });
    const meta = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format ?? "")) return { ok: false, error: "Isi file bukan gambar yang didukung." };
    const bytes = await image.rotate().resize(1800, 1800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    const name = `${randomUUID()}.webp`;
    await putImage(name, bytes);
    return { ok: true, url: `/api/media/${name}` };
  } catch { return { ok: false, error: "Gambar tidak bisa diproses. Pilih file lain." }; }
}
