(()=>{'use strict';
const n=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const has=(x,q)=>n(x).includes(n(q));
const style=document.createElement('style');style.textContent=[
'.pont-week-date-hidden{display:none!important}',
'.pont-week-nav-compact{display:flex!important;flex-flow:row nowrap!important;align-items:stretch!important;gap:8px!important;justify-content:space-between!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:12px 0!important}',
'.pont-week-nav-compact>button,.pont-week-nav-compact>[role="button"]{box-sizing:border-box!important;display:inline-flex!important;flex:1 1 0!important;width:0!important;min-width:0!important;max-width:calc(50% - 4px)!important;justify-content:center!important;align-items:center!important;gap:5px!important;white-space:nowrap!important;margin:0!important;padding:9px 4px!important;font-size:clamp(10px,2.7vw,13px)!important;letter-spacing:-.03em!important;line-height:1.2!important;border-radius:12px!important}',
'.pont-week-nav-compact .pont-week-arrow{flex:0 0 auto;width:11px!important;height:11px!important;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}',
'@media(max-width:365px){.pont-week-nav-compact{gap:5px!important}.pont-week-nav-compact>button{font-size:10px!important;gap:3px!important;padding-inline:2px!important}.pont-week-nav-compact .pont-week-arrow{width:9px!important;height:9px!important}}'
].join('\n');document.head.append(style);
const hide=x=>x&&x.classList.add('pont-week-date-hidden');
const arrow=dir=>'<svg class="pont-week-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="'+(dir==='left'?'M10 3 5 8l5 5':'M6 3l5 5-5 5')+'"/></svg>';
function update(){
 const headers=[...document.querySelectorAll('summary,h2,h3,h4,button')].filter(x=>has(x.textContent,'Planifică meniul pe toată săptămâna')&&n(x.textContent).length<60);
 for(const header of headers){
  const panel=header.closest('details')||header.closest('section')||header.parentElement;if(!panel)continue;
  // The premium planner owns its two-button grid; do not relocate or duplicate arrows.
  if(panel.id==='pontWeekPanel')continue;
  const buttons=[...panel.querySelectorAll('button,[role="button"]')];
  const prev=buttons.find(x=>has(x.textContent,'Săptămâna anterioară'));
  const next=buttons.find(x=>has(x.textContent,'Săptămâna următoare'));
  if(!prev||!next||prev===next)continue;
  for(const label of panel.querySelectorAll('label'))if(has(label.textContent,'Săptămâna care începe'))hide(label);
  for(const input of panel.querySelectorAll('input[type=date]')){
   if(input.compareDocumentPosition(prev)&Node.DOCUMENT_POSITION_FOLLOWING){
    const label=input.closest('label');
    if(label&&has(label.textContent,'Săptămâna care începe'))hide(label);else hide(input);
   }
  }
  for(const el of panel.querySelectorAll('span,p,div'))if(!el.children.length&&n(el.textContent)===n('Săptămâna care începe'))hide(el);
  if(!prev.classList.contains('pont-week-arrow-added')){prev.insertAdjacentHTML('afterbegin',arrow('left'));prev.classList.add('pont-week-arrow-added')}
  if(!next.classList.contains('pont-week-arrow-added')){next.insertAdjacentHTML('beforeend',arrow('right'));next.classList.add('pont-week-arrow-added')}
  let bar=panel.querySelector('.pont-week-nav-compact');
  if(!bar){bar=document.createElement('div');bar.className='pont-week-nav-compact';prev.parentNode.insertBefore(bar,prev)}
  if(prev.parentElement!==bar)bar.append(prev);
  if(next.parentElement!==bar)bar.append(next);
 }
}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{try{update()}finally{queued=false}})});
const init=()=>{update();observer.observe(document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();