// PONT: restaurant-order settings and dedicated weekly menu planner.
export function initPontOperations({db,getRestaurants,isRestaurantAdmin=false}){
 const $=id=>document.getElementById(id);
 const wrap=$('menuFormWrap'), parent=wrap?.parentElement;
 if(!parent)return {refresh:()=>{}};
 const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const settingsHost=isRestaurantAdmin ? $('contactView') : null;
 const section=document.createElement('section');
 section.id='pontOperations';
 section.className='pont-operations';
 section.innerHTML=`<style>
 .pont-operations{margin:17px 0;display:grid;gap:12px}
 .pont-operations details{border:1px solid #35616c;background:#0b2530;border-radius:17px;padding:15px;color:#f2f8f9}
 .pont-operations summary{cursor:pointer;font-size:1.02rem;font-weight:700;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:10px}
 .pont-operations summary::after{content:'⌄';font-size:1.35rem;color:#89e8e2}
 .pont-operations details[open] summary{margin-bottom:16px}
 .pont-operations p{color:#c1d1d5;font-size:.85rem;line-height:1.55}
 .pont-operations label{display:grid;gap:6px;color:#e7f7f6;font-size:.84rem}
 .pont-operations input,.pont-operations select{box-sizing:border-box;width:100%;min-height:43px;padding:9px 11px;background:#09202a;border:1px solid #47717b;border-radius:10px;color:white;font:inherit}
 .pont-operations .pont-op-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
 .pont-operations .pont-op-button{border:1px solid #76c3c2;background:#15515a;color:#fff;padding:10px 14px;border-radius:11px;font:inherit;cursor:pointer;min-height:42px}
 .pont-operations .pont-op-days{display:grid;gap:7px}
 .pont-operations .pont-op-day{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid #2f5260;border-radius:11px}
 .pont-operations .pont-op-day strong{display:block;font-size:.88rem}
 .pont-operations .pont-op-day small{display:block;color:#b8c9ce;margin-top:3px}
 .pont-operations [role=status]{min-height:1.3em}
 @media(max-width:500px){.pont-operations .pont-op-grid{grid-template-columns:1fr}.pont-operations .pont-op-day{flex-wrap:wrap}}
 #pontRestaurantSettings { margin: 18px 0 0; }
 #pontRestaurantSettings details { padding: clamp(14px, 2.5vw, 22px); border-color: var(--admin-line); background: var(--admin-field); }
 #pontRestaurantSettings summary { min-height: 28px; font: 600 clamp(18px, 3.2vw, 23px)/1.2 Georgia, serif; }
 #pontRestaurantSettings summary::-webkit-details-marker { display: none; }
 #pontRestaurantSettings details[open] summary::after { transform: rotate(180deg); }
 #pontRestaurantSettings .pont-op-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
 #pontRestaurantSettings .pont-op-grid label { min-width: 0; }
 #pontRestaurantSettings .pont-op-grid label:last-child { grid-column: 1 / -1; }
 #pontRestaurantSettings input { background: var(--admin-surface); }
 #pontRestaurantSettings #pontOpStatus { margin-bottom: 0; }
 #pontRestaurantSettings #pontOpStatus:empty { min-height: 0; margin: 0; }
 </style>
 <details id="pontHoursPanel"><summary>Programul comenzilor și comanda minimă</summary>
 <label id="pontOpRestaurantWrap">Restaurant<select id="pontOpRestaurant"></select></label>
 <p>Alege intervalul în care primești comenzi. Programul implicit este 09:00–15:00. Îl poți modifica oricând.</p>
 <div class="pont-op-grid"><label>Comenzi de la ora<input id="pontOpStart" type="time"></label><label>Comenzi până la ora<input id="pontOpEnd" type="time"></label><label>Minim meniuri complete<input id="pontOpMin" type="number" min="1" max="20" step="1" value="1" required></label></div>
 <button type="button" id="pontOpSave" class="${settingsHost ? 'primary' : 'pont-op-button'}">${settingsHost ? 'Salvează setările comenzilor' : 'Salvează programul'}</button><p id="pontOpStatus" role="status"></p></details>
 <details id="pontWeekPanel"><summary>Planifică meniul pe toată săptămâna</summary>
 <p>Pregătești fiecare zi separat, pentru următoarea săptămână. Un meniu publicat cu dată viitoare apare automat în ziua aleasă și poate fi modificat oricând.</p>
 ${settingsHost ? '<label id="pontOpWeekRestaurantWrap" hidden>Restaurant<select id="pontOpWeekRestaurant"></select></label>' : ''}
 <div class="pont-op-grid"><label>Săptămâna care începe<input id="pontOpWeek" type="date"></label></div>
 <div id="pontOpDays" class="pont-op-days"></div><p id="pontOpWeekStatus" role="status"></p></details>`;
 parent.append(section);
 if(settingsHost){
   const settings=document.createElement('div');
   settings.id='pontRestaurantSettings';
   settings.className='pont-operations';
   settings.append($('pontHoursPanel'));
   settingsHost.append(settings);
 }
 const formatDate=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const monday=()=>{const local=formatDate(new Date());const d=new Date(local+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d};
 const dateAt=(start,days)=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
 $('pontOpWeek').value=monday().toISOString().slice(0,10);
 const restaurants=()=>getRestaurants()||[];
 const defaultStart='09:00', defaultEnd='15:00';
 let activeRestaurant='';
 function options(){
   const rs=restaurants(),selector=$('pontOpRestaurant');
   const previous=activeRestaurant;
   selector.innerHTML=rs.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join('');
   if(rs.some(r=>r.id===previous))selector.value=previous;
   activeRestaurant=selector.value||'';
   $('pontOpRestaurantWrap').hidden=rs.length<=1;
   const weekSelector=$('pontOpWeekRestaurant');
   if(weekSelector){
     weekSelector.innerHTML=selector.innerHTML;
     weekSelector.value=activeRestaurant;
     $('pontOpWeekRestaurantWrap').hidden=rs.length<=1;
   }
 }
 async function loadSettings(){
   options();if(!activeRestaurant)return;
   const restaurantId=activeRestaurant;
   const {data,error}=await db.from('pont_order_settings').select('opens_at,closes_at,min_full_menus').eq('restaurant_id',restaurantId).maybeSingle();
   if(restaurantId!==activeRestaurant)return;
   if(error){$('pontOpStatus').textContent=error.message;return}
   $('pontOpStart').value=data?.opens_at?.slice(0,5)||defaultStart;
   $('pontOpEnd').value=data?.closes_at?.slice(0,5)||defaultEnd;
   $('pontOpMin').value=data?.min_full_menus||1;
 }
 for(const selector of [$('pontOpRestaurant'), $('pontOpWeekRestaurant')].filter(Boolean)){
   selector.addEventListener('change',()=>{activeRestaurant=selector.value;loadSettings();renderWeek()});
 }
 $('pontOpSave').addEventListener('click',async()=>{
   const start=$('pontOpStart').value,end=$('pontOpEnd').value,min=Number($('pontOpMin').value);
   if(Boolean(start)!==Boolean(end)){ $('pontOpStatus').textContent='Completează ambele ore sau lasă-le goale pentru programul implicit.';return}
   if(start&&start===end){$('pontOpStatus').textContent='Ora de început și ora de încheiere nu pot fi egale.';return}
   if(!Number.isInteger(min)||min<1||min>20){$('pontOpStatus').textContent='Minimum permis: între 1 și 20 meniuri complete.';return}
   const restaurantId=activeRestaurant,button=$('pontOpSave');button.disabled=true;
   try{const {error}=await db.from('pont_order_settings').upsert({restaurant_id:restaurantId,opens_at:start||defaultStart,closes_at:end||defaultEnd,min_full_menus:min,updated_at:new Date().toISOString()},{onConflict:'restaurant_id'});if(error)throw error;
     if(restaurantId===activeRestaurant&&!start&&!$('pontOpStart').value&&!$('pontOpEnd').value){
       $('pontOpStart').value=defaultStart;
       $('pontOpEnd').value=defaultEnd;
     }
     $('pontOpStatus').textContent='Programul și comanda minimă au fost salvate.'}
   catch(e){$('pontOpStatus').textContent=e.message}finally{button.disabled=false}
 });
 function renderWeek(){
   const start=$('pontOpWeek').value||monday().toISOString().slice(0,10);
   const menus=typeof window.pontAllMenus==='function'?window.pontAllMenus():[];
   const days=['Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă','Duminică'];
   $('pontOpDays').innerHTML=days.map((name,i)=>{
     const date=dateAt(start,i),menu=menus.find(m=>m.restaurant_id===activeRestaurant&&m.service_date===date);
     const label=menu?(menu.published?'Programat / publicat':'Ciornă'):'Fără meniu';
     return '<div class="pont-op-day"><div><strong>'+name+' · '+date.split('-').reverse().join('.')+'</strong><small>'+label+'</small></div><button type="button" class="pont-op-button" data-week-date="'+date+'">'+(menu?'Editează meniul':'Creează meniul')+'</button></div>';
   }).join('');
 }
 $('pontOpWeek').addEventListener('change',renderWeek);
 $('pontOpDays').addEventListener('click',async event=>{
   const button=event.target.closest('[data-week-date]');if(!button)return;
   const date=button.dataset.weekDate,menu=(window.pontAllMenus?.()||[]).find(m=>m.restaurant_id===activeRestaurant&&m.service_date===date);
   try{
     const addTab=document.querySelector('.admin-nav button[data-view="add"]');
     if(addTab)addTab.click();
     const host=$('toggleMenuForm');
     if(wrap.hidden)host?.click();
     await window.pontDishUI.activate(menu||null);
     $('pontDailyRestaurant').value=activeRestaurant;
     $('pontDishRestaurant').value=activeRestaurant;
     if(!menu)$('pontDailyRestaurant').dispatchEvent(new Event('change'));
     $('pontDailyDate').value=date;
     wrap.hidden=false;host?.setAttribute('aria-expanded','true');
     wrap.scrollIntoView({behavior:'smooth',block:'start'});
     $('pontOpWeekStatus').textContent='Completează și publică meniul pentru '+date+'. Va apărea automat în ziua respectivă.';
   }catch(e){$('pontOpWeekStatus').textContent=e.message}
 });
 return {refresh:async()=>{await loadSettings();renderWeek()}};
}
