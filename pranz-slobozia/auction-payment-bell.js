// PONT restaurant dashboard payment bell. Shares the existing Stripe PaymentIntent backend/dialog behavior with Promovare.
export function initPontAuctionPaymentBell({db,config}) {
 const header=document.querySelector('#pontAuctionBellMount');
 if(!header)return {refresh:async()=>{},setVisible:()=>{}};
 const styles=document.createElement('style');
 styles.textContent=`
 .pont-auction-notify{margin-left:auto;display:flex;flex-direction:column;align-items:center;gap:3px;max-width:min(230px,43vw);position:relative;z-index:2}
 .pont-auction-notify[hidden]{display:none!important}
 .pont-auction-bell{position:relative;display:grid;place-items:center;width:43px;height:43px;padding:0!important;border:1px solid #64bcb0a8!important;border-radius:14px;background:#073840!important;color:#dbfaf4!important;box-shadow:inset 0 1px 9px #69f8e41e}
 .pont-auction-bell svg{width:21px;height:21px;transform-origin:50% 14%;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
 .pont-auction-bell.is-due{border-color:#87ffec!important;color:#8fffee!important;box-shadow:0 0 13px #40edd941,inset 0 0 10px #50e7d333!important}
 .pont-auction-bell.is-due svg{animation:pont-bell-swing 1.9s ease-in-out infinite}
 .pont-auction-bell.is-due::after{content:'';position:absolute;top:7px;right:8px;width:7px;height:7px;background:#f9c974;border-radius:50%;box-shadow:0 0 9px #f9c974}
 @keyframes pont-bell-swing{0%,48%,100%{transform:rotate(0)}10%,30%{transform:rotate(-15deg)}20%,40%{transform:rotate(15deg)}}
 @media(prefers-reduced-motion:reduce){.pont-auction-bell.is-due svg{animation:none}}
 .pont-auction-notice{font:600 11px/1.3 system-ui;text-align:center;color:#b9f4e9;text-decoration:none!important;overflow-wrap:anywhere}
 .pont-auction-notice[hidden]{display:none!important}
 .pont-auction-pay-dialog{position:fixed;inset:0;margin:auto;width:min(92vw,460px);max-height:88dvh;overflow:auto;padding:0;border:1px solid #73f4dfaa;border-radius:24px;background:linear-gradient(145deg,#05363b,#031d27 70%,#084c46);color:#ecfbf8;box-shadow:0 24px 90px #000b,0 0 23px #32e6c426}
 .pont-auction-pay-dialog::backdrop{background:#03171edb;backdrop-filter:blur(6px)}
 .pont-auction-pay-inner{position:relative;padding:clamp(20px,5vw,31px);text-align:center}
 .pont-auction-pay-inner h2{margin:8px 22px 12px!important;font:600 clamp(23px,6vw,32px)/1.18 Georgia,serif!important;color:#effffb}
 .pont-auction-pay-inner .pont-payment-info{font:600 14px/1.45 system-ui;color:#c5f0e8;margin:0 0 18px}
 .pont-auction-pay-close{position:absolute;top:12px;right:12px;border:1px solid #69d2c37c!important;border-radius:50%!important;background:#083d44!important;color:white!important;width:33px;height:33px;padding:0!important;font-size:23px!important}
 .pont-auction-pay-list{display:grid;gap:9px}
 .pont-auction-pay-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;border:1px solid #62c5b76b;border-radius:12px;background:#063b43;color:#ecfbf8}
 .pont-auction-pay-row button{padding:9px 11px;background:#048d81;color:#fff;border:1px solid #78e7d6}
 .pont-auction-pay-element{min-height:35px;text-align:left}
 .pont-auction-pay-submit{width:100%;margin-top:17px;padding:12px;border:1px solid #91ffee;background:#028a7b;color:white}
 .pont-auction-pay-msg{font:550 12px/1.4 system-ui;color:#ffc7b8;margin:10px 0 0}
 .pont-auction-pay-note{font:450 11px/1.5 system-ui;color:#accbc7;margin:12px 0 0}
 /* Solid gold finish with a single diagonal neon sweep. Bell stays stationary. */
 .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notify{
   margin:0!important;flex:0 1 auto!important;width:auto!important;
   max-width:min(220px,43vw);min-width:45px;align-self:center;gap:7px;
   flex-direction:row!important;align-items:center!important;justify-content:flex-end!important;
 }
 .pont-admin #app .pont-restaurant-premium-heading .pont-auction-bell{
   position:relative!important;isolation:isolate;overflow:hidden;
   width:52px!important;height:52px!important;min-height:52px!important;
   padding:0!important;border:2px solid #fff0ac!important;border-radius:16px!important;
   color:#ffde68!important;
   background:linear-gradient(140deg,#fff6b9 0%,#ffe25a 15%,#ffbf00 41%,#f6a900 64%,#ffe477 87%,#e0a100 100%)!important;
   box-shadow:0 0 0 1px #c58700,0 0 16px #ffcd36a6,0 0 29px #ffce3e5c,0 4px 14px #0005,inset 0 2px 4px #fff9d8be!important;
 }
 .pont-admin #app .pont-auction-bell .pont-bell-core{
   position:absolute;inset:2px;border-radius:12px;z-index:1;pointer-events:none;
   background:linear-gradient(145deg,#ffea75 0%,#ffd026 38%,#f2ac00 75%,#ffdc56 100%);
 }
 .pont-admin #app .pont-auction-bell svg,
 .pont-admin #app .pont-auction-bell.is-due svg{
   position:relative;z-index:2;width:27px;height:27px;
   stroke:#a26800!important;stroke-width:1.15!important;fill:url(#pontBellGoldFill)!important;
   filter:drop-shadow(0 1px 0 #754800) drop-shadow(0 0 5px #fff5a8dd);
   transform:none!important;animation:none!important;
 }
 /* A soft luminous beam moves from upper-left to lower-right over the gold. */
 .pont-admin #app .pont-auction-bell::before{
   content:'';position:absolute;inset:0;z-index:3;pointer-events:none;
   border-radius:inherit;
   background:linear-gradient(115deg,
     transparent 27%,rgba(255,251,221,.05) 39%,
     rgba(255,255,241,.67) 47%,rgba(255,255,255,.96) 50%,
     rgba(255,235,133,.54) 54%,transparent 69%);
   filter:drop-shadow(0 0 5px rgba(255,244,173,.85));
   transform:translate3d(-125%,-125%,0);
   animation:pont-gold-diagonal-neon 3s ease-in-out infinite;
 }
 .pont-admin #app .pont-auction-bell.is-due{
   border-color:#fff8d4!important;color:#ffdf60!important;
   box-shadow:0 0 0 1px #f3b44d,0 0 24px #ffd166ab,0 0 10px #fff3b88a,inset 0 1px 5px #fff7cb!important;
 }
 .pont-admin #app .pont-auction-bell.is-due::after{
   z-index:4;background:#fff9d6;box-shadow:0 0 11px #fff0a4;
 }
 .pont-admin #app .pont-auction-notice[hidden]{display:none!important}
 .pont-admin #app .pont-auction-notice{
   display:-webkit-box!important;flex:0 1 138px;min-width:0;max-width:138px;
   overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;
   padding:7px 10px!important;margin:0!important;min-height:0!important;
   border:1px solid #ffefb4!important;border-radius:10px!important;
   background:linear-gradient(135deg,#fff0a2 0%,#ffd34f 36%,#efad18 72%,#ffdc6b 100%)!important;
   color:#533300!important;font:750 11px/1.35 system-ui!important;
   text-align:center!important;cursor:pointer;
   box-shadow:0 0 12px #f7c84f55,inset 0 1px 2px #fff9d6!important;
 }
 @keyframes pont-gold-diagonal-neon{
   0%{transform:translate3d(-125%,-125%,0);opacity:0}
   12%{opacity:1}
   65%{transform:translate3d(125%,125%,0);opacity:1}
   73%,100%{transform:translate3d(125%,125%,0);opacity:0}
 }
 @media(max-width:540px){
   .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notify{width:auto!important;max-width:44vw!important;gap:5px!important}
   .pont-admin #app .pont-auction-notice{flex:0 0 112px!important;width:112px!important;max-width:112px!important;font-size:11px!important;padding:3px 6px!important}
   .pont-admin #app .pont-restaurant-premium-heading .pont-auction-bell{width:45px!important;height:45px!important;min-height:45px!important}
 }
 /* A single compact header line: the bell sets height; the payment label uses two deliberate lines. */
 .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notify{
   flex:0 0 auto!important;width:auto!important;max-width:none!important;min-width:0!important;
   flex-direction:row!important;align-items:center!important;gap:6px!important;
 }
 .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notice{
   display:flex!important;flex:0 0 120px!important;width:120px!important;max-width:120px!important;
   height:45px!important;min-height:0!important;max-height:45px!important;
   padding:3px 5px!important;box-sizing:border-box!important;overflow:hidden!important;
   flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:1px!important;
   white-space:normal!important;text-align:center!important;
   font:750 11px/1.12 system-ui!important;overflow-wrap:normal!important;
 }
 .pont-admin #app .pont-auction-notice .pont-pay-action{display:block;font-weight:800;font-size:11px;line-height:1.12}
 .pont-admin #app .pont-auction-notice .pont-pay-month{display:block;font-weight:650;font-size:10px;line-height:1.12}
 @media(max-width:540px){
  .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notify{max-width:none!important;gap:5px!important}
  .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notice{flex-basis:110px!important;width:110px!important;max-width:110px!important}
 }
 @media(max-width:365px){
  .pont-admin #app .pont-restaurant-premium-heading .pont-auction-notice{flex-basis:100px!important;width:100px!important;max-width:100px!important}
 }
 @media(prefers-reduced-motion:reduce){
   .pont-admin #app .pont-auction-bell::before{animation:none!important;opacity:.2;transform:none!important}
 }
 `;
 document.head.append(styles);
 const host=document.createElement('div');
 host.className='pont-auction-notify';host.hidden=true;
 host.innerHTML='<button type="button" class="pont-auction-bell" aria-label="Notificări plăți licitații" title="Plăți licitații"><span class="pont-bell-core" aria-hidden="true"></span><svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pontBellGoldFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff9c7"/><stop offset=".28" stop-color="#ffe15b"/><stop offset=".58" stop-color="#ffbd00"/><stop offset=".86" stop-color="#d88c00"/><stop offset="1" stop-color="#fff0a1"/></linearGradient></defs><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></button><button type="button" class="pont-auction-notice" aria-label="Finalizează plata licitației" hidden></button>';
 header.append(host);
 // All payment entry points use the same full-screen checkout in Promovare.
 // Do not mount a second Stripe Payment Element in the restaurant dashboard.
 const bell=host.querySelector('.pont-auction-bell');
 const notice=host.querySelector('.pont-auction-notice');
 host.insertBefore(notice,bell);
 let due=[],visible=false;
 const formatMonth=month=>new Intl.DateTimeFormat('ro-RO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'T12:00:00Z'));
 function render(){
  const count=due.length;
  bell.classList.toggle('is-due',count>0);
  notice.hidden=count===0;
  notice.replaceChildren();
  if(count){
   const action=document.createElement('span');action.className='pont-pay-action';action.textContent='Finalizează plata';
   const month=document.createElement('span');month.className='pont-pay-month';
   month.textContent=formatMonth(due[0].campaign_month)+(count>1?' (+'+(count-1)+')':'');
   notice.append(action,month);
  }
  notice.title=count?'Finalizează plata licitației pentru '+formatMonth(due[0].campaign_month):'';
  notice.setAttribute('aria-label',notice.title||'Nu există plăți restante');
  bell.setAttribute('aria-label',count?'Plăți restante pentru '+count+' licitații':'Nu ai plăți restante');
 }
 async function refresh(){
  if(!visible)return;
  const {data:{user}}=await db.auth.getUser();
  if(!user){due=[];render();return}
  const {data:member,error:memberError}=await db.rpc('my_restaurant_access');
  if(memberError)throw memberError;
  const ids=(member||[]).map(x=>x.restaurant_id);
  if(!ids.length){due=[];render();return}
  const {data:offers,error:offersError}=await db.from('auction_offers').select('restaurant_id,campaign_month,amount,payment_status')
   .in('restaurant_id',ids).neq('payment_status','paid').order('campaign_month',{ascending:false});
  if(offersError)throw offersError;
  if(!offers?.length){due=[];render();return}
  const months=[...new Set(offers.map(x=>x.campaign_month))];
  const {data:controls,error:ctrlError}=await db.from('pont_auction_control')
   .select('campaign_month,is_open,final_ranking').in('campaign_month',months);
  if(ctrlError)throw ctrlError;
  const map=new Map((controls||[]).map(x=>[x.campaign_month,x]));
  due=offers.filter(o=>{const ctrl=map.get(o.campaign_month);return ctrl?.is_open===false&&Array.isArray(ctrl.final_ranking)&&ctrl.final_ranking.includes(o.restaurant_id)});
  render();
 }
 function goToCheckout(){
  const month=due[0]?.campaign_month;
  if(!month){location.assign('../promovare/');return}
  const destination=new URL('../promovare/',location.href);
  destination.searchParams.set('pay',month);
  location.assign(destination.href);
 }
 bell.addEventListener('click',goToCheckout);
 notice.addEventListener('click',goToCheckout);
 const interval=setInterval(()=>{if(visible&&!document.hidden)refresh().catch(e=>console.warn('Notificare plăți:',e.message))},20000);
 document.addEventListener('visibilitychange',()=>{if(visible&&!document.hidden)refresh().catch(()=>{})});
 return {setVisible(value){visible=Boolean(value);host.hidden=!visible;if(visible)refresh().catch(e=>console.warn('Plăți licitații:',e.message));else{due=[];render()}},refresh,destroy(){clearInterval(interval);host.remove();styles.remove()}};
}
