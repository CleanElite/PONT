// PONT · Stripe Payment Element server (one-time post-auction RON payments).
// Set Supabase secrets: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET.
// Do not enable live payments until the Stripe merchant account is confirmed for PONT.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};
const json = (data: unknown, status=200) => new Response(JSON.stringify(data),{
 status,headers:{...cors,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});
const key = Deno.env.get('STRIPE_SECRET_KEY') || '';
const publishable = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const url = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(url, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
const secretConfigured = ()=> Boolean(key && publishable && webhookSecret && url && serviceKey &&
 ((key.startsWith('sk_test_')&&publishable.startsWith('pk_test_'))||
 (key.startsWith('sk_live_')&&publishable.startsWith('pk_live_'))));

async function stripeRequest(path:string,body:URLSearchParams,idem:string) {
 const response=await fetch('https://api.stripe.com/v1/'+path,{
   method:'POST',headers:{'authorization':'Bearer '+key,'content-type':'application/x-www-form-urlencoded','Idempotency-Key':idem},body
 });
 const data=await response.json();
 if(!response.ok)throw new Error('Stripe: '+(data?.error?.message||'eroare de inițializare'));
 return data;
}
function safeEqual(a:string,b:string) {
 if(a.length!==b.length)return false;
 let diff=0;
 for(let i=0;i<a.length;i++)diff |= a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
async function validStripeSignature(body:string,header:string|null) {
 if(!header||!webhookSecret)return false;
 const parts=header.split(',').map(x=>x.trim());
 const timestamp=parts.find(x=>x.startsWith('t='))?.slice(2);
 const signatures=parts.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
 if(!timestamp||!signatures.length||!/^\d+$/.test(timestamp))return false;
 if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 const hmac=await crypto.subtle.importKey('raw',new TextEncoder().encode(webhookSecret),
 {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const result=await crypto.subtle.sign('HMAC',hmac,new TextEncoder().encode(timestamp+'.'+body));
 const signature=Array.from(new Uint8Array(result)).map(x=>x.toString(16).padStart(2,'0')).join('');
 return signatures.some(x=>safeEqual(x,signature));
}
async function processWebhook(req:Request) {
 if(!webhookSecret)return json({error:'Stripe neconfigurat'},503);
 const body=await req.text();
 if(!await validStripeSignature(body,req.headers.get('stripe-signature')))return json({error:'Semnătură Stripe invalidă'},400);
 const event=JSON.parse(body);
 if(event.type!=='payment_intent.succeeded')return json({received:true});
 const intent=event.data?.object;
 const offerId=intent?.metadata?.pont_offer_id;
 const month=intent?.metadata?.pont_campaign_month;
 const restaurantId=intent?.metadata?.pont_restaurant_id;
 if(!offerId||!month||!restaurantId||intent?.currency!=='ron'||intent?.status!=='succeeded')return json({received:true});
 const {data:offer,error:offerError}=await admin.from('auction_offers').select('id,restaurant_id,campaign_month,amount,payment_status,payment_reference').eq('id',offerId).maybeSingle();
 if(offerError)throw offerError;
 if(!offer||offer.restaurant_id!==restaurantId||offer.campaign_month!==month||Math.round(Number(offer.amount)*100)!==intent.amount_received)return json({received:true});
 const {data:control,error:controlError}=await admin.from('pont_auction_control').select('is_open,final_ranking').eq('campaign_month',month).maybeSingle();
 if(controlError)throw controlError;
 if(control?.is_open!==false||!control.final_ranking?.includes(restaurantId))return json({received:true});
 if(offer.payment_status==='paid')return json({received:true});
 const {error}=await admin.from('auction_offers').update({
  payment_status:'paid',payment_method:'stripe',payment_reference:intent.id,paid_at:new Date().toISOString(),
  updated_at:new Date().toISOString()
 }).eq('id',offer.id).neq('payment_status','paid');
 if(error)throw error;
 return json({received:true});
}
async function createIntent(req:Request) {
 if(!secretConfigured())return json({error:'Plățile Stripe nu sunt încă activate pentru PONT.'},503);
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return json({error:'Autentificare necesară'},401);
 const publicClient=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')||'',{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await publicClient.auth.getUser(token);
 if(userError||!user)return json({error:'Sesiune expirată'},401);
 const {data:membership,error:memberError}=await admin.from('restaurant_members').select('restaurant_id').eq('user_id',user.id).order('restaurant_id').limit(1).maybeSingle();
 if(memberError||!membership)return json({error:'Restaurant neautorizat'},403);
 const {month}=await req.json().catch(()=>({month:null}));
 if(typeof month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(month))return json({error:'Campanie invalidă'},400);
 const restaurantId=membership.restaurant_id;
 const {data:control,error:controlError}=await admin.from('pont_auction_control').select('is_open,final_ranking').eq('campaign_month',month).maybeSingle();
 if(controlError)throw controlError;
 if(!control||control.is_open!==false||!Array.isArray(control.final_ranking)||!control.final_ranking.includes(restaurantId))
   return json({error:'Plata devine disponibilă doar după închiderea licitației pentru restaurantele clasate.'},409);
 const {data:offer,error:offerError}=await admin.from('auction_offers').select('id,amount,payment_status,restaurant_id,campaign_month').eq('restaurant_id',restaurantId).eq('campaign_month',month).maybeSingle();
 if(offerError)throw offerError;
 if(!offer)return json({error:'Nu există ofertă de achitat'},404);
 if(offer.payment_status==='paid')return json({error:'Oferta este deja achitată'},409);
 const cents=Math.round(Number(offer.amount)*100);
 if(!Number.isSafeInteger(cents)||cents<5000)return json({error:'Sumă licitată invalidă'},400);
 const params=new URLSearchParams({
  amount:String(cents),currency:'ron','automatic_payment_methods[enabled]':'true',
  'metadata[pont_offer_id]':offer.id,'metadata[pont_campaign_month]':month,
  'metadata[pont_restaurant_id]':restaurantId,
  description:'Promovare PONT – '+month,
 });
 const intent=await stripeRequest('payment_intents',params,'pont-auction-'+offer.id+'-'+cents);
 if(intent.currency!=='ron'||intent.amount!==cents)throw new Error('Datele plății Stripe nu corespund ofertei');
 return json({clientSecret:intent.client_secret,publishableKey:publishable,amount:offer.amount,currency:'ron',status:intent.status});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return json({error:'Metodă nepermisă'},405);
 try {
  const action=new URL(req.url).searchParams.get('action');
  if(action==='webhook')return await processWebhook(req);
  if(action==='create')return await createIntent(req);
  return json({error:'Acțiune necunoscută'},404);
 }catch(error){
  console.error('PONT Stripe:',error);
  return json({error:'Nu s-a putut procesa cererea. Reîncearcă.'},500);
 }
});
