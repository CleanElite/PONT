import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const pages=['/','/meniul-zilei/','/iesire-in-oras/','/login/','/termeni.html','/confidentialitate.html','/cookies.html','/informatii-restaurant/'];
const viewports=[{name:'phone',width:390,height:844,isMobile:true},{name:'tablet',width:768,height:1024,isMobile:true},{name:'desktop',width:1440,height:900,isMobile:false}];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
for(const viewport of viewports){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.isMobile,locale:'ro-RO',serviceWorkers:'block'});
 for(const path of pages){
  const page=await context.newPage();
  const item={path,viewport:viewport.name,status:'NETESTAT',violations:[],incomplete:[],touch_target_small:[],keyboard_focusable:0};
  try{
   const response=await page.goto('https://pont.city'+path,{waitUntil:'domcontentloaded',timeout:15000});
   await page.waitForTimeout(path.includes('meniul-zilei')||path.includes('iesire-in-oras')?4200:800);
   const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
   item.status=response?.ok()?'OK':'PROBLEMĂ';
   item.violations=report.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.help,nodes:v.nodes.slice(0,15).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,300)}))}));
   item.incomplete=report.incomplete.filter(x=>x.impact==='serious'||x.impact==='critical').map(x=>({id:x.id,nodes:x.nodes.length}));
   item.touch_target_small=await page.evaluate(()=>{
    const visible=el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return box.width>0&&box.height>0&&style.visibility!=='hidden'&&style.display!=='none'};
    return [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button]')].filter(visible).filter(el=>{const b=el.getBoundingClientRect();return b.width<44||b.height<44}).slice(0,40).map(el=>({element:el.tagName,identifier:el.id||el.className||el.name||'',text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,50),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}));
   });
   item.keyboard_focusable=await page.locator('a[href],button,input,select,textarea,[tabindex="0"]').count();
   // Keyboard reachability: a Tab press must move focus to a real, rendered control.
   await page.keyboard.press('Tab');
   item.keyboard_first_focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id||null,is_body:document.activeElement===document.body}));
   // 200% font scaling is a reflow smoke test, not a substitute for native text zoom.
   await page.addStyleTag({content:'html{font-size:200%!important}'});
   item.font_200_percent_overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);

  }catch(error){item.error=String(error).slice(0,400)}
  results.push(item);
  console.log('A11Y',viewport.name,path,item.status,'violations',item.violations.map(x=>x.id+':'+x.nodes.length).join(','),'touch<44',item.touch_target_small.length);
  await page.close();
 }
 await context.close();
}
await browser.close();
await mkdir('qa-a11y',{recursive:true});await writeFile('qa-a11y/results.json',JSON.stringify({generated_at:new Date().toISOString(),results},null,2));
console.log('A11Y_SUMMARY',JSON.stringify({checks:results.length,issues:results.filter(x=>x.violations.length).length,violations_by_rule:[...new Set(results.flatMap(x=>x.violations.map(v=>v.id)))],untested:results.filter(x=>x.status==='NETESTAT').length}));
