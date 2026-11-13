/* PONT navigation: back returns to the real originating view; Home is explicit. */
(()=>{
 'use strict';
 const KEY='pont_previous_page_v1';
 const AGE=30*60*1000;
 function local(url){
  try{const u=new URL(url,location.href);return u.origin===location.origin&&/^https?:$/.test(u.protocol)?u:null}catch(_){return null}
 }
 function clean(url){return url?url.href:''}
 function originFromClick(){
  try{
   const value=JSON.parse(sessionStorage.getItem(KEY)||'null');
   if(!value||!Number.isFinite(value.time)||Date.now()-value.time>AGE)return null;
   const destination=local(value.to),source=local(value.from);
   if(!destination||!source||destination.pathname!==location.pathname||source.href===location.href)return null;
   return source;
  }catch(_){return null}
 }
 function originFromReferrer(){
  const u=local(document.referrer);
  return u&&u.pathname!==location.pathname?u:null;
 }
 function previous(){
  // Click tracking preserves the query string of the restaurant being viewed,
  // even when browsers omit Referer or the destination cleans its own query.
  return originFromClick()||originFromReferrer();
 }
 function goBack(fallback){
  const origin=previous();
  if(origin){
   // Native back restores scroll, the restaurant modal and checkout form.
   // On a reloaded/deep-linked document, use the captured source directly.
   const navigation=performance.getEntriesByType?.('navigation')?.[0];
   if(history.length>1&&navigation?.type!=='reload'&&originFromReferrer()){
    history.back();return true;
   }
   location.assign(clean(origin));return true;
  }
  const fallbackUrl=local(fallback)||local('./');
  if(fallbackUrl)location.assign(fallbackUrl.href);
  return false;
 }
 window.PontNavigation=Object.freeze({goBack,previous:()=>clean(previous())});
 document.addEventListener('click',event=>{
  const link=event.target?.closest?.('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(link.hasAttribute('data-pont-back')){
   const fallback=link.href;
   event.preventDefault();
   goBack(fallback);
   return;
  }
  if(link.target&&link.target.toLowerCase()!=='_self'||link.hasAttribute('download'))return;
  const destination=local(link.href);
  if(!destination||destination.href===location.href)return;
  // Do not track a fragment-only transition as a page departure.
  if(destination.pathname===location.pathname&&destination.search===location.search)return;
  try{sessionStorage.setItem(KEY,JSON.stringify({from:location.href,to:destination.href,time:Date.now()}))}catch(_){}
 },true);
})();
