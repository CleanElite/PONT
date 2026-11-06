// Lightweight checks for the PONT public API. Run with: node --test backend/worker.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";
const req=(path,method="GET",origin)=>new Request("https://api.example.test"+path,{method,headers:origin?{Origin:origin}:{}});
test("health endpoint responds",async()=>{const r=await worker.fetch(req("/api/health"),{});assert.equal(r.status,200);assert.equal((await r.json()).status,"ok")});
test("unknown routes return 404",async()=>{assert.equal((await worker.fetch(req("/missing"),{})).status,404)});
test("writes are rejected",async()=>{assert.equal((await worker.fetch(req("/api/menus","POST"),{})).status,405)});
test("missing database fails closed",async()=>{assert.equal((await worker.fetch(req("/api/menus"),{})).status,503)});
test("unapproved origin does not get CORS header",async()=>{const r=await worker.fetch(req("/api/health","GET","https://untrusted.example"),{ALLOWED_ORIGINS:"https://pont.example"});assert.equal(r.headers.get("access-control-allow-origin"),null)});
test("approved origin gets CORS header",async()=>{const r=await worker.fetch(req("/api/health","GET","https://pont.example"),{ALLOWED_ORIGINS:"https://pont.example"});assert.equal(r.headers.get("access-control-allow-origin"),"https://pont.example")});
