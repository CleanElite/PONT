// PONT restaurant dashboard bell and payment notification; opens the shared full-screen checkout without navigation.
import {initPontAuctionCheckout} from './pont-auction-checkout.js?v=centered-close-20261113';
export function initPontAuctionPaymentBell({db,config}) {
 const header=document.querySelector('#pontAuctionBellMount');
 if(!header)return {refresh:async()=>{},setVisible:()=>{}};
 const host=document.createElement('div');
 host.className='pont-auction-notify';host.hidden=true;
 const paymentLabel='Finalizează plata licitației';
 const hostMarkup=`<button type="button" class="pont-auction-notice" aria-label="${paymentLabel}" hidden></button>
 <button type="button" class="pont-auction-bell" aria-label="Notificări plăți licitații" title="Plăți licitații"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></button>`;
 host.innerHTML=hostMarkup;
 header.append(host);
 // All payment entry points use the same full-screen checkout in Promovare.
 // Do not mount a second Stripe Payment Element in the restaurant dashboard.
 const bell=host.querySelector('.pont-auction-bell');
 const notice=host.querySelector('.pont-auction-notice');
 let due=[],visible=false;
 const checkout=initPontAuctionCheckout({db,config,onFinished:()=>refresh()});
 const formatMonth=month=>new Intl.DateTimeFormat('ro-RO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'T12:00:00Z'));
 function render(){
  const count=due.length;
  bell.classList.toggle('is-due',count>0);
  notice.hidden=count===0;
  notice.replaceChildren();
  if(count){
   const action=document.createElement('span');action.className='pont-pay-action';action.textContent=paymentLabel;
   const month=document.createElement('span');month.className='pont-pay-month';
   month.textContent=formatMonth(due[0].campaign_month)+(count>1?' (+'+(count-1)+')':'');
   notice.append(action,month);
  }
  notice.title=count?paymentLabel+' pentru '+formatMonth(due[0].campaign_month):'';
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
  const item=due[0];
  if(!item)return;
  checkout.open(item).catch(error=>console.error('Plată PONT:',error));
 }
 bell.addEventListener('click',goToCheckout);
 notice.addEventListener('click',goToCheckout);
 const interval=setInterval(()=>{if(visible&&!document.hidden)refresh().catch(e=>console.warn('Notificare plăți:',e.message))},20000);
 document.addEventListener('visibilitychange',()=>{if(visible&&!document.hidden)refresh().catch(()=>{})});
 return {setVisible(value){visible=Boolean(value);host.hidden=!visible;if(visible)refresh().catch(e=>console.warn('Plăți licitații:',e.message));else{due=[];render()}},refresh,destroy(){clearInterval(interval);host.remove();checkout.destroy()}};
}
