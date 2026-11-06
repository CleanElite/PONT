import {accessEmail} from "./admin.js";
// PONT public read-only API. Deployment requires Cloudflare Worker + D1 binding DB.
// No customer data is collected by this endpoint.
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...headers}});
const todayRO=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Bucharest",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const origin=request.headers.get("Origin");
  const allowed=(env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
  const cors=origin&&allowed.includes(origin)?{"access-control-allow-origin":origin,"vary":"Origin"}:{};
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"Content-Type",...cors}});
  if(url.pathname.startsWith("/api/admin/")){
   if(!env.DB)return json({error:"Database not configured"},503,cors);
   const email=await accessEmail(request,env);
   if(!email)return json({error:"Authentication required"},401,cors);
   const admin=await env.DB.prepare("SELECT r.id,r.name FROM restaurant_admins a JOIN restaurants r ON r.id=a.restaurant_id WHERE a.email=? AND a.active=1 AND r.active=1").bind(email).first();
   if(!admin)return json({error:"No restaurant assigned"},403,cors);
   if(url.pathname==="/api/admin/me"&&request.method==="GET")return json({restaurant:admin,role:"restaurant_admin"},200,cors);
   if(url.pathname==="/api/admin/menus"&&request.method==="GET"){
     const {results}=await env.DB.prepare("SELECT menu_date,first_course,second_course,first_price_bani,second_price_bani,full_price_bani,state,accepts_card,offers_delivery,allergens FROM daily_menus WHERE restaurant_id=? AND menu_date>=date('now','-7 days') ORDER BY menu_date LIMIT 60").bind(admin.id).all();
     return json({menus:results},200,cors);
   }
   if(url.pathname==="/api/admin/menus"&&request.method==="PUT"){
     const size=Number(request.headers.get("content-length")||0);
     if(size>10000)return json({error:"Payload too large"},413,cors);
     let data;try{data=await request.json()}catch{return json({error:"Invalid JSON"},400,cors)}
     if(!data||Array.isArray(data)||typeof data!=="object")return json({error:"Invalid menu"},400,cors);
     const day=String(data.menu_date||"");
     const a=String(data.first_course||"").trim(),b=String(data.second_course||"").trim();
     const price=Number(data.full_price_bani);
     const state=String(data.state||"draft");
     const money=v=>v===null||v===undefined||v===""?null:Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<10000000?Number(v):NaN;
     const p1=money(data.first_price_bani),p2=money(data.second_price_bani);
     const allergens=String(data.allergens||"").trim();
     const date=new Date(day+"T12:00:00Z");
     if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==day||!a||!b||a.length>300||b.length>300||!Number.isSafeInteger(price)||price<1||price>10000000||Number.isNaN(p1)||Number.isNaN(p2)||allergens.length>1000||!["draft","published","sold_out"].includes(state)||![0,1].includes(Number(data.accepts_card))||![0,1].includes(Number(data.offers_delivery)))return json({error:"Invalid fields"},400,cors);
     await env.DB.prepare("INSERT INTO daily_menus (restaurant_id,menu_date,first_course,second_course,first_price_bani,second_price_bani,full_price_bani,state,accepts_card,offers_delivery,allergens) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(restaurant_id,menu_date) DO UPDATE SET first_course=excluded.first_course,second_course=excluded.second_course,first_price_bani=excluded.first_price_bani,second_price_bani=excluded.second_price_bani,full_price_bani=excluded.full_price_bani,state=excluded.state,accepts_card=excluded.accepts_card,offers_delivery=excluded.offers_delivery,allergens=excluded.allergens").bind(admin.id,day,a,b,p1,p2,price,state,Number(data.accepts_card),Number(data.offers_delivery),allergens).run();
     return json({saved:true,date:day},200,cors);
   }
   return json({error:"Not found"},404,cors);
  }
  if(request.method!=="GET")return json({error:"Method not allowed"},405,{"allow":"GET, OPTIONS",...cors});
  if(url.pathname==="/api/health")return json({status:"ok",service:"pont-api"},200,cors);
  if(url.pathname!=="/api/menus")return json({error:"Not found"},404,cors);
  if(!env.DB)return json({error:"Database not configured"},503,cors);
  const date=todayRO();
  try {
   const {results}=await env.DB.prepare("SELECT restaurant_id,name,whatsapp,phone,menu_date,first_course,second_course,first_price_bani,second_price_bani,full_price_bani,state,accepts_card,offers_delivery,allergens FROM public_menus WHERE menu_date=? ORDER BY name LIMIT 100").bind(date).all();
   return json({date,menus:results},200,cors);
  }catch(e){return json({error:"Service temporarily unavailable"},503,cors);}
 }
};