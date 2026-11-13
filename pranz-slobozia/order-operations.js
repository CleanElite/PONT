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
 #contactView #pontRestaurantSettings .pont-op-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-start}
 #contactView #pontRestaurantSettings .pont-op-grid>label{display:grid;flex:0 0 auto;width:max-content;max-width:100%;min-width:0}
 #contactView #pontRestaurantSettings .pont-op-grid input[type="time"]{box-sizing:border-box;display:block;width:108px;max-width:108px;min-width:0;padding:4px 5px;font-size:13px}
 #contactView .pont-min-order-settings label{display:block;width:max-content;max-width:100%}
 #contactView .pont-min-order-settings .pont-op-min-row{display:flex;align-items:center;gap:9px}
 #contactView .pont-min-order-settings #pontOpMin{box-sizing:border-box;width:64px;min-height:36px;text-align:center}
 #contactView .pont-min-order-settings .pont-op-min-row>span{font-size:14px}
 #contactView .pont-min-order-settings #pontOpStatus:empty{display:none}
 #restaurantOrderSettings #pontOpStatus:not(:empty){margin-top:7px;font-size:12px}
 @media(max-width:460px){#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid{gap:6px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(-n+2){width:94px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input[type="time"]{width:94px;max-width:94px}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid label:nth-child(3){width:104px;margin-left:0}#restaurantOrderSettings #pontRestaurantSettings .pont-op-grid input{font-size:11px;padding:4px}}

 /* Restaurant admins: preserve the same compact premium planner but never show a restaurant picker. */
 .pont-operations #pontWeekPanel #pontOpWeekRestaurantWrap[hidden]{display:none!important}
 /* PONT premium weekly planner — visual design matched to approved reference */
 .pont-operations #pontWeekPanel{
   padding:clamp(14px,3.1vw,26px)!important;
   border:1px solid rgba(82,246,225,.45)!important;
   border-radius:clamp(20px,4vw,30px)!important;
   background:radial-gradient(ellipse 55% 22% at 75% 0%,rgba(8,134,122,.22),transparent 85%),linear-gradient(165deg,#041e22 0%,#001c20 55%,#01282a 100%)!important;
   box-shadow:inset 0 1px 13px rgba(92,255,223,.12),0 12px 35px rgba(0,15,18,.26)!important;
   color:#f4faf9!important;
 }
 .pont-operations #pontWeekPanel>summary{
   display:flex!important;align-items:center!important;gap:clamp(9px,2vw,17px)!important;
   font:750 clamp(16px,3.65vw,26px)/1.2 system-ui,-apple-system,sans-serif!important;
   letter-spacing:-.025em!important;
   border-bottom:1px solid rgba(113,223,211,.15);
   padding-bottom:13px!important;
   margin-bottom:0!important;
   min-width:0;
 }
 .pont-operations #pontWeekPanel>summary::after{
   content:"⌄"!important;
   flex:none;margin-left:auto;
   color:#9cf9eb!important;font:500 clamp(23px,4vw,30px)/1 system-ui!important;
   transition:transform .2s;
 }
 .pont-operations #pontWeekPanel[open]>summary::after{transform:rotate(180deg)}
 .pont-operations #pontWeekPanel[open]>summary{margin-bottom:14px!important}
 .pont-operations .pont-week-header-icon{
   display:grid;place-items:center;flex:0 0 clamp(35px,6.2vw,52px);
   height:clamp(35px,6.2vw,52px);border-radius:50%;
   border:1px solid #6de8dd82;background:radial-gradient(circle at 40% 20%,#286e71,#06363b 75%);
   box-shadow:inset 0 2px 8px #b7fffb28,0 0 14px #2ae5d826;
   color:#a8fcf2;font-size:clamp(20px,3vw,27px);font-weight:400;
 }
 .pont-operations .pont-week-header-text{display:block;min-width:0;flex:1 1 auto}
 .pont-operations .pont-week-header-text small{
   display:block;margin-top:5px;color:#b9d2d2;font-weight:400;
   font-size:clamp(10px,2.2vw,14px);line-height:1.4;letter-spacing:0;
 }
 .pont-operations #pontOpWeekRestaurantWrap{
   gap:7px!important;margin:4px 0 16px!important;
   font:600 clamp(13px,2.7vw,17px)/1.3 system-ui!important;
   color:#8dece4!important;
 }
 .pont-operations #pontOpWeekRestaurant{
   min-height:48px!important;border-radius:15px!important;
   background:linear-gradient(110deg,#0a3639,#04292d 80%)!important;
   border:1px solid #8deee3a1!important;
   color:#fff!important;font:500 clamp(15px,3.5vw,19px) system-ui!important;
   padding:9px 13px!important;
   box-shadow:inset 0 1px 10px #8afde919,0 0 10px #36e9e51b!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav{
   display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;
   align-items:center!important;gap:clamp(6px,1.6vw,13px)!important;
   margin:18px 0 20px!important;
   width:100%!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-button{
   display:flex!important;align-items:center!important;justify-content:center!important;
   width:100%!important;max-width:none!important;min-width:0!important;
   border:1px solid #4beedbcc!important;border-radius:999px!important;
   background:linear-gradient(130deg,#074747,#065b55 52%,#053032)!important;
   box-shadow:inset 0 2px 10px #71ffed28,0 0 7px #16d7c623!important;
   color:#f7fffe!important;
   padding:10px clamp(6px,1.3vw,12px)!important;
   min-height:45px!important;font:600 clamp(10px,1.9vw,15px)/1.2 system-ui!important;
   white-space:normal!important;letter-spacing:-.02em!important;
 }
 .pont-operations #pontWeekPanel .pont-op-arrow{font-size:clamp(20px,3.1vw,28px)!important;line-height:.8!important;opacity:1!important}
 .pont-operations #pontWeekPanel .pont-week-range{
   display:flex;align-items:center;justify-content:center;gap:6px;
   min-height:45px;white-space:nowrap;text-align:center;
   padding:6px clamp(5px,1.8vw,14px);
   border:1px solid #32babb80;border-radius:999px;
   color:#e8f5f4;font:700 clamp(10px,2.1vw,16px)/1.2 system-ui;
   background:linear-gradient(180deg,#073034,#031c22);
 }
 .pont-operations #pontWeekPanel .pont-op-days{display:grid!important;gap:8px!important}
 .pont-operations #pontWeekPanel .pont-op-day{
   display:grid!important;grid-template-columns:clamp(58px,12vw,92px) minmax(0,1fr) auto!important;
   align-items:center!important;gap:clamp(9px,2vw,20px)!important;
   min-height:66px!important;flex-wrap:nowrap!important;
   padding:8px clamp(10px,2vw,19px)!important;
   border:1px solid #3b9a9b75!important;border-radius:17px!important;
   background:linear-gradient(110deg,#074146c9,#00282c 55%,#052d30)!important;
   box-shadow:inset 0 1px 9px #8fffea17,0 5px 14px #00171938!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day--published{
   background:linear-gradient(100deg,#165837,#083d36 48%,#074332)!important;
   border-color:#76ecb7b5!important;box-shadow:inset 0 1px 9px #baffd42b,0 0 13px #30f69c35!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-date{
   display:flex;flex-direction:column;justify-content:center;gap:2px;
   min-width:0;padding-right:8px;border-right:1px solid #a6dcd858;
 }
 .pont-operations #pontWeekPanel .pont-week-day-date strong{
   font:780 clamp(15px,3.3vw,21px)/1.13 system-ui!important;
   letter-spacing:.01em;color:#fff!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-date small{
   font:450 clamp(10px,2.4vw,14px)/1.2 system-ui!important;
   color:#e0e9e7!important;margin:0!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-state{
   display:flex;align-items:center;gap:clamp(6px,1.4vw,13px);
   font:600 clamp(11px,2.6vw,16px)/1.2 system-ui;color:#eef4f2;min-width:0;
 }
 .pont-operations #pontWeekPanel .pont-week-state-icon{
   display:grid;place-items:center;flex:0 0 24px;
   height:24px;color:#b9d5d4;
   font-size:23px;line-height:1;
 }
 .pont-operations #pontWeekPanel .pont-week-day--finished .pont-week-state-icon,
 .pont-operations #pontWeekPanel .pont-week-day--scheduled .pont-week-state-icon{
   color:#91e06a;font-weight:750;
 }
 .pont-operations #pontWeekPanel .pont-week-day--published .pont-week-state-icon{color:#76f9a2}
 .pont-operations #pontWeekPanel .pont-week-day-action{
   display:inline-flex!important;align-items:center;justify-content:center;
   white-space:nowrap!important;min-height:40px!important;
   padding:7px clamp(9px,1.8vw,17px)!important;border-radius:999px!important;
   border:1px solid #72f9e3!important;
   background:linear-gradient(140deg,#0b6e61,#023f3e)!important;
   box-shadow:inset 0 1px 8px #adfff04a,0 0 12px #1dfce944!important;
   font:700 clamp(10px,2.4vw,15px)/1.2 system-ui!important;
   color:#fff!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-action span{font-size:19px!important;line-height:1}
 .pont-operations #pontWeekPanel .pont-week-create-remaining{
   display:flex;align-items:center;justify-content:center;gap:10px;
   width:min(100%,550px);min-height:51px;margin:24px auto 4px;
   padding:10px 18px;border:1.5px solid #7affed;border-radius:999px;
   background:linear-gradient(145deg,#075952,#002b33 63%,#07635b);
   box-shadow:inset 0 2px 12px #b3ffef6b,0 0 20px #18edd575,0 7px 20px #00161a;
   color:#fafffd;font:750 clamp(13px,2.8vw,18px)/1.2 system-ui;cursor:pointer;
 }
 .pont-operations #pontWeekPanel .pont-week-create-remaining span{font-size:23px}
 .pont-operations #pontWeekPanel .pont-week-create-remaining:disabled{opacity:.48;box-shadow:none;cursor:not-allowed}
 .pont-operations #pontWeekPanel #pontOpWeekStatus:empty{display:none!important}
 @media(max-width:580px){
   .pont-operations #pontWeekPanel .pont-op-week-nav{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:7px!important}
   .pont-operations #pontWeekPanel .pont-week-range{grid-column:1/-1;grid-row:1;margin:0 auto 4px;min-height:36px;padding:7px 15px}
   .pont-operations #pontWeekPanel #pontOpWeekPrevious{grid-column:1;grid-row:2}
   .pont-operations #pontWeekPanel #pontOpWeekNext{grid-column:2;grid-row:2}
   .pont-operations #pontWeekPanel .pont-op-day{grid-template-columns:52px minmax(0,1fr) auto!important;gap:7px!important;padding:8px!important;min-height:61px!important}
   .pont-operations #pontWeekPanel .pont-week-state-icon{flex-basis:17px;height:20px;font-size:18px}
   .pont-operations #pontWeekPanel .pont-week-day-action{font-size:10px!important;padding:7px 8px!important;gap:3px!important}
   .pont-operations #pontWeekPanel .pont-week-day-action span{font-size:16px!important}
 }
 @media(max-width:360px){
   .pont-operations #pontWeekPanel{padding:12px!important}
   .pont-operations #pontWeekPanel .pont-op-day{grid-template-columns:45px minmax(0,1fr) auto!important;gap:5px!important}
   .pont-operations #pontWeekPanel .pont-week-day-state{font-size:10px!important;gap:3px}
   .pont-operations #pontWeekPanel .pont-week-day-date strong{font-size:13px!important}
   .pont-operations #pontWeekPanel .pont-week-day-action{font-size:9px!important;padding:7px 6px!important}
 }

 /* Refined compact planner — keeps the approved lighting and all day actions. */
 .pont-operations #pontWeekPanel{
   padding:clamp(11px,2.25vw,20px)!important;
   border-radius:clamp(15px,3.5vw,24px)!important;
 }
 .pont-operations #pontWeekPanel>summary{
   min-height:43px!important;
   padding:3px 0 9px!important;
   gap:clamp(7px,1.55vw,12px)!important;
   font-size:clamp(13px,3vw,20px)!important;
   line-height:1.25!important;
 }
 .pont-operations #pontWeekPanel:not([open])>summary{
   border-bottom:0!important;padding:2px 0!important;
 }
 .pont-operations #pontWeekPanel[open]>summary{margin-bottom:10px!important}
 .pont-operations #pontWeekPanel>summary::after{
   font-size:clamp(20px,3vw,25px)!important;
 }
 .pont-operations #pontWeekPanel .pont-week-header-icon{
   flex-basis:clamp(27px,5.1vw,38px)!important;
   height:clamp(27px,5.1vw,38px)!important;
   font-size:clamp(15px,2.5vw,20px)!important;
 }
 .pont-operations #pontWeekPanel #pontOpWeekRestaurantWrap{
   margin:2px 0 11px!important;
 }
 .pont-operations #pontWeekPanel #pontOpWeekRestaurant{
   min-height:41px!important;font-size:clamp(13px,3vw,17px)!important;
   padding:6px 10px!important;border-radius:12px!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav{
   margin:12px 0 14px!important;gap:6px!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-button{
   min-height:39px!important;padding:7px clamp(5px,1.1vw,10px)!important;
   font-size:clamp(10px,1.8vw,13px)!important;
 }
 .pont-operations #pontWeekPanel .pont-week-range{
   min-height:39px!important;
   padding:5px clamp(6px,1.3vw,11px)!important;
 }
 .pont-operations #pontWeekPanel .pont-op-days{gap:6px!important}
 .pont-operations #pontWeekPanel .pont-op-day{
   min-height:52px!important;
   padding:6px clamp(8px,1.5vw,13px)!important;
   gap:clamp(7px,1.45vw,12px)!important;
   border-radius:13px!important;
   grid-template-columns:clamp(49px,10vw,75px) minmax(0,1fr) auto!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-date strong{
   font-size:clamp(13px,2.9vw,18px)!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-date small{
   font-size:clamp(10px,2vw,12px)!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-state{
   font-size:clamp(10.5px,2.35vw,14px)!important;gap:6px!important;
 }
 .pont-operations #pontWeekPanel .pont-week-state-icon{
   flex-basis:19px!important;height:19px!important;font-size:19px!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-action{
   min-height:34px!important;
   padding:5px clamp(7px,1.45vw,12px)!important;
   font-size:clamp(10px,2.1vw,13px)!important;
   border-radius:11px!important;
   box-shadow:inset 0 1px 6px #adfff033,0 0 7px #1dfce933!important;
 }
 .pont-operations #pontWeekPanel .pont-week-day-action span{
   font-size:15px!important;
 }
 @media(max-width:580px){
   .pont-operations #pontWeekPanel .pont-op-day{
     min-height:49px!important;grid-template-columns:46px minmax(0,1fr) auto!important;
     gap:5px!important;padding:5px 7px!important;
   }
   .pont-operations #pontWeekPanel .pont-week-day-action{
     font-size:10px!important;padding:5px 7px!important;
   }
   .pont-operations #pontWeekPanel .pont-week-state-icon{
     flex-basis:15px!important;height:16px!important;font-size:16px!important;
   }
   .pont-operations #pontWeekPanel .pont-week-day-state{
     font-size:10.5px!important;gap:3px!important;
   }
 }
 @media(max-width:360px){
   .pont-operations #pontWeekPanel .pont-op-day{
     grid-template-columns:40px minmax(0,1fr) auto!important;
   }
   .pont-operations #pontWeekPanel .pont-week-day-action{
     font-size:9px!important;padding:5px!important;
   }
 }

 /* Thin full-width previous/next weekly navigation: no middle date pill. */
 .pont-operations #pontWeekPanel .pont-op-week-nav{
   display:grid!important;
   grid-template-columns:repeat(2,minmax(0,1fr))!important;
   align-items:center!important;
   gap:clamp(5px,1.5vw,10px)!important;
   width:100%!important;max-width:100%!important;
   margin:10px 0 13px!important;
   padding:0!important;box-sizing:border-box!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-button{
   box-sizing:border-box!important;
   display:flex!important;align-items:center!important;justify-content:center!important;
   flex:1 1 0!important;
   grid-row:1!important;
   min-width:0!important;max-width:100%!important;width:100%!important;
   min-height:32px!important;height:32px!important;
   margin:0!important;padding:4px clamp(3px,1vw,8px)!important;
   border-radius:10px!important;
   gap:clamp(2px,.7vw,5px)!important;
   font:600 clamp(9px,2.45vw,12px)/1.05 system-ui,-apple-system,sans-serif!important;
   letter-spacing:-.04em!important;
   white-space:nowrap!important;
   overflow:hidden!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-button>span:not(.pont-op-arrow){
   white-space:nowrap!important;min-width:0!important;
 }
 .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-arrow{
   font-size:clamp(14px,3.1vw,18px)!important;
   flex:none!important;line-height:1!important;
 }
 .pont-operations #pontWeekPanel #pontOpWeekPrevious{
   grid-column:1!important;grid-row:1!important;
 }
 .pont-operations #pontWeekPanel #pontOpWeekNext{
   grid-column:2!important;grid-row:1!important;
 }
 @media(max-width:360px){
   .pont-operations #pontWeekPanel .pont-op-week-nav{gap:4px!important}
   .pont-operations #pontWeekPanel .pont-op-week-nav .pont-op-button{
     font-size:9px!important;letter-spacing:-.06em!important;
     padding:4px 2px!important;gap:2px!important;
   }
 }
 </style>
 <details id="pontHoursPanel"><summary>Comandă minimă</summary>
 <label id="pontOpRestaurantWrap">Restaurant<select id="pontOpRestaurant"></select></label>
 
 <div class="pont-op-grid"><label>Comandă minimă<span class="pont-op-min-row"><input id="pontOpMin" type="number" min="1" max="20" step="1" value="1" required><span>meniu</span></span></label></div>
 ${superAdminSettings ? '' : '<button type="button" id="pontOpSave" class="' + (settingsHost ? 'primary' : 'pont-op-button') + '">' + (settingsHost ? 'Salvează setările comenzilor' : 'Salvează comanda minimă') + '</button>'}<p id="pontOpStatus" role="status"></p></details>
 <details id="pontWeekPanel"><summary><span class="pont-week-header-icon" aria-hidden="true">▣</span><span class="pont-week-header-text">Planifică meniul pe toată săptămâna</span></summary>
 <label id="pontOpWeekRestaurantWrap" hidden><span class="pont-week-restaurant-label">Restaurant</span><select id="pontOpWeekRestaurant"></select></label>
 <div class="pont-op-week-nav">
 <button type="button" class="pont-op-button" id="pontOpWeekPrevious"><span class="pont-op-arrow" aria-hidden="true">‹</span><span>Săptămâna anterioară</span></button>
 <button type="button" class="pont-op-button" id="pontOpWeekNext"><span>Săptămâna următoare</span><span class="pont-op-arrow" aria-hidden="true">›</span></button>
 </div>
 <div id="pontOpDays" class="pont-op-days"></div>
 <p id="pontOpWeekStatus" role="status"></p></details>`;
 parent.append(section);
 if(settingsHost){
   const settings=document.createElement('div');
   settings.id='pontRestaurantSettings';
   settings.className='pont-operations';
   settings.append($('pontHoursPanel'));
   $('pontHoursPanel').hidden=true;
   settings.style.display='none';
   if (isRestaurantAdmin) {
     const priceCard = $('restaurantMenuPrice')?.closest('.contact-card-settings');
     if (priceCard) settingsHost.insertBefore(settings, priceCard);
     else settingsHost.append(settings);
     const hoursPanel = $('pontHoursPanel');
     hoursPanel.querySelector('summary').textContent = 'Comandă minimă';
     hoursPanel.open = false;
     const minLabel = hoursPanel.querySelector('.pont-op-grid label');
     const minCard = document.createElement('div');
     minCard.className = 'contact-card-settings pont-min-order-settings';
     const minTitle = document.createElement('h3');
     minTitle.textContent = 'Comandă minimă';
     minCard.append(minTitle);
     if (minLabel) {
       minLabel.firstChild.textContent = '';
       minLabel.setAttribute('aria-label', 'Comandă minimă');
       minCard.append(minLabel);
     }
     minCard.append($('pontOpSave'), $('pontOpStatus'));
     if (priceCard) priceCard.after(minCard);
     else settings.after(minCard);
   } else {
     settingsHost.append(settings);
   }
   if (superAdminSettings) {
     settingsHost.hidden = true;
     $('pontHoursPanel').open = false;
     $('pontOpRestaurantWrap').hidden = true;
   }
 }
 const formatDate=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const monday=date=>dateAt(date,-(new Date(date+'T12:00:00Z').getUTCDay()+6)%7);
 const dateAt=(start,days)=>{const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
 let renderedDay=formatDate(new Date());
 let weekStart=monday(renderedDay);
 const restaurants=()=>getRestaurants()||[];
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
     // Restaurant administrators always plan for their assigned restaurant.
     // Only the Super Admin can choose a restaurant in the weekly planner.
     if(isRestaurantAdmin){
       weekSelector.value=rs[0]?.id||'';
       weekSelector.disabled=true;
       $('pontOpWeekRestaurantWrap').hidden=true;
     }else{
       weekSelector.disabled=false;
       if(rs.some(r=>r.id===previousWeekRestaurant))weekSelector.value=previousWeekRestaurant;
       $('pontOpWeekRestaurantWrap').hidden=rs.length<=1;
     }
   }
 }
 async function loadSettings(){
   options();if(!activeRestaurant || (superAdminSettings && !editRestaurantId))return;
   const restaurantId=activeRestaurant;
   const saveButton=$('pontOpSave');
   if(saveButton)saveButton.disabled=true;
   if(superAdminSettings)settingsLoaded=false;
   $('pontOpStatus').textContent='Se încarcă setările…';
   const {data,error}=await db.from('pont_order_settings').select('min_full_menus').eq('restaurant_id',restaurantId).maybeSingle();
   if(restaurantId!==activeRestaurant || (superAdminSettings && editRestaurantId!==restaurantId))return;
   if(error){$('pontOpStatus').textContent=error.message;return}
   $('pontOpMin').value=data?.min_full_menus||1;
   $('pontOpStatus').textContent='';
   if(saveButton)saveButton.disabled=false;
   if(superAdminSettings)settingsLoaded=true;
 }
 $('pontOpRestaurant').addEventListener('change',event=>{activeRestaurant=event.target.value;loadSettings()});
 $('pontOpWeekRestaurant').addEventListener('change',renderWeek);
 function readOrderSettings(){
   const min=Number($('pontOpMin').value);
   if(!Number.isInteger(min)||min<1||min>20)throw Error('Comanda minimă trebuie să fie între 1 și 20 de meniuri.');
   return {min_full_menus:min};
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
       $('pontOpStatus').textContent='Comanda minimă a fost salvată.';
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
   const abbr=['LUN','MAR','MIE','JOI','VIN','SÂM','DUM'];
   $('pontOpDays').innerHTML=days.map((name,i)=>{
     const date=dateAt(weekStart,i),menu=menus.find(m=>m.restaurant_id===restaurant&&m.service_date===date);
     const past=date<today, hasMenu=Boolean(menu);
     const label=!hasMenu?'Fără meniu':past?'Finalizat':date===today?'Publicat':'Programat';
     const statusClass=!hasMenu?'empty':past?'finished':date===today?'published':'scheduled';
     const action=past?'':'<button type="button" class="pont-op-button pont-week-day-action" data-week-date="'+date+'"><span aria-hidden="true">'+(hasMenu?'✎':'+')+'</span>'+(hasMenu?'Editează':'Creează meniu')+'</button>';
     const d=String(Number(date.slice(8))),monthLabel=new Intl.DateTimeFormat('ro-RO',{month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')).replace('.','');
     const icon=hasMenu?(past?'✓':date===today?'◉':'✓'):'▯';
     return '<div class="pont-op-day pont-week-day--'+statusClass+'"><div class="pont-week-day-date"><strong>'+abbr[i]+'</strong><small>'+d+' '+monthLabel+'</small></div><div class="pont-week-day-state"><span class="pont-week-state-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span></div>'+action+'</div>';
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
