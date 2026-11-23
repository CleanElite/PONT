/* PONT public-site consent: two equally accessible choices, prior opt-in for persistent visit identification. */
(()=>{'use strict';
 const KEY='pont_analytics_consent_v1',VISITOR='pont_analytics_visitor_v1';
 const landing=location.pathname==='/'||/\/index\.html$/.test(location.pathname);
 function get(){try{return localStorage.getItem(KEY)}catch(_){return null}}
 function choose(yes){
  try{localStorage.setItem(KEY,yes?'yes':'no');if(!yes){localStorage.removeItem(VISITOR);for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith('pont_visit_'))sessionStorage.removeItem(k)}}}
  catch(_){/* consent denied if browser does not permit saving */}
  const banner=document.getElementById('pontGlobalPrivacyBanner');if(banner)banner.hidden=true;
  const legacy=document.getElementById('pontAnalyticsConsent');if(legacy)legacy.hidden=true;
  window.dispatchEvent(new CustomEvent('pont:consentchange',{detail:{analytics:yes}}));
 }
 function ready(){
  const legacy=document.getElementById('pontAnalyticsConsent');
  if(legacy)legacy.hidden=true;
  const css=document.createElement('style');
  css.textContent='.pont-global-consent[hidden]{display:none!important}.pont-global-consent{position:fixed;z-index:2147483000;bottom:max(13px,env(safe-area-inset-bottom));left:12px;right:12px;margin:auto;max-width:560px;padding:14px;border:1px solid #7cd2c1;border-radius:18px;background:#052a30;color:#f1fffb;box-shadow:0 16px 60px #000a;font:12px/1.48 system-ui;text-align:left}.pont-global-consent p{margin:0 0 12px}.pont-global-consent a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:8px 5px;color:#9ef7e5;text-decoration:underline}.pont-global-consent a:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:5px}.pont-global-consent div{display:flex;gap:10px;flex-wrap:wrap}.pont-global-consent button{flex:1 1 140px;min-height:44px;border-radius:11px;border:1px solid #8edccd;font:700 13px system-ui;cursor:pointer;padding:9px 13px}.pont-global-consent .pont-consent-yes{background:#b7f9e7;color:#07362f}.pont-global-consent .pont-consent-no{background:transparent;color:#edfff8}';
  document.head.append(css);
  const banner=document.createElement('aside');banner.id='pontGlobalPrivacyBanner';banner.className='pont-global-consent';banner.setAttribute('aria-label','Preferințe privind cookie-urile');
  banner.innerHTML='<p><strong>Confidențialitatea ta contează.</strong> PONT folosește stocarea necesară funcționării site-ului. Cu acordul tău, poate salva un identificator aleatoriu pentru statistici privind vizitele repetate. Refuzul nu limitează utilizarea platformei. <a href="'+new URL('cookies.html',import.meta.url).href+'">Detalii cookie</a> · <a href="'+new URL('confidentialitate.html',import.meta.url).href+'">GDPR</a></p><div><button class="pont-consent-no" type="button">Respinge toate</button><button class="pont-consent-yes" type="button">Acceptă toate</button></div>';
  banner.querySelector('.pont-consent-no').addEventListener('click',()=>choose(false));
  banner.querySelector('.pont-consent-yes').addEventListener('click',()=>choose(true));
  banner.hidden=true;
  document.body.append(banner);
  const reveal=()=>{if(!['yes','no'].includes(get()))banner.hidden=false};
  if(landing){
   // Intro is controlled by the landing page. Avoid revealing under the curtain.
   const intro=document.getElementById('pont-intro');
   const introFinished=()=>!document.documentElement.classList.contains('pont-intro-active')&&(!intro||intro.hidden);
   if(introFinished())reveal();
   else{
    window.addEventListener('pont:introfinished',reveal,{once:true});
    // Also recover if the intro ends without dispatching the event.
    const observer=new MutationObserver(()=>{if(introFinished()){observer.disconnect();reveal()}});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    if(intro)observer.observe(intro,{attributes:true,attributeFilter:['hidden']});
   }
  }else reveal();
  window.addEventListener('pont:open-cookie-settings',()=>{banner.hidden=false});
  const footer=document.querySelector('footer');
  // The public restaurant listings use their existing legal-document links in the footer;
  // avoid adding extra GDPR / cookie-settings controls to those primary screens.
  const isMainListing=/\/pranz-slobozia\/(?:index\.html)?$/.test(location.pathname)||/\/(?:meniul-zilei|iesire-in-oras)\/?(?:index\.html)?$/.test(location.pathname);
  if(!isMainListing&&!landing&&footer&&!footer.querySelector('[data-pont-gdpr]')){
   const nav=footer.querySelector('nav')||footer;
   const link=document.createElement('a');link.href=new URL('confidentialitate.html',import.meta.url).href;
   link.textContent='GDPR';link.dataset.pontGdpr='true';
   link.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:9px 11px;margin:0 4px;color:inherit;text-decoration:underline';
   nav.append(link);
  }
  // Visitors must be able to revise a prior decision without waiting for the banner.
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Preferințe cookie';toggle.dataset.pontCookieSettings='true';
  toggle.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:44px;background:none;color:inherit;border:0;text-decoration:underline;cursor:pointer;padding:9px 12px;font:inherit';
  toggle.addEventListener('click',()=>{banner.hidden=false});
  if(!isMainListing&&!landing)(footer?.querySelector('nav')||footer||document.body).append(toggle);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
