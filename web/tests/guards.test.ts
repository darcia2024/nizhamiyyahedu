import {describe,it,expect,vi} from "vitest";
vi.mock("@/auth",()=>({auth:vi.fn()}));
vi.mock("@/lib/db",()=>({db:{course:{findUnique:vi.fn()},user:{findUnique:vi.fn()}}}));
import {safeCallback,canManageCourse,type CurrentUser} from "@/lib/auth-guard";
import {db} from "@/lib/db";
describe("redirect and ownership guards",()=>{
  it.each(["https://evil.test","//evil.test","/\\evil.test","/%2f%2fevil.test","/%0d%0aLocation:bad","/\t/evil.test"])("blocks unsafe callback %s",v=>expect(safeCallback(v)).toBe("/dashboard"));
  it("keeps valid internal navigation",()=>expect(safeCallback("/kursus/al-ajurrumiyyah?lanjut=1")).toBe("/kursus/al-ajurrumiyyah?lanjut=1"));
  it("does not let an unrelated teacher edit a course",async()=>{vi.mocked(db.course.findUnique).mockResolvedValue({teacher:{userId:"other"}} as never);expect(await canManageCourse({id:"teacher",role:"TEACHER"} as CurrentUser,"course")).toBe(false);});
  it("allows the assigned teacher",async()=>{vi.mocked(db.course.findUnique).mockResolvedValue({teacher:{userId:"teacher"}} as never);expect(await canManageCourse({id:"teacher",role:"TEACHER"} as CurrentUser,"course")).toBe(true);});
});
