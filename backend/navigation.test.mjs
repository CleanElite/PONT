import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../pont-navigation-history.js',import.meta.url),'utf8');
const base='https://pont.city';
function harness(href,{referrer='',historyLength=3,stored=null,type='navigate'}={}){
 const store=new Map(stored?[[ 'pont_previous_page_v1',JSON.stringify(stored)]]:[]);
 const calls={back:0,assigned:[],events:{}};
 const locationUrl=new URL(href);
 const location={href:locationUrl.href,origin:locationUrl.origin,pathname:locationUrl.pathname,
   assign(url){calls.assigned.push(url)}};
 const history={length:historyLength,back(){calls.back++}};
 const document={referrer,addEventListener(event,fn){calls.events[event]=fn}};
 const context={window:null,document,history,location,Date,URL,
   sessionStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
   performance:{getEntriesByType:()=>[{type}]}};
 context.window=context;
 runInNewContext(code,context,{filename:'pont-navigation-history.js'});
 function click(href,{back=false,target='_self',modified=false}={}){
   const link={href, target,hasAttribute:name=>back&&name==='data-pont-back'};
   let prevented=false;
   calls.events.click({target:{closest:()=>link},defaultPrevented:false,button:0,
     ctrlKey:modified,metaKey:false,shiftKey:false,altKey:false,
     preventDefault(){prevented=true}});
   return prevented;
 }
 return {calls,store,click,nav:context.PontNavigation};
}
test('contextual Back uses browser history to restore prior restaurant view',()=>{
 const prev=base+'/meniul-zilei/?restaurant=412eaf72-cbba-4151-b826-905612345678';
 const current=base+'/informatii-restaurant/?restaurant=412eaf72-cbba-4151-b826-905612345678';
 const tracking={from:prev,to:current,time:Date.now()};
 const h=harness(current,{referrer:prev,stored:tracking});
 assert.equal(h.click(base+'/meniul-zilei/',{back:true}),true);
 assert.equal(h.calls.back,1);
 assert.equal(h.calls.assigned.length,0);
});
test('contextual Back restores exact query and fragment even without Referer',()=>{
 const prev=base+'/super-admin/?month=2026-12#auctions';
 const current=base+'/promovare/?v=example';
 const h=harness(current,{stored:{from:prev,to:current,time:Date.now()}});
 h.click(base+'/admin-v2/',{back:true});
 assert.deepEqual(h.calls.assigned,[prev]);
 assert.equal(h.calls.back,0);
});
test('direct link without trusted origin uses its context-specific fallback',()=>{
 const h=harness(base+'/promovare/',{referrer:'https://external.example/'});
 h.click(base+'/admin-v2/',{back:true});
 assert.deepEqual(h.calls.assigned,[base+'/admin-v2/']);
 assert.equal(h.calls.back,0);
});
test('ordinary Home and PONT logo hyperlinks are never intercepted as Back',()=>{
 const h=harness(base+'/admin-v2/');
 assert.equal(h.click(base+'/'),false);
 assert.equal(h.calls.back,0);
 assert.equal(h.calls.assigned.length,0);
 assert.equal(JSON.parse(h.store.get('pont_previous_page_v1')).to,base+'/');
});
test('open-in-new-tab links are not recorded as prior navigation',()=>{
 const h=harness(base+'/meniul-zilei/');
 h.click(base+'/confidentialitate.html?from=checkout',{target:'_blank'});
 assert.equal(h.store.size,0);
});
test('Back from a reloaded document uses verified origin directly',()=>{
 const prev=base+'/meniul-zilei/?restaurant=412eaf72-cbba-4151-b826-905612345678';
 const current=base+'/informatii-restaurant/';
 const h=harness(current,{referrer:prev,stored:{from:prev,to:current,time:Date.now()},type:'reload'});
 h.click(base+'/meniul-zilei/',{back:true});
 assert.deepEqual(h.calls.assigned,[prev]);
 assert.equal(h.calls.back,0);
});
test('all active PONT entry points load the origin-aware navigation helper',()=>{
 for(const path of ['index.html','meniul-zilei/index.html','iesire-in-oras/index.html',
   'promovare/index.html','login/index.html','admin-v2/index.html',
   'super-admin/index.html','super-admin/clasament/index.html',
   'informatii-restaurant/index.html','termeni.html','confidentialitate.html','cookies.html']){
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(html,/pont-navigation-history\.js/,path);
 }
});
test('restaurant Back does not push phantom entries into browser history',()=>{
 for(const path of ['meniul-zilei/index.html','pranz-slobozia/meniul-zilei/index.html']){
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(html,/pontRestaurantRoutePushed/);
  assert.doesNotMatch(html,/searchParams\.delete\('restaurant'\);history\.pushState\(\{\},'',u\)/);
 }
});
