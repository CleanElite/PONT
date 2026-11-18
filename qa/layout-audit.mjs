import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = process.cwd();
const origin = 'https://pont-layout.test';
const restaurant = {id:'layout-restaurant',name:'Bucătăria tradițională pentru toată familia',phone:'0700000000',menu_price:39,minimum_order:1,enabled:true,menu_module_visible:true,city_module_visible:true,access_meniul_zilei:true,access_iesire_in_oras:true,offers_delivery:true,accepts_card:true};
const dishes = [
 ['first','Ciorbă de legume cu smântână și ardei iute',19],
 ['first','Supă de pui cu tăiței de casă',18],
 ['second','Șnițel de pui cu piure de cartofi și salată de sezon',27],
 ['second','Musaca de cartofi cu carne și legume',29],
 ['dessert','Papanași cu smântână și dulceață',0]
].map(([category,name,price],i)=>({id:'dish-'+i,category,name,price,restaurant_id:restaurant.id}));
const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());
const menu = {id:'layout-menu',restaurant_id:restaurant.id,price:39,service_date:day,date:day,title:'Meniul zilei',dish_selection:dishes,published:true};
const event = {id:'layout-event',restaurant_id:restaurant.id,restaurant_name:restaurant.name,title:'Seară de muzică și gastronomie tradițională',description:'O seară de test pentru textele lungi și butoanele afișate lângă evenimente.',event_date:day,start_time:'19:00',status:'published',published:true};
const fixture = `
const restaurant=${JSON.stringify(restaurant)};
const user={id:'layout-user',email:'layout@example.test'};
const role=/super-admin/.test(location.pathname)?'super_admin':'restaurant_admin';
const tables=${JSON.stringify({restaurants:[restaurant],menus:[menu],dishes,restaurant_dishes:dishes,restaurant_members:[{restaurant_id:restaurant.id}],pont_city_events:[event]})};
tables.profiles=[{role,user_id:user.id}];
const identity=async()=>({data:{user,session:{user,access_token:'layout-token'}},error:null});
function query(rows) {
 let data=rows;
 const q={then:(done)=>Promise.resolve({data,error:null,count:Array.isArray(data)?data.length:0}).then(done)};
 for(const key of ['select','eq','neq','or','gte','lte','gt','lt','in','not','is','order','range','limit','filter','contains','match','update','insert','delete','upsert'])q[key]=()=>q;
 q.single=q.maybeSingle=()=>{data=Array.isArray(data)?data[0]??null:data;return q};
 return q;
}
export function createClient(){return{
 auth:{getUser:identity,getSession:identity,onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 from:name=>query(tables[name]||[]),
 rpc:name=>query(({is_super_admin:role==='super_admin',my_restaurant_access:[{restaurant_id:restaurant.id}],pont_has_active_city_subscription:true})[name]??[]),
 channel:()=>({on(){return this},subscribe(){return this}}),
 removeChannel(){},
 functions:{invoke:async()=>({data:[],error:null})}
}}
`;

const paths = (await readdir(root,{recursive:true})).filter(file=>/\.html$/.test(file)&&!/^node_modules|^backend|^qa\//.test(file)).sort();
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
await mkdir('qa-results/layout',{recursive:true});
const browser = await chromium.launch({args:['--no-sandbox']});
const measures=[];
for(const width of [320,390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:width<768?844:950},isMobile:width<768,hasTouch:width<768,serviceWorkers:'block',reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fixture});
  if(url.pathname.includes('/rest/v1/')){
   const rows=({restaurants:[restaurant],menus:[menu],pont_city_events:[event]})[url.pathname.split('/').pop()]||[];
   return route.fulfill({json:rows,headers:{'access-control-allow-origin':'*'}});
  }
  if(url.origin!==origin)return route.abort();
  const local=resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!local.startsWith(root+sep)||!existsSync(local))return route.fulfill({status:404});
  return route.fulfill({contentType:mime[extname(local)],body:readFileSync(local)});
 });
 const page=await context.newPage();
 for(const file of paths){
  const path='/'+file.replace(/(^|\/)index\.html$/,'$1');
  const slug=file.replace(/\.html$/,'').replaceAll('/','-');
  const errors=[];
  const onError=error=>errors.push(error.message);
  page.on('pageerror',onError);
  async function measure(state){
   const layout=await page.evaluate(()=>{
    const options='button,input,select,textarea,summary,a[class],label,h1,h2,h3,.card,.panel,[role=tab]';
    const controls='button,input,select,textarea,summary,a[class],[role=tab]';
    const ignore='[aria-hidden=true],.pont-dish-gallery__track,[hidden],.pont-skip-link,.skip-link';
    const viewport=document.documentElement.clientWidth;
    const all=[...document.querySelectorAll(options)].filter(el=>{
     const r=el.getBoundingClientRect();
     return r.width>2&&r.height>2&&getComputedStyle(el).visibility==='visible'&&!el.closest(ignore);
    });
    const name=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].slice(0,3).join('.');
    const issues=[];
    for(const el of all){
     const r=el.getBoundingClientRect();
     const label=(el.getAttribute('aria-label')||el.textContent||el.placeholder||'').trim().replace(/\s+/g,' ').slice(0,75);
     if(r.right>viewport+3||r.left<-3)issues.push(['viewport',name(el),label,Math.round(r.left),Math.round(r.right)]);
     if((el.matches('button,summary,select,label,h1,h2,h3,a[class]')&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+3))issues.push(['content',name(el),label,el.clientWidth,el.scrollWidth]);
     if(el.matches(controls)){
      const form=el.closest('form');
      if(form&&form!==el){
       const box=form.getBoundingClientRect();
       if(r.right>box.right+3||r.left<box.left-3)issues.push(['form',name(el),label,name(form)]);
      }
     }
    }
    const candidates=all.filter(el=>el.matches('button,input:not([type=hidden]),select,textarea'));
    for(const [index,el] of candidates.entries()){
     const r=el.getBoundingClientRect();
     for(const other of candidates.slice(index+1)){
      if(el.contains(other)||other.contains(el))continue;
      const q=other.getBoundingClientRect();
      if(Math.min(r.right,q.right)-Math.max(r.left,q.left)>4&&Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top)>4){
       if(r.width>12&&r.height>12&&q.width>12&&q.height>12)issues.push(['overlap',name(el),name(other)]);
      }
     }
    }
    return {path:location.pathname,viewport,scrollWidth:document.documentElement.scrollWidth,visible:all.length,issues:issues.slice(0,30)};
   });
   measures.push({file,width,state,...layout,errors:errors.splice(0)});
   if(width===390||layout.issues.length)await page.screenshot({path:`qa-results/layout/${width}-${slug}-${state}.png`,timeout:5000});
  }
  try{
   await page.goto(origin+path,{waitUntil:'load',timeout:7500});
   if(/(?:^|\/)super-admin\/index/.test(file)||/\/admin-v2\//.test('/'+file))await page.locator('#app:not([hidden])').waitFor({timeout:2500}).catch(()=>{});
   await page.locator('#pontGlobalPrivacyBanner .pont-consent-no').click({timeout:250}).catch(()=>{});
   await measure('initial');
   const controls=await page.locator('#app .admin-nav button[data-view],#app .admin-nav button[data-tab],#app button[data-city-tab]').evaluateAll(items=>items.map(el=>[el.id,el.dataset.view,el.dataset.tab,el.dataset.cityTab]));
   for(const [id,view,tab,city] of controls){
    const locator=page.locator(id?'#'+id:view?`button[data-view="${view}"]`:tab?`button[data-tab="${tab}"]`:`button[data-city-tab="${city}"]`).first();
    if(await locator.isVisible()&&await locator.isEnabled()){
     if(await locator.click({timeout:1000}).then(()=>true,()=>false))await measure(id||view||tab||city);
    }
   }
   if(/meniul-zilei\/index/.test(file)){
    await page.goto(origin+path+'?restaurant='+restaurant.id,{waitUntil:'load',timeout:7500});
    if(await page.locator('#order[open]').waitFor({timeout:1500}).then(()=>true,()=>false)){
     await measure('restaurant');
     const quantity=page.locator('#qty-0');
     if(await quantity.isVisible()){
      await quantity.fill('1');
      await page.locator('#qty-1').fill('1');
      await page.locator('#openCheckout').click({timeout:1200}).catch(()=>{});
      if(await page.locator('#pontCheckoutOverlay[open]').count())await measure('checkout');
     }
    }
   }
  }catch(error){measures.push({file,width,error:String(error).split('\n')[0]})}
  page.off('pageerror',onError);
 }
 await context.close();
}
await browser.close();
await writeFile('qa-results/layout-audit.json',JSON.stringify(measures,null,2));
for(const entry of measures)if(entry.error||entry.errors?.length||entry.issues?.length||entry.scrollWidth>entry.viewport+3)
 console.log('LAYOUT',JSON.stringify(entry));
console.log('LAYOUT_TOTAL',JSON.stringify({screens:measures.length,pages:paths.length,issues:measures.reduce((n,r)=>n+(r.issues?.length||0),0),errors:measures.filter(r=>r.error).length}));
