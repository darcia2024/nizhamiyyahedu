import {afterEach,describe,it,expect,vi} from "vitest";
const h=vi.hoisted(()=>({find:vi.fn(),fetch:vi.fn(),settle:vi.fn(),limit:vi.fn(async()=>true)}));
vi.mock("@/lib/db",()=>({db:{order:{findUnique:h.find}}}));
vi.mock("@/lib/rate-limit",()=>({rateLimit:h.limit}));
vi.mock("@/lib/mayar",()=>({fetchTransaction:h.fetch,mayarSimulated:()=>false}));
vi.mock("@/lib/orders",()=>({settleOrder:h.settle}));
import {POST} from "@/app/api/webhooks/mayar/route";
afterEach(()=>{vi.clearAllMocks();vi.unstubAllEnvs();});
const req=(body:unknown,token="correct")=>new Request("http://localhost/api/webhooks/mayar",{method:"POST",headers:{"Content-Type":"application/json","x-webhook-token":token},body:JSON.stringify(body)});
describe("payment webhook checks",()=>{
  it("rejects token before calling provider or database",async()=>{vi.stubEnv("MAYAR_WEBHOOK_TOKEN","correct");const r=await POST(req({orderId:"o"},"wrong"));expect(r.status).toBe(401);expect(h.fetch).not.toHaveBeenCalled();expect(h.find).not.toHaveBeenCalled();});
  it("accepts a verified payment and exposes no internal data",async()=>{vi.stubEnv("MAYAR_WEBHOOK_TOKEN","correct");h.find.mockResolvedValue({id:"o",mayarId:"m",amount:100,status:"PENDING"});h.fetch.mockResolvedValue({status:"PAID",amount:100,currency:"IDR",orderId:"o"});h.settle.mockResolvedValue("paid");const r=await POST(req({event:"payment.received",data:{extraData:{orderId:"o"}}}));expect(h.settle).toHaveBeenCalledWith("o",100);expect(await r.json()).toEqual({received:true});});
  it("does not grant access for a mismatched correlation",async()=>{vi.stubEnv("MAYAR_WEBHOOK_TOKEN","correct");h.find.mockResolvedValue({id:"o",mayarId:"m",status:"PENDING"});h.fetch.mockResolvedValue({status:"PAID",amount:100,currency:"IDR",orderId:"someone-else"});await POST(req({orderId:"o"}));expect(h.settle).not.toHaveBeenCalled();});
  it("ignores unrelated events",async()=>{vi.stubEnv("MAYAR_WEBHOOK_TOKEN","correct");await POST(req({event:"other",orderId:"o"}));expect(h.find).not.toHaveBeenCalled();});
  it("allows provider retry when processing fails",async()=>{vi.stubEnv("MAYAR_WEBHOOK_TOKEN","correct");h.find.mockRejectedValueOnce(new Error("temporary database failure"));const log=vi.spyOn(console,"error").mockImplementation(()=>{});try{const r=await POST(req({orderId:"o"}));expect(r.status).toBe(503);expect(await r.json()).toEqual({error:"processing_failed"});}finally{log.mockRestore();}});
});
