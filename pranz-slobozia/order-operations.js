// PONT: restaurant-order settings and dedicated weekly menu planner.
export function initPontOperations({db,getRestaurants,isRestaurantAdmin=false}){
 const $=id=>document.getElementById(id);
 const wrap=$('menuFormWrap'), parent=wrap?.parentElement;
 if(!parent)return {refresh:()=>{}};
 const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const settingsHost=isRestaurantAdmin ? $('contactView') : $('restaurantOrderSettings');
 const superAdminSettings = !isRestaurantAdmin && Boolean(settingsHost);
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
 .pont-operations .pont-op-week-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;margin:12px 0}
 .pont-operations .pont-op-week-nav .pont-op-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:0;padding:9px 10px;font-size:clamp(.7rem,2.8vw,.9rem);white-space:nowrap}
 .pont-operations .pont-op-week-nav .pont-op-arrow{font-size:.85em;line-height:1;opacity:.85}
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
 #restaurantOrderSettings #pontRestaurantSettings{margin:6px 0 10px}
 #restaurantOrderSettings #pontHoursPanel{padding:10px 12px;border-radius:11px;background:#102c35}
 #restaurantOrderSettings #pontHoursPanel>summary{min-height:0;font:600 14px system-ui;cursor:default;margin:0 0 9px}
 #restaurantOrderSettings #pontHoursPanel>summary::after{display:none}
 .pont-op-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid{display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:7px;margin:0}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label{flex:0 0 auto;width:auto;max-width:100%}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(-n+2){width:106px}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(3){width:116px;margin-left:5px}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input[type="time"]{width:106px;max-width:106px}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label{min-width:0;grid-column:auto;gap:3px;font-size:11px;color:#c6dddd;margin:0}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input{width:100%;min-width:0;min-height:34px;height:34px;padding:5px 6px;border-radius:7px;font-size:12px}
 #restaurantOrderSettings #pontRestaurantSettings #pontOpMin{width:55px;max-width:55px;text-align:center}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-min-row{display:flex;align-items:center;gap:7px;white-space:nowrap}
 #restaurantOrderSettings #pontRestaurantSettings .pont-op-min-row>span{font-size:12px;color:#c6dddd}
 #restaurantOrderSettings #pontOpStatus:not(:empty){margin-top:7px;font-size:12px}
 @media(max-width:460px){#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid{gap:6px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(-n+2){width:94px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input[type="time"]{width:94px;max-width:94px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(3){width:104px;margin-left:0}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input{font-size:11px;padding:4px}}
 </style>
 <details id="pontHoursPanel"><summary>${superAdminSettings ? 'Program comenzi' : 'Programul comenzilor și comanda minimă'}</summary>
 <label id="pontOpRestaurantWrap">Restaurant<select id="pontOpRestaurant"></select></label>
 
 <div class="pont-op-grid"><label><span ${superAdminSettings ? 'class="pont-op-visually-hidden"' : ''}>${superAdminSettings ? 'Ora de început' : 'Comenzi de la ora'}</span><input id="pontOpStart" type="time" aria-label="Ora de început"></label><label><span ${superAdminSettings ? 'class="pont-op-visually-hidden"' : ''}>${superAdminSettings ? 'Ora de încheiere' : 'Comenzi până la ora'}</span><input id="pontOpEnd" type="time" aria-label="Ora de încheiere"></label><label>${superAdminSettings ? 'Comandă minimă · meniuri' : 'Comandă minimă'}<span class="pont-op-min-row"><input id="pontOpMin" type="number" min="1" max="20" step="1" value="1" required><span>meniu</span></span></label></div>
 ${superAdminSettings ? '' : '<button type="button" id="pontOpSave" class="' + (settingsHost ? 'primary' : 'pont-op-button') + '">' + (settingsHost ? 'Salvează setările comenzilor' : 'Salvează programul') + '</button>'}<p id="pontOpStatus" role="status"></p></details>
 <details id="pontWeekPanel"><summary>Planifică meniul pe toată săptămâna</summary>
 <p>Alegi săptămâna și planifici fiecare zi separat. Meniurile programate apar automat la data aleasă.</p>
 <label id="pontOpWeekRestaurantWrap" hidden>Restaurant<select id="pontOpWeekRestaurant"></select></label>
 <div class="pont-op-week-nav">
 <button type="button" class="pont-op-button" id="pontOpWeekPrevious"><span class="pont-op-arrow" aria-hidden="true">←</span>Săptămâna anterioară</button>
 <button type="button" class="pont-op-button" id="pontOpWeekNext">Săptămâna următoare<span class="pont-op-arrow" aria-hidden="true">→</span></button>
 </div>
 <div id="pontOpDays" class="pont-op-days"></div><p id="pontOpWeekStatus" role="status"></p></details>`;
 parent.append(section);
 if(settingsHost){
   const settings=document.createElement('div');
   settings.id='pontRestaurantSettings';
   settings.className='pont-operations';
   settings.append($('pontHoursPanel'));
   settingsHost.append(settings);
   if (superAdminSettings) {
     settingsHost.hidden = true;
     $('pontHoursPanel').open = true;
     $('pontOpRestaurantWrap').hidden = true;
   }
 }
 const formatDate=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const monday=date=>dateAt(date,-(new Date(date+'T12:00:00Z').getUTCDay()+6)%7);
 const dateAt=(start,days)=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
 let renderedDay=formatDate(new Date());
 let weekStart=monday(renderedDay);
 const restaurants=()=>getRestaurants()||[];
 const defaultStart='09:00', defaultEnd='15:00';
 let activeRestaurant='';
 let editRestaurantId = null;
 let settingsLoadPromise=Promise.resolve();
 let settingsLoaded=false;
 function options(){
   const rs=restaurants(),selector=$('pontOpRestaurant');
   const previous=superAdminSettings && editRestaurantId ? editRestaurantId : activeRestaurant;
   selector.innerHTML=rs.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join('');
   if(rs.some(r=>r.id===previous))selector.value=previous;
   activeRestaurant=selector.value||'';
   $('pontOpRestaurantWrap').hidden=superAdminSettings || rs.length<=1;
   const weekSelector=$('pontOpWeekRestaurant');
   if(weekSelector){
     const previousWeekRestaurant=weekSelector.value;
     weekSelector.innerHTML=selector.innerHTML;
     if(rs.some(r=>r.id===previousWeekRestaurant))weekSelector.value=previousWeekRestaurant;
     $('pontOpWeekRestaurantWrap').hidden=rs.length<=1;
   }
 }
 async function loadSettings(){
   options();if(!activeRestaurant || (superAdminSettings && !editRestaurantId))return;
   const restaurantId=activeRestaurant;
   const saveButton=$('pontOpSave');
   if(saveButton)saveButton.disabled=true;
   if(superAdminSettings)settingsLoaded=false;
   $('pontOpStatus').textContent='Se încarcă setările…';
   const {data,error}=await db.from('pont_order_settings').select('opens_at,closes_at,min_full_menus').eq('restaurant_id',restaurantId).maybeSingle();
   if(restaurantId!==activeRestaurant || (superAdminSettings && editRestaurantId!==restaurantId))return;
   if(error){$('pontOpStatus').textContent=error.message;return}
   $('pontOpStart').value=data?.opens_at?.slice(0,5)||defaultStart;
   $('pontOpEnd').value=data?.closes_at?.slice(0,5)||defaultEnd;
   $('pontOpMin').value=data?.min_full_menus||1;
   $('pontOpStatus').textContent='';
   if(saveButton)saveButton.disabled=false;
   if(superAdminSettings)settingsLoaded=true;
 }
 $('pontOpRestaurant').addEventListener('change',event=>{activeRestaurant=event.target.value;loadSettings()});
 $('pontOpWeekRestaurant').addEventListener('change',renderWeek);
 function readOrderSettings(){
   const start=$('pontOpStart').value,end=$('pontOpEnd').value,min=Number($('pontOpMin').value);
   if(Boolean(start)!==Boolean(end))throw Error('Completează ambele ore sau lasă-le goale pentru programul implicit.');
   if(start&&start===end)throw Error('Ora de început și ora de încheiere nu pot fi egale.');
   if(!Number.isInteger(min)||min<1||min>20)throw Error('Comanda minimă trebuie să fie între 1 și 20 de meniuri.');
   return {opens_at:start||defaultStart,closes_at:end||defaultEnd,min_full_menus:min};
 }
 async function saveOrderSettings(restaurantId){
   const values=readOrderSettings();
   const {error}=await db.from('pont_order_settings').upsert({restaurant_id:restaurantId,...values,updated_at:new Date().toISOString()},{onConflict:'restaurant_id'});
   if(error)throw error;
   $('pontOpStatus').textContent='';
 }
 if(!superAdminSettings){
   $('pontOpSave').addEventListener('click',async()=>{
     const button=$('pontOpSave');button.disabled=true;
     try{
       await saveOrderSettings(activeRestaurant);
       $('pontOpStatus').textContent='Programul și comanda minimă au fost salvate.';
     }catch(e){$('pontOpStatus').textContent=e.message}
     finally{button.disabled=false}
   });
 }

 function renderWeek(){
   const today=formatDate(new Date());
   if (weekStart===monday(renderedDay) && today!==renderedDay) weekStart=monday(today);
   renderedDay=today;
   const restaurant=$('pontOpWeekRestaurant').value;
   const menus=typeof window.pontAllMenus==='function'?window.pontAllMenus():[];
   const days=['Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă','Duminică'];
   $('pontOpDays').innerHTML=days.map((name,i)=>{
     const date=dateAt(weekStart,i),menu=menus.find(m=>m.restaurant_id===restaurant&&m.service_date===date);
     const past=date<today;
     const label=!menu?'Fără meniu':past?'Finalizat':date===today?'Publicat':'Programat';
     const action=past?'':'<button type="button" class="pont-op-button" data-week-date="'+date+'">'+(menu?'Editează meniul':'Creează meniul')+'</button>';
     return '<div class="pont-op-day"><div><strong>'+name+' · '+date.split('-').reverse().join('.')+'</strong><small>'+label+'</small></div>'+action+'</div>';
   }).join('');
 }
 function selectWeek(start){
   weekStart=start;
   $('pontOpWeekStatus').textContent='';
   renderWeek();
 }
 $('pontOpWeekPrevious').onclick=()=>selectWeek(dateAt(weekStart,-7));
 $('pontOpWeekNext').onclick=()=>selectWeek(dateAt(weekStart,7));
 function updateDay(){
   if(formatDate(new Date())!==renderedDay)renderWeek();
 }
 setInterval(updateDay,15000);
 document.addEventListener('visibilitychange',updateDay);
 $('pontOpDays').addEventListener('click',async event=>{
   const button=event.target.closest('[data-week-date]');if(!button)return;
   const date=button.dataset.weekDate;
   if(date<formatDate(new Date())){renderWeek();return}
   const restaurant=$('pontOpWeekRestaurant').value;
   if(!restaurant)return;
   const menu=(window.pontAllMenus?.()||[]).find(m=>m.restaurant_id===restaurant&&m.service_date===date);
   button.disabled=true;
   try{
     const addTab=document.querySelector('.admin-nav button[data-view="add"]');
     if(addTab)addTab.click();
     const opened=await window.pontDishUI.open(menu||null,false,{restaurant,date});
     if(!opened)return;
     wrap.scrollIntoView({behavior:'smooth',block:'start'});
     $('pontOpWeekStatus').textContent=menu
       ?'Editezi meniul din '+date.split('-').reverse().join('.')+'.'
       :'Completează meniul pentru '+date.split('-').reverse().join('.')+'.';
   }catch(e){$('pontOpWeekStatus').textContent=e.message}
   finally{button.disabled=false}
 });
 return {
   refresh:async()=>{await loadSettings();renderWeek()},
   refreshWeek:renderWeek,
   editRestaurant:id=>{
     if(!superAdminSettings)return;
     editRestaurantId=id||null;
     settingsHost.hidden=!editRestaurantId;
     $('pontOpStatus').textContent='';
     if(!editRestaurantId){settingsLoaded=false;return}
     activeRestaurant=editRestaurantId;
     settingsLoadPromise=loadSettings().catch(error=>{$('pontOpStatus').textContent=error.message;settingsLoaded=false});
   },
   validateRestaurantSettings:async id=>{
     if(!superAdminSettings)return;
     await settingsLoadPromise;
     if(!settingsLoaded || editRestaurantId!==id)throw Error('Setările comenzilor nu au fost încărcate. Reîncearcă.');
     readOrderSettings();
   },
   saveRestaurantSettings:async id=>{
     if(!superAdminSettings)return;
     await settingsLoadPromise;
     if(!settingsLoaded || editRestaurantId!==id)throw Error('Setările comenzilor nu au fost încărcate. Reîncearcă.');
     await saveOrderSettings(id);
   }
 };
}
