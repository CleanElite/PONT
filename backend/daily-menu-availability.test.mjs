import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
for(const root of ['','pranz-slobozia/']){
 test(root+'public card lists all enabled restaurants in promotion order',()=>{
  const html=read(root+'meniul-zilei/index.html');
  assert.match(html,/restaurants\?select=id,name,enabled,phone,accepts_card,menu_price,offers_delivery&enabled=eq.true/);
  assert.match(html,/sort\(\(a,b\)=>\(a\.promotionRank\?\?Infinity\)-\(b\.promotionRank\?\?Infinity\)/);
  assert.match(html,/pont_daily_menu_status\?select=restaurant_id,exhausted&service_date=eq\./);
  assert.match(html,/const exhausted=daily\.has\(restaurant\.id\)/);
  assert.match(html,/available:Boolean\(m\)&&!exhausted/);
 });
 test(root+'unpublished and exhausted cards never open restaurant or checkout',()=>{
  const html=read(root+'meniul-zilei/index.html');
  assert.match(html,/isUnavailable\?'disabled aria-disabled="true"'/);
  assert.match(html,/if\(!m\|\|m\.available===false\)return false/);
  assert.match(html,/if\(current&&\$\('#order'\)\.open&&!liveMenus\.some\(m=>m\.id===current\.id&&m\.available\)\)/);
  assert.match(html,/Restaurantul va posta în curând meniul zilei/);
  assert.match(html,/Meniul zilei epuizat/);
  assert.match(html,/function orderOpen\(menu\)\{return Boolean\(menu&&menu\.available!==false\)\}/);
  assert.doesNotMatch(html,/Programul comenzilor este închis/);
 });
 test(root+'restaurant-admin can toggle today only',()=>{
  const html=read(root+'admin-v2/index.html');
  assert.match(html,/id="toggleDailyExhausted"/);
  assert.match(html,/pont_set_daily_menu_exhausted/);
  assert.match(html,/pont_daily_menu_status/);
  assert.match(html,/timeZone:'Europe\/Bucharest'/);
  assert.match(html,/Reactivează meniul zilei/);
 });
 test(root+'super-admin can toggle availability separately for each restaurant',()=>{
  const html=read(root+'super-admin/index.html');
  assert.match(html,/data-exhausted-restaurant/);
  assert.match(html,/pont_set_daily_menu_exhausted/);
  assert.match(html,/dailyMenuExhaustedIds/);
 });
 test(root+'ordering hours are not shown in settings',()=>{
  const js=read(root+'order-operations.js');
  assert.match(js,/settings\.style\.display='none'/);
  assert.match(js,/return \{min_full_menus:min\}/);
  assert.doesNotMatch(js,/Programul și comanda minimă au fost salvate/);
 });
}
