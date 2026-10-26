import { describe,it,expect,vi } from "vitest";
import { normalizePhone } from "@/lib/phone";
import { parseVideoUrl } from "@/lib/video";
import { courseSchema, lessonSchema } from "@/lib/validators";
import { slugify, normalizeArabic } from "@/lib/slug";
import { csvCell } from "@/lib/csv";

describe("WhatsApp",()=>{
  it.each(["0812 3456 7890","+62 812-3456-7890","6281234567890"])("normalises %s",n=>expect(normalizePhone(n)).toEqual({ok:true,value:"6281234567890"}));
  it.each(["","0812 34","abc","+1 1234567890","0812345678901234"])("rejects %s",n=>expect(normalizePhone(n).ok).toBe(false));
});
describe("safe media",()=>{
  it("accepts exact YouTube hosts",()=>expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")?.kind).toBe("youtube"));
  it.each(["javascript:alert(1)","https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ","http://youtube.com/watch?v=dQw4w9WgXcQ","https://evil.test/movie.mp4"])("rejects %s",u=>expect(parseVideoUrl(u)).toBeNull());
  it("allows direct video only on configured exact host",()=>{vi.stubEnv("VIDEO_HOST_ALLOWLIST","media.example.com");expect(parseVideoUrl("https://media.example.com/a.mp4")?.kind).toBe("file");expect(parseVideoUrl("https://evil.media.example.com/a.mp4")).toBeNull();vi.unstubAllEnvs();});
});
describe("course validation",()=>{
  const valid={title:"Kursus baru",slug:"kursus-baru",field:"NAHWU",level:"ULA",priceRupiah:100000};
  it("accepts bounded integer rupiah",()=>expect(courseSchema.safeParse(valid).success).toBe(true));
  it.each([-1,50000001,3e9,1.2,Infinity])("rejects invalid price %s",p=>expect(courseSchema.safeParse({...valid,priceRupiah:p}).success).toBe(false));
  it("rejects controls and malformed slug",()=>{expect(courseSchema.safeParse({...valid,title:"Hi\u0000x"}).success).toBe(false);expect(courseSchema.safeParse({...valid,slug:"../admin"}).success).toBe(false);});
  it("rejects malformed matan",()=>expect(lessonSchema.safeParse({title:"Pelajaran",matanJson:'[{"ar":""}]'}).success).toBe(false));
  it("accepts structured Arabic matan",()=>expect(lessonSchema.safeParse({title:"Pelajaran",matanJson:'[{"ar":"الكلام","id":"Kalam"}]'}).success).toBe(true));
});
describe("slug and export",()=>{
  it("normalises Latin titles and makes Arabic explicit",()=>{expect(slugify("Matan Abi Syuja'! ")).toBe("matan-abi-syuja");expect(slugify("الآجرومية")).toBe("");expect(normalizeArabic("الْآجُرُّومِيَّة")).toBe("الاجروميه");});
  it("escapes formula injection and quotes",()=>{expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');expect(csvCell("Normal")).toBe('"Normal"');});
});
