/* Shared PONT navigation. Back is contextual; Home always goes to the entry page. */
(()=>{
 'use strict';
 const KEY='pont_navigation_stack_v2';
 const MAX=24;
 const TTL=2*60*60*1000;
 const now=()=>Date.now();
 function sameOrigin(raw){
  try{
   const u=new URL(raw,location.href);
   return u.origin===location.origin&&/^https?:$/.test(u.protocol)?u:null;
  }catch(_){return null}
 }
 function route(u){return u.pathname}
 function stack(){
  try{
   const entries=JSON.parse(sessionStorage.getItem(KEY)||'[]');
   return Array.isArray(entries)?entries.filter(e=>e&&now()-e.at<TTL&&sameOrigin(e.from)&&sameOrigin(e.to)).slice(-MAX):[];
  }catch(_){return []}
 }
 function save(items){try{sessionStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)))}catch(_){}}
 function matchedIndex(entries){
  for(let i=entries.length-1;i>=0;i--){
   const to=sameOrigin(entries[i].to);
   if(to&&route(to)===location.pathname)return i;
  }
  return -1;
 }
 function previous(){
  const entries=stack(),i=matchedIndex(entries);
  if(i>=0){
   const url=sameOrigin(entries[i].from);
   if(url&&url.href!==location.href)return {url,index:i,entries};
  }
  const ref=sameOrigin(document.referrer);
  return ref&&ref.pathname!==location.pathname?{url:ref,index:-1,entries}:null;
 }
 function goBack(fallback){
  const source=previous();
  if(source){
   if(source.index>=0)save(source.entries.slice(0,source.index));
   // Use native navigation ONLY when the browser referrer actually matches
   // the captured source, allowing iOS to restore the restaurant/checkout.
   const ref=sameOrigin(document.referrer);
   const nav=performance.getEntriesByType?.('navigation')?.[0];
   if(ref&&ref.pathname===source.url.pathname&&ref.search===source.url.search&&history.length>1&&nav?.type!=='reload'){
    history.back();
   }else{
    location.assign(source.url.href);
   }
   return true;
  }
  const safe=sameOrigin(fallback)||sameOrigin('./');
  if(safe)location.assign(safe.href);
  return false;
 }
 window.PontNavigation=Object.freeze({
  goBack,
  previous:()=>previous()?.url.href||''
 });
 document.addEventListener('click',event=>{
  const link=event.target?.closest?.('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(link.hasAttribute('data-pont-back')){
   event.preventDefault();
   goBack(link.href);
   return;
  }
  if(link.hasAttribute('download')||(link.target&&link.target.toLowerCase()!=='_self'))return;
  const dest=sameOrigin(link.href);
  if(!dest||dest.href===location.href||dest.pathname===location.pathname)return;
  const entries=stack();
  const index=matchedIndex(entries);
  // Leaving a previously visited page creates a new branch of navigation.
  const retained=index>=0?entries.slice(0,index+1):entries;
  retained.push({from:location.href,to:dest.href,at:now()});
  save(retained);
 },true);
})();