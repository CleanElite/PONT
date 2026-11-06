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