import { beforeEach, describe, expect, it, vi } from "vitest";
const mocked=vi.hoisted(()=>({user:null as null|{id:string;role:string},course:vi.fn(),enrollment:vi.fn(),upsert:vi.fn(),audit:vi.fn(),userFind:vi.fn()}));
vi.mock("@/lib/auth-guard",()=>({getCurrentUser:async()=>mocked.user,canManageCourse:async(u:{role:string})=>u.role==="ADMIN"}));
vi.mock("@/lib/db",()=>({db:{course:{findUnique:mocked.course},enrollment:{findUnique:mocked.enrollment,upsert:mocked.upsert},user:{findUnique:mocked.userFind},auditLog:{create:mocked.audit}}}));
vi.mock("@/lib/orders",()=>({createOrder:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn(),revalidateTag:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
vi.mock("@/lib/mayar",()=>({mayarSimulated:()=>false,fetchTransaction:vi.fn()}));
import { enrollFree } from "@/app/kursus/[slug]/actions";
import { changeRole, saveCourse } from "@/app/actions/manage";
describe("server permission checks",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocked.user=null;});
  it("rejects unauthenticated course mutation",async()=>{expect((await saveCourse({ok:true},new FormData())).ok).toBe(false);});
  it("rejects regular user role escalation",async()=>{mocked.user={id:"a",role:"STUDENT"};expect((await changeRole({ok:true},new FormData())).ok).toBe(false);expect(mocked.userFind).not.toHaveBeenCalled();});
  it("prevents admin self-role change",async()=>{mocked.user={id:"a",role:"ADMIN"};mocked.userFind.mockResolvedValue({id:"a",role:"ADMIN"});const fd=new FormData();fd.set("userId","a");fd.set("role","STUDENT");expect((await changeRole({ok:true},fd)).ok).toBe(false);});
  it("does not reactivate access revoked by an admin",async()=>{mocked.user={id:"a",role:"STUDENT"};mocked.course.mockResolvedValue({id:"c",status:"PUBLISHED",priceRupiah:0,archivedAt:null});mocked.enrollment.mockResolvedValue({status:"REVOKED"});const fd=new FormData();fd.set("courseId","c");const r=await enrollFree({ok:true},fd);expect(r.ok).toBe(false);expect(mocked.upsert).not.toHaveBeenCalled();});
});
