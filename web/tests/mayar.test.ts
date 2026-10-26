import { afterEach, describe, expect, it, vi } from "vitest";
import {createInvoice,fetchTransaction,mayarSimulated} from "@/lib/mayar";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("Mayar v1 adapter contract",()=>{
  it("uses payment/create with the locked order amount",async()=>{
    vi.stubEnv("MAYAR_API_KEY","test-key");vi.stubEnv("MAYAR_API_BASE","https://api.mayar.io/hl/v1");
    const request=vi.fn().mockResolvedValue(Response.json({data:{id:"invoice1",link:"https://merchant.myr.id/test"}}));vi.stubGlobal("fetch",request);
    await createInvoice({orderId:"o1",name:"Uji",email:"user@contoh.test",mobile:"6281234567890",amount:99000,description:"Kelas",redirectUrl:"http://localhost:3200/dashboard/pembayaran/o1",expiresAt:new Date(2030,1,1)});
    expect(request.mock.calls[0][0]).toBe("https://api.mayar.io/hl/v1/payment/create");
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({amount:99000,extraData:{orderId:"o1"}});
  });
  it.each([["paid","PAID"],["unpaid","PENDING"],["expired","EXPIRED"],["failed","FAILED"]])("maps %s without trusting a browser callback",async(status,result)=>{vi.stubEnv("MAYAR_API_KEY","test-key");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({data:{id:"invoice1",status,amount:99000}})));expect((await fetchTransaction("invoice1"))?.status).toBe(result);});
  it("rejects mismatched provider identity",async()=>{vi.stubEnv("MAYAR_API_KEY","test-key");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({data:{id:"another",status:"paid",amount:99000}})));expect(await fetchTransaction("invoice1")).toBeNull();});
  it("never enables simulated payments in production",()=>{vi.stubEnv("NODE_ENV","production");vi.stubEnv("MAYAR_API_KEY","");expect(mayarSimulated()).toBe(false);});
});
