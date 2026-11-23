(() => {
 const desktop = matchMedia('(min-width:1200px)');
 const $ = id => document.getElementById(id);
 const city = document.body.classList.contains('pont-admin--city');
 const topbar = document.querySelector(city ? '.pont-ar-city-topbar' : '.pont-restaurant-topbar');
 const identity = document.querySelector(city ? '.pont-ar-city-heading' : '.pont-restaurant-premium-heading');
 const modules = document.querySelector('.pont-ar-module-switch');
 if (!topbar || !identity || !modules) return;
 const slots = [identity, modules].map(node => {
   const slot = document.createComment('restaurant header position');
   node.before(slot);
   return {node, slot};
 });
 function header() {
   for (const {node, slot} of slots) {
     if (desktop.matches) topbar.insertBefore(node, city ? $('pontAuctionBellMount') : topbar.lastElementChild);
     else slot.after(node);
   }
 }
 header();
 desktop.addEventListener('change', header);
 if (city) {
   const nav=document.querySelector('.pont-ar-city-navigation'), shell=el('div',null,'pont-ar-city-shell'), content=el('div',null,'pont-ar-city-content');
   function cityLayout(){
     if(desktop.matches && !shell.isConnected){
       nav.before(shell);shell.append(nav,content);
       while(shell.nextElementSibling)content.append(shell.nextElementSibling);
     }else if(!desktop.matches && shell.isConnected){
       shell.replaceWith(nav,...content.children);
     }
   }
   cityLayout();desktop.addEventListener('change',cityLayout);
   return;
 }

 const planner = $('deskPlanner'), app = $('app'), editor = $('menuFormWrap');
 const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());
 const dayDate = value => new Date(value+'T12:00:00Z');
 const shift = (value,n) => {
   const d=dayDate(value); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10);
 };
 const label = (date, options) => new Intl.DateTimeFormat('ro-RO',{timeZone:'UTC',...options}).format(dayDate(date));
 let selected=today(), start=shift(selected,-((dayDate(selected).getUTCDay()+6)%7));
 let mode='plan';
 let inlineEditor=false, opening=false;
 const restaurant = () => $('pontOpWeekRestaurant')?.value || $('contactRestaurant')?.value;
 const forDay = d => (window.pontAllMenus?.() || []).find(m=>m.restaurant_id===restaurant() && m.service_date===d);
 function el(tag, value, cls) {
   const n=document.createElement(tag); if(value!=null)n.textContent=value; if(cls)n.className=cls; return n;
 }
 function draw() {
   if (!desktop.matches || app.hidden) return;
   const editing=!editor.hidden;
   const inline=inlineEditor && editing;
   const showing=mode==='plan' && (!editing || inline) && !$('addView').hidden;
   planner.hidden=!showing;
   app.dataset.deskMode=editing && !$('addView').hidden ? (inline ? 'inline' : 'editor') : mode;
   $('deskPublish').setAttribute('aria-pressed',String(app.dataset.deskMode==='editor'));
   if (!showing) return;
   const source=$('pontOpWeekRestaurant'), choose=$('deskRestaurant');
   if(source){
     choose.replaceChildren(...Array.from(source.options,o=>new Option(o.text,o.value)));
     choose.value=source.value;choose.hidden=choose.options.length<2;
   }
   const locked=inline || opening;
   for(const control of [choose,$('deskPrev'),$('deskNext')]) control.disabled=locked;
   const end=shift(start,6),menu=forDay(selected);
   $('deskRange').textContent=label(start,{day:'numeric',month:'short'})+' – '+label(end,{day:'numeric',month:'short',year:'numeric'});
   const items=[];
   for (let i=0;i<7;i++){
     const date=shift(start,i), planned=!!forDay(date), b=el('button');
     b.type='button'; b.disabled=locked; b.dataset.day=date;b.setAttribute('aria-pressed',String(date===selected));
     b.setAttribute('aria-label',label(date,{weekday:'long',day:'numeric',month:'long'})+(planned?', cu meniu':', fără meniu'));
     b.append(el('strong',['Lun','Mar','Mie','Joi','Vin','Sâm','Dum'][i]),el('small',label(date,{day:'numeric',month:'short'})),el('span',planned?'✓':'○',planned?'planned':'empty'));items.push(b);
   }
   $('deskDays').replaceChildren(...items);
   $('deskDayTitle').textContent='Meniul pentru '+label(selected,{weekday:'long',day:'numeric',month:'long'});
   $('deskState').textContent=menu?(menu.published?'✓ Publicat':'Nepublicat'):'Fără meniu';
   $('deskEdit').hidden=selected<today() || inline;
   $('deskEdit').disabled=opening;
   $('deskEdit').textContent=menu?.published?'Editează meniul':'Publică meniu';
   $('deskEdit').setAttribute('aria-label',$('deskEdit').textContent+' pentru '+label(selected,{day:'numeric',month:'long'}));
   $('deskDelete').hidden=!menu || !document.querySelector('#menus [data-remove="'+CSS.escape(String(menu.id))+'"]');
   $('deskModel').disabled=!menu || locked;
   $('deskAvailability').hidden=selected!==today() || !menu;
   const courses=[];
   for(const [key,title,legacy] of [['first','Felul 1','first_course'],['second','Felul 2','second_course'],['dessert','Desert','dessert']]){
     const entries=(Array.isArray(menu?.dish_selection)?menu.dish_selection:[]).filter(d=>d?.category===key && d.name);
     if(!entries.length && menu?.[legacy])entries.push({name:menu[legacy]});
     const box=el('section',null,'desk-course'), list=el('ol');
     box.append(el('h3',title+' ('+entries.length+')'));
     for(const [index,dish] of entries.entries()){
       const row=el('li');row.append(el('small',String(index+1)));
       if(dish.photo_url && /^https:\/\//i.test(dish.photo_url)){const img=el('img');img.alt='';img.src=dish.photo_url;img.loading='lazy';img.onerror=()=>img.remove();row.append(img)}
       row.append(el('span',dish.name));list.append(row);
     }
     if(entries.length)box.append(list);else box.append(el('p','Niciun preparat.'));
     courses.push(box);
   }
   $('deskCourses').replaceChildren(...courses);
 }
 async function edit(kind) {
   const menu=forDay(selected);
   if(kind==='model' && !menu)return;
   if(opening || !restaurant() || !window.pontDishUI)return;
   $('showAdd').click();mode='plan';inlineEditor=true;opening=true;draw();
   try{
     const opened=await window.pontDishUI.open(kind==='new'?null:menu,false,{restaurant:restaurant(),date:kind==='new' && selected<today()?today():selected});
     if(opened && kind==='model')$('pontDailySaveModel')?.click();
   }catch(e){$('status').textContent=e.message}
   finally{opening=false;if(editor.hidden)inlineEditor=false;draw()}
 }
 $('deskRestaurant').onchange=()=>{const source=$('pontOpWeekRestaurant');if(source){source.value=$('deskRestaurant').value;source.dispatchEvent(new Event('change',{bubbles:true}))}};
 $('deskDays').onclick=e=>{const b=e.target.closest('[data-day]');if(b){selected=b.dataset.day;draw();$('deskDays').querySelector('[aria-pressed="true"]').focus({preventScroll:true})}};
 for(const [id,offset] of [['deskPrev',-7],['deskNext',7]])$(id).onclick=()=>{start=shift(start,offset);selected=shift(selected,offset);draw()};
 $('deskEdit').onclick=()=>edit(forDay(selected)?'edit':'new');$('deskModel').onclick=()=>edit('model');
 $('deskPublish').onclick=()=>{if(editor.hidden)edit(forDay(selected)?'edit':'new');else $('showAdd').click()};
 $('deskAvailability').onclick=()=>{mode='availability';draw()};
 $('deskReturn').onclick=()=>{if(!editor.hidden)$('toggleMenuForm').click();mode='plan';draw()};
 $('deskDelete').onclick=()=>{const m=forDay(selected);if(m)document.querySelector('#menus [data-remove="'+CSS.escape(String(m.id))+'"]')?.click()};
 document.querySelector('.admin-nav').addEventListener('click',e=>{
   if(!desktop.matches)return;
   const tab=e.target.closest('[data-view]');if(!tab)return;
   mode='plan';if(tab.id==='showAdd' && !editor.hidden)$('toggleMenuForm').click();draw();
 });
 const promo=document.querySelector('.admin-nav a[href*="promovare"]');
 promo?.addEventListener('click',e=>{
   if(!desktop.matches || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
   e.preventDefault();mode='promotion';if(!$('deskPromoFrame').hasAttribute('src')){const target=new URL(promo.href);target.searchParams.set('layout','restaurant-desktop');$('deskPromoFrame').src=target.href};
   app.dataset.deskMode=mode;planner.hidden=true;
 });
 new MutationObserver(()=>{if(editor.hidden && !opening)inlineEditor=false;if(mode!=='promotion')draw()}).observe(editor,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(draw).observe($('menus'),{childList:true});
 new MutationObserver(draw).observe(app,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('change',e=>{if(['pontOpWeekRestaurant','contactRestaurant'].includes(e.target.id))draw()});
 desktop.addEventListener('change',()=>{mode='plan';if(!desktop.matches){planner.hidden=true;delete app.dataset.deskMode}draw()});
 window.addEventListener('hashchange',()=>{mode='plan';draw()});
 window.addEventListener('pont-desktop-menu-ready',draw);
 draw();
})();
