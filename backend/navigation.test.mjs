import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../pont-navigation-history.js',import.meta.url),'utf8');
const base='https://pont.city';
const KEY='pont_navigation_stack_v2';
const A=base+'/';
const B=base+'/meniul-zilei/?restaurant=412eaf72-cbba-4151-b826-905612345678';
const C=base+'/informatii-restaurant/?restaurant=412eaf72-cbba-4151-b826-905612345678';
const D=base+'/promovare/?month=2026-12';
const pair=(from,to)=>({from,to,at:Date.now()});
function harness(href,{referrer='',historyLength=3,stored=[],type='navigate'}={}){
 const store=new Map([[KEY,JSON.stringify(stored)]]);
 const calls={back:0,assigned:[],events:{}};
 const u=new URL(href);
 const location={href:u.href,origin:u.origin,pathname:u.pathname,assign(url){calls.assigned.push(url)}};
 const history={length:historyLength,back(){calls.back++}};
 const document={referrer,addEventListener(name,fn){calls.events[name]=fn}};
 const context={window:null,document,history,location,Date,URL,
  sessionStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)},
  performance:{getEntriesByType:()=>[{type}]}};
 context.window=context;
 runInNewContext(code,context,{filename:'pont-navigation-history.js'});
 function click(href,{back=false,target='_self',modified=false}={}){
  const link={href,target,hasAttribute:name=>back&&name==='data-pont-back'};
  let prevented=false;
  calls.events.click({target:{closest:()=>link},defaultPrevented:false,button:0,
   ctrlKey:modified,metaKey:false,shiftKey:false,altKey:false,
   preventDefault(){prevented=true}});
  return prevented;
 }
 return {calls,store,click,nav:context.PontNavigation,
  entries:()=>JSON.parse(store.get(KEY)||'[]')};
}
test('Back restores menu with selected restaurant, preserving native history',()=>{
 const h=harness(C,{referrer:B,stored:[pair(A,B),pair(B,C)]});
 assert.equal(h.click(B,{back:true}),true);
 assert.equal(h.calls.back,1);
 assert.deepEqual(h.calls.assigned,[]);
 assert.equal(h.entries().length,1);
});
test('Back restores exact source including query and hash without Referer',()=>{
 const previous=base+'/super-admin/?month=2026-12#auctions';
 const h=harness(D,{stored:[pair(previous,D)]});
 h.click(base+'/admin-v2/',{back:true});
 assert.deepEqual(h.calls.assigned,[previous]);
 assert.equal(h.calls.back,0);
 assert.equal(h.entries().length,0);
});
test('A → B → C returns to B and then A, never forward to C again',()=>{
 const hC=harness(C,{stored:[pair(A,B),pair(B,C)],type:'reload'});
 hC.click(A,{back:true});
 assert.deepEqual(hC.calls.assigned,[B]);
 const hB=harness(B,{referrer:C,stored:hC.entries(),type:'reload'});
 hB.click(A,{back:true});
 assert.deepEqual(hB.calls.assigned,[A]);
 assert.equal(hB.entries().length,0);
});
test('direct link without known previous origin uses local fallback',()=>{
 const h=harness(D,{referrer:'https://external.example/'});
 h.click(base+'/admin-v2/',{back:true});
 assert.deepEqual(h.calls.assigned,[base+'/admin-v2/']);
});
test('Home and PONT logo links are not hijacked by Back behavior',()=>{
 const h=harness(base+'/admin-v2/');
 assert.equal(h.click(A),false);
 assert.equal(h.calls.back,0);
 assert.equal(h.calls.assigned.length,0);
 assert.equal(h.entries()[0].to,A);
});
test('external and new-tab links are excluded from navigation history',()=>{
 const h=harness(B);
 h.click(base+'/confidentialitate.html?from=checkout',{target:'_blank'});
 h.click('https://www.google.com/');
 assert.equal(h.entries().length,0);
});
test('Back after reload does not blindly travel into unrelated history',()=>{
 const h=harness(C,{referrer:B,stored:[pair(B,C)],type:'reload'});
 h.click(B,{back:true});
 assert.deepEqual(h.calls.assigned,[B]);
 assert.equal(h.calls.back,0);
});
test('all PONT entry points use the shared navigation helper',()=>{
 for(const path of ['index.html','meniul-zilei/index.html','iesire-in-oras/index.html',
   'promovare/index.html','login/index.html','admin-v2/index.html',
   'super-admin/index.html','super-admin/clasament/index.html',
   'informatii-restaurant/index.html','termeni.html','confidentialitate.html',
   'cookies.html','pranz-slobozia/index.html','pranz-slobozia/meniul-zilei/index.html',
   'pranz-slobozia/iesire-in-oras/index.html','pranz-slobozia/promovare/index.html',
   'pranz-slobozia/login/index.html','pranz-slobozia/admin-v2/index.html',
   'pranz-slobozia/super-admin/index.html','pranz-slobozia/informatii-restaurant/index.html']){
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(html,/pont-navigation-history\.js/,path);
 }
});
test('restaurant X closes without stacking phantom history states',()=>{
 for(const path of ['meniul-zilei/index.html','pranz-slobozia/meniul-zilei/index.html']){
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(html,/pontRestaurantRoutePushed/);
  assert.doesNotMatch(html,/searchParams\.delete\('restaurant'\);history\.pushState\(\{\},'',u\)/);
 }
});

test('auction transparency opens in same tab from the correct administrator and retains a safe fallback',()=>{
 for(const prefix of ['', 'pranz-slobozia/']){
  for(const area of ['admin-v2','super-admin']){
   const html=readFileSync(new URL('../'+prefix+area+'/index.html',import.meta.url),'utf8');
   assert.match(html,new RegExp('termeni\\.html\\?from='+area+'#transparenta-licitatii'));
   assert.doesNotMatch(html,/termeni\\.html\\?from=(?:admin-v2|super-admin)#transparenta-licitatii"\\s+target="_blank"/);
   const terms=readFileSync(new URL('../'+prefix+'termeni.html',import.meta.url),'utf8');
   assert.match(terms,/id="pontLegalBack"/);
   assert.match(terms,/'admin-v2':'\\.\\/admin-v2\\/'/);
   assert.match(terms,/'super-admin':'\\.\\/super-admin\\/'/);
  }
 }
});
