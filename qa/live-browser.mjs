import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const ORIGIN='https://pont.city';
const pages=[
 {path:'/',name:'acasa'},
 {path:'/meniul-zilei/',name:'meniul-zilei'},
 {path:'/iesire-in-oras/',name:'iesire-in-oras'},
 {path:'/informatii-restaurant/',name:'informatii-restaurant'},
 {path:'/login/',name:'login'},
 {path:'/termeni.html',name:'termeni'},
 {path:'/confidentialitate.html',name:'confidentialitate'},
 {path:'/cookies.html',name:'cookies'}
];
const sizes=[
 {name:'telefon',width:390,height:844,isMobile:true,deviceScaleFactor:1},
 {name:'tableta',width:768,height:1024,isMobile:true,deviceScaleFactor:1},
 {name:'desktop',width:1440,height:900,isMobile:false,deviceScaleFactor:1}
];
await mkdir('qa-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={generated_at:new Date().toISOString(),origin:ORIGIN,viewports:sizes.map(({name,width,height})=>({name,width,height})),checks:[]};
for(const viewport of sizes){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.isMobile,deviceScaleFactor:1,ignoreHTTPSErrors:false,locale:'ro-RO',serviceWorkers:'block'});
 let failedNavigations=0;
 for(const {name,path} of pages){
  const page=await context.newPage();
  const errors=[],consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,200))});
  const result={viewport:viewport.name,size:viewport.width+'x'+viewport.height,path,url:ORIGIN+path,http:null,final_url:null,title:null,headings:[],has_description:false,canonical:null,og_image:null,horizontal_overflow:null,small_controls:null,load_ms:null,ttfb_ms:null,lcp_ms:null,cls:null,js_errors:errors,console_errors:consoleErrors,screenshot:null,status:'NETESTAT'};
  try{
   await page.addInitScript(()=>{
    window.__qaVitals={lcp:null,cls:0,shifts:[]};
    try{new PerformanceObserver(list=>{for(const item of list.getEntries())window.__qaVitals.lcp=item.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
    try{new PerformanceObserver(list=>{for(const item of list.getEntries())if(!item.hadRecentInput){window.__qaVitals.cls+=item.value;if(item.value>.002)window.__qaVitals.shifts.push({value:Number(item.value.toFixed(4)),time:Math.round(item.startTime),sources:(item.sources||[]).slice(0,4).map(src=>({tag:src.node?.tagName||null,id:src.node?.id||null,class_name:String(src.node?.className||'').slice(0,90),before:src.previousRect?.y,after:src.currentRect?.y}))});}}).observe({type:'layout-shift',buffered:true})}catch{}
   });
   const started=Date.now();
   const response=await page.goto(ORIGIN+path,{waitUntil:'domcontentloaded',timeout:11000});
   result.http=response?.status()??null;result.final_url=page.url();result.load_ms=Date.now()-started;
   await page.waitForTimeout(name==='meniul-zilei'||name==='iesire-in-oras'?4500:1200);
   result.title=await page.title();
   const scan=await page.evaluate(()=>{
    const visible=el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const small=[...document.querySelectorAll('button,a,input,select,textarea')].filter(visible).filter(el=>{const b=el.getBoundingClientRect();return b.width<44||b.height<44}).slice(0,12).map(el=>({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,45),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}));
    const nav=performance.getEntriesByType('navigation')[0];
    return {description:!!document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href||null,og_image:document.querySelector('meta[property="og:image"]')?.content||null,headings:[...document.querySelectorAll('h1')].map(el=>el.textContent.trim().slice(0,90)),horizontal_overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>innerWidth+2,small_controls:small,ttfb_ms:nav?Math.round(nav.responseStart-nav.requestStart):null,lcp_ms:window.__qaVitals?.lcp?Math.round(window.__qaVitals.lcp):null,cls:window.__qaVitals?Number(window.__qaVitals.cls.toFixed(4)):null,shift_sources:window.__qaVitals?.shifts||[]};
   });
   Object.assign(result,scan);
   result.screenshot='qa-results/'+viewport.name+'-'+name+'.png';
   await page.screenshot({path:result.screenshot,fullPage:false,animations:'disabled',timeout:15000});
   result.status=result.http>=200&&result.http<400?'OK':'PROBLEMĂ';
   failedNavigations=0;
  }catch(error){result.status='NETESTAT';result.error=String(error).slice(0,350);failedNavigations++}
  report.checks.push(result);
  console.log('QA',result.viewport,result.path,result.status,result.http,result.error||'',result.horizontal_overflow===true?'OVERFLOW':'');
  await page.close();
  if(failedNavigations>=2){
    for(const pending of pages.slice(pages.findIndex(x=>x.name===name)+1))report.checks.push({viewport:viewport.name,size:viewport.width+'x'+viewport.height,path:pending.path,status:'NETESTAT',error:'Oprit după două eșecuri consecutive de conexiune; nu s-a accesat pagina.'});
    break;
  }
 }
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
report.extra={url_checks:[],redirect_checks:[],link_checks:[],events:null,menu:null,login:null,whatsapp_sent:false,admin_data_mutated:false};
try{
 await page.goto(ORIGIN+'/iesire-in-oras/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(4500);
 report.extra.events={visible_cards:await page.locator('.event-card').count(),empty_state:await page.locator('.event-empty').count(),proposal_form_present:await page.locator('#eventSubmitForm').count()};
 await page.goto(ORIGIN+'/meniul-zilei/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(4000);
 report.extra.menu={restaurant_cards:await page.locator('#list .menu-card, #list .restaurant-card, #list button').count(),whatsapp_destination_present:(await page.locator('a[href*="wa.me"],a[href*="api.whatsapp.com"]').count())>0};
 const publicInternalLinks=new Set();
 for(const pagePath of ['/','/meniul-zilei/','/iesire-in-oras/']){
  await page.goto(ORIGIN+pagePath,{waitUntil:'domcontentloaded',timeout:11000});
  const hrefs=await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.href));
  for(const href of hrefs){try{const url=new URL(href);if(url.origin===ORIGIN)publicInternalLinks.add(url.pathname)}catch{}}
 }
 for(const internal of [...publicInternalLinks].slice(0,30)){
  try{const resp=await page.request.get(ORIGIN+internal,{timeout:10000,failOnStatusCode:false});report.extra.link_checks.push({path:internal,status:resp.status(),final_url:resp.url()})}
  catch(error){report.extra.link_checks.push({path:internal,status:null,error:String(error).slice(0,130)})}
 }
 for(const url of ['http://pont.city/','https://www.pont.city/','http://www.pont.city/']){
  try{const resp=await page.request.get(url,{timeout:12000,failOnStatusCode:false,maxRedirects:7});report.extra.redirect_checks.push({url,status:resp.status(),final_url:resp.url()})}
  catch(error){report.extra.redirect_checks.push({url,status:null,error:String(error).slice(0,170)})}
 }
 await page.goto(ORIGIN+'/login/',{waitUntil:'domcontentloaded',timeout:30000});
 report.extra.login={login_form:await page.locator('form').count(),password_field:await page.locator('input[type="password"]').count(),forgot_password:await page.getByText('Ai uitat parola?',{exact:false}).count()};
 for(const path of ['/robots.txt','/sitemap.xml','/404.html','/offline.html','/url-inexistent-qa-2026/']){
  try{const resp=await page.request.get(ORIGIN+path,{timeout:15000,failOnStatusCode:false});report.extra.url_checks.push({path,status:resp.status(),final_url:resp.url()})}
  catch(error){report.extra.url_checks.push({path,status:null,error:String(error).slice(0,160)})}
 }
}catch(error){report.extra.error=String(error).slice(0,450)}
await context.close();
// Test only browser-local consent state and PWA offline fallback; no orders, messages, or payments.
report.extra.privacy={status:'NETESTAT'};
try{
 const privacyContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const privacyPage=await privacyContext.newPage();
 await privacyPage.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:12000});
 const refuse=privacyPage.locator('#pontGlobalPrivacyBanner .pont-consent-no');
 await refuse.waitFor({state:'visible',timeout:8000});
 await refuse.click();
 const state=await privacyPage.evaluate(()=>({consent:localStorage.getItem('pont_analytics_consent_v1'),visitor:localStorage.getItem('pont_analytics_visitor_v1')}));
 report.extra.privacy={status:state.consent==='no'&&!state.visitor?'OK':'PROBLEMĂ',...state};
 await privacyContext.close();
}catch(error){report.extra.privacy={status:'NETESTAT',error:String(error).slice(0,250)}}
report.extra.pwa={status:'NETESTAT'};
try{
 const pwaContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 const pwaPage=await pwaContext.newPage();
 await pwaPage.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:12000});
 await pwaPage.evaluate(async()=>{await navigator.serviceWorker.ready});
 await pwaPage.reload({waitUntil:'domcontentloaded',timeout:12000});
 const controlled=await pwaPage.evaluate(()=>!!navigator.serviceWorker.controller);
 await pwaContext.setOffline(true);
 await pwaPage.goto(ORIGIN+'/iesire-in-oras/',{waitUntil:'domcontentloaded',timeout:12000});
 const offlineTitle=await pwaPage.title();
 report.extra.pwa={status:controlled&&offlineTitle.includes('Fără conexiune')?'OK':'PROBLEMĂ',controlled,offline_title:offlineTitle};
 await pwaContext.setOffline(false);
 await pwaContext.close();
}catch(error){report.extra.pwa={status:'NETESTAT',error:String(error).slice(0,250)}}
await browser.close();
await writeFile('qa-results/report.json',JSON.stringify(report,null,2));
const successful=report.checks.filter(x=>x.status==='OK').length;
console.log('QA_SUMMARY',JSON.stringify({checks:report.checks.length,successful,failed:report.checks.filter(x=>x.status==='PROBLEMĂ').length,untested:report.checks.filter(x=>x.status==='NETESTAT').length,extra:report.extra}));
