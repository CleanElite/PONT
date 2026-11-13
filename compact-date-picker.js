/* PONT compact native-compatible date and month picker. */
(()=>{
'use strict';
const months=['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];
const pad=n=>String(n).padStart(2,'0');
const style=document.createElement('style');style.textContent="\n.pont-date-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;clip-path:inset(50%)!important;pointer-events:none!important;padding:0!important;margin:0!important}\n.pont-date-inline{display:inline-flex;align-items:center;gap:4px;margin:3px 0;max-width:100%;vertical-align:middle}\n.pont-date-part{display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;flex:none!important;min-width:0!important;min-height:30px!important;height:30px!important;padding:4px 8px!important;margin:0!important;border:1px solid #57847d!important;border-radius:7px!important;background:#123941!important;color:#effaf5!important;white-space:nowrap;font:700 12px system-ui,sans-serif!important;box-shadow:none!important}\n.pont-date-dialog:not([open]){display:none!important}\n.pont-date-dialog[open]{display:flex;flex-direction:column;position:fixed;inset:0;box-sizing:border-box;width:min(325px,calc(100vw - 30px));max-width:calc(100vw - 30px);max-height:min(440px,80dvh);margin:auto;padding:0;border:1px solid #68968f;border-radius:17px;background:#0c2b34;color:#eff9f5;box-shadow:0 24px 80px #000a;overflow:hidden}\n.pont-date-dialog::backdrop{background:#020f15be;backdrop-filter:blur(4px)}\n.pont-date-head{padding:14px;border-bottom:1px solid #426c69;font:750 16px system-ui}\n.pont-date-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:12px;overflow:auto;min-height:0;overscroll-behavior:contain}\n.pont-date-dialog[data-part=\"day\"] .pont-date-options{grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}\n.pont-date-dialog[data-part=\"year\"] .pont-date-options{grid-template-columns:repeat(3,minmax(0,1fr))}\n.pont-date-option{display:grid;place-items:center;min-width:0;min-height:36px;margin:0;padding:5px 2px;border:1px solid #507571;border-radius:8px;background:#153a42;color:#f2f8f5;font:650 12px system-ui}\n.pont-date-option[aria-pressed=\"true\"]{background:#9bead8;border-color:#9bead8;color:#083231}\n.pont-date-footer{display:flex;gap:7px;padding:11px 12px;border-top:1px solid #426c69}\n.pont-date-footer button{flex:1;min-width:0;min-height:38px;margin:0;padding:8px;border-radius:9px;border:1px solid #4f7773;background:#194049;color:#edf8f5;font:700 12px system-ui}\n.pont-date-footer .pont-date-confirm{background:#9bead8;border-color:#9bead8;color:#083231}\n";document.head.append(style);
const dialog=document.createElement('dialog');dialog.className='pont-date-dialog';dialog.setAttribute('aria-label','Selectează data');
dialog.innerHTML='<div class="pont-date-head"></div><div class="pont-date-options"></div><div class="pont-date-footer"><button type="button" data-cancel>Anulează</button><button type="button" data-confirm class="pont-date-confirm">Confirmă</button></div>';
document.body.append(dialog);
const grid=dialog.querySelector('.pont-date-options'),head=dialog.querySelector('.pont-date-head');
const fields=new Map();let active=null,scrollY=null,oldBody=null;
function today(){const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).split('-').map(Number);return {year:p[0],month:p[1],day:p[2]};}
function get(input){const a=input.value.split('-').map(Number),t=today();return {year:a[0]||t.year,month:a[1]||t.month,day:input.type==='month'?1:a[2]||t.day};}
function refresh(input){const item=fields.get(input);if(!item)return;const a=input.value.split('-').map(Number);
item.buttons.forEach(b=>{const k=b.dataset.part;const label=String(k==='year'?(a[0]||'An'):k==='month'?(a[1]&&a[1]<=12?months[a[1]-1]:'Lună'):(a[2]&&a[2]<=31?pad(a[2]):'Zi'));if(b.textContent!==label)b.textContent=label;});}
function install(input){if(fields.has(input))return;
const group=document.createElement('span');group.className='pont-date-inline';
const buttons=(input.type==='month'?['month','year']:['day','month','year']).map(k=>{const b=document.createElement('button');b.type='button';b.className='pont-date-part';b.dataset.part=k;
b.setAttribute('aria-label','Selectează '+(k==='day'?'ziua':k==='month'?'luna':'anul'));
b.onclick=e=>{e.preventDefault();e.stopPropagation();open(input,k);};group.append(b);return b;});
input.after(group);input.classList.add('pont-date-native');input.tabIndex=-1;fields.set(input,{group,buttons});
input.addEventListener('change',()=>refresh(input));input.addEventListener('input',()=>refresh(input));refresh(input);
}
function scan(){document.querySelectorAll('input[type="date"],input[type="month"]').forEach(install);for(const input of fields.keys()){if(input.isConnected)refresh(input);else fields.delete(input);}}
function lock(){if(scrollY!==null)return;scrollY=window.scrollY;const b=document.body;oldBody={position:b.style.position,top:b.style.top,left:b.style.left,right:b.style.right,width:b.style.width,overflow:b.style.overflow};
Object.assign(b.style,{position:'fixed',top:'-'+scrollY+'px',left:'0',right:'0',width:'100%',overflow:'hidden'});}
function unlock(){if(scrollY===null)return;const y=scrollY;scrollY=null;Object.assign(document.body.style,oldBody);oldBody=null;window.scrollTo(0,y);}
function open(input,part){scan();const v=get(input);v.day=Math.min(v.day,new Date(v.year,v.month,0).getDate());const now=today().year;
const nums=part==='day'?Array.from({length:new Date(v.year,v.month,0).getDate()},(_,i)=>i+1):part==='month'?Array.from({length:12},(_,i)=>i+1):Array.from({length:Math.max(now+7,v.year+2)-Math.min(now-8,v.year-2)+1},(_,i)=>Math.min(now-8,v.year-2)+i);
active={input,part,value:v,chosen:v[part],button:fields.get(input).buttons.find(b=>b.dataset.part===part)};
dialog.dataset.part=part;head.textContent=part==='day'?'Alege ziua':part==='month'?'Alege luna':'Alege anul';
grid.replaceChildren(...nums.map(n=>{const b=document.createElement('button');b.type='button';b.className='pont-date-option';b.textContent=part==='month'?months[n-1]:part==='day'?pad(n):String(n);b.dataset.value=String(n);b.setAttribute('aria-pressed',String(n===active.chosen));
b.onclick=()=>{active.chosen=n;grid.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.value)===n)));};return b;}));
dialog.showModal();lock();grid.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest'});}
function close(save){if(!active)return;const a=active;active=null;if(save){a.value[a.part]=a.chosen;a.value.day=Math.min(a.value.day,new Date(a.value.year,a.value.month,0).getDate());
const value=String(a.value.year).padStart(4,'0')+'-'+pad(a.value.month)+(a.input.type==='date'?'-'+pad(a.value.day):'');
if(a.input.value!==value){a.input.value=value;a.input.dispatchEvent(new Event('input',{bubbles:true}));a.input.dispatchEvent(new Event('change',{bubbles:true}));}refresh(a.input);}
dialog.close();unlock();a.button?.focus({preventScroll:true});}
dialog.querySelector('[data-confirm]').onclick=()=>close(true);dialog.querySelector('[data-cancel]').onclick=()=>close(false);
dialog.addEventListener('cancel',e=>{e.preventDefault();close(false);});dialog.addEventListener('click',e=>{if(e.target===dialog)close(false);});
const obs=new MutationObserver(scan);obs.observe(document.body,{childList:true,subtree:true});scan();
window.addEventListener('focus',scan);document.addEventListener('visibilitychange',()=>{if(!document.hidden)scan();});
setInterval(()=>{if(!document.hidden)scan();},1200);
})();