// Shared lightweight Realtime Presence for restaurant admin activity.
// Status is advisory, not an authentication or security decision.
export const PONT_PRESENCE_CHANNEL = 'pont-restaurant-admin-presence-v1';
export const PONT_ACTIVE_WINDOW_MS = 180000;
export function startRestaurantPresence(db, getUser, getRestaurants) {
 let channel=null, lastTrack=0, lastActivity=Date.now(), stopped=false;
 const track=async(force=false)=>{
  if(stopped||document.hidden||!channel)return;
  if(!force&&Date.now()-lastTrack<30000)return;
  const user=getUser(), restaurantIds=getRestaurants().map(r=>r.id);
  if(!user?.id||!restaurantIds.length)return;
  lastTrack=Date.now();
  try{await channel.track({user_id:user.id,restaurant_ids:restaurantIds,active_at:lastActivity});}catch(_){}
 };
 const onActivity=()=>{
  const wasIdle=Date.now()-lastActivity>PONT_ACTIVE_WINDOW_MS;
  lastActivity=Date.now();
  track(wasIdle);
 };
 const onVisibility=()=>{if(document.hidden){channel?.untrack().catch(()=>{});}else{lastActivity=Date.now();track(true);}};
 channel=db.channel(PONT_PRESENCE_CHANNEL,{config:{presence:{key:getUser()?.id||'restaurant-admin'}}});
 channel.subscribe(status=>{if(status==='SUBSCRIBED')track(true);});
 ['pointerdown','keydown','touchstart','scroll'].forEach(event=>document.addEventListener(event,onActivity,{passive:true}));
 document.addEventListener('visibilitychange',onVisibility);
 const interval=setInterval(()=>{if(document.hidden||Date.now()-lastActivity>PONT_ACTIVE_WINDOW_MS){channel?.untrack().catch(()=>{});}else track();},30000);
 return ()=>{
  stopped=true;clearInterval(interval);
  ['pointerdown','keydown','touchstart','scroll'].forEach(event=>document.removeEventListener(event,onActivity));
  document.removeEventListener('visibilitychange',onVisibility);
  if(channel){channel.untrack().catch(()=>{});db.removeChannel(channel);}
 };
}
export function watchRestaurantPresence(db, onUpdate) {
 const channel=db.channel(PONT_PRESENCE_CHANNEL);
 let stopped=false;
 const refresh=()=>{
  if(stopped)return;
  const online=new Set(), cutoff=Date.now()-PONT_ACTIVE_WINDOW_MS;
  for(const sessions of Object.values(channel.presenceState())){
   for(const session of sessions){
    if(Number(session.active_at)<cutoff||!Array.isArray(session.restaurant_ids))continue;
    for(const id of session.restaurant_ids)online.add(String(id));
   }
  }
  onUpdate(online);
 };
 channel.on('presence',{event:'sync'},refresh).subscribe(status=>{if(status==='SUBSCRIBED')refresh();});
 const interval=setInterval(refresh,15000);
 return ()=>{stopped=true;clearInterval(interval);db.removeChannel(channel);};
}
