// Verified server-side heartbeat. Restaurant ownership is checked by Postgres RLS.
// This module never broadcasts user IDs or restaurant IDs to public channels.
export const PONT_ACTIVE_WINDOW_MS = 180000;
export function startRestaurantPresence(db) {
 let stopped=false, lastActivity=Date.now(), lastPing=0, inFlight=false;
 const ping=async(force=false)=>{
  if(stopped||document.hidden||Date.now()-lastActivity>PONT_ACTIVE_WINDOW_MS||inFlight)return;
  if(!force&&Date.now()-lastPing<30000)return;
  inFlight=true;
  try{const {error}=await db.rpc('pont_touch_my_presence');if(!error)lastPing=Date.now();}catch(_){}
  finally{inFlight=false;}
 };
 const activity=()=>{const idle=Date.now()-lastActivity>PONT_ACTIVE_WINDOW_MS;lastActivity=Date.now();void ping(idle);};
 const visibility=()=>{if(!document.hidden){lastActivity=Date.now();void ping(true);}};
 ['pointerdown','keydown','touchstart','scroll'].forEach(type=>document.addEventListener(type,activity,{passive:true}));
 document.addEventListener('visibilitychange',visibility);
 const interval=setInterval(()=>{void ping();},30000);
 void ping(true);
 return ()=>{stopped=true;clearInterval(interval);['pointerdown','keydown','touchstart','scroll'].forEach(type=>document.removeEventListener(type,activity));document.removeEventListener('visibilitychange',visibility);};
}
export function watchRestaurantPresence(db,onUpdate) {
 let stopped=false,inFlight=false;
 const refresh=async()=>{
  if(stopped||inFlight)return;
  inFlight=true;
  try{
   const {data,error}=await db.from('pont_admin_presence').select('restaurant_id,last_active').gte('last_active',new Date(Date.now()-PONT_ACTIVE_WINDOW_MS).toISOString());
   if(!error&&!stopped)onUpdate(new Set((data||[]).map(row=>String(row.restaurant_id))));
  }catch(_){}
  finally{inFlight=false;}
 };
 const interval=setInterval(()=>{void refresh();},15000);
 void refresh();
 return ()=>{stopped=true;clearInterval(interval);};
}
