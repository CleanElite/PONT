// PONT restaurant dashboard payment bell. Shares the existing Stripe PaymentIntent backend/dialog behavior with Promovare.
export function initPontAuctionPaymentBell({db,config}) {
 const topbar=document.querySelector('.admin-topbar');
 if(!topbar)return {refresh:async()=>{},setVisible:()=>{}};
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
 @media(max-width:600px){.admin-topbar{gap:8px!important}.pont-auction-notify{max-width:40vw}.pont-auction-notice{font-size:10px}}
 `;
 document.head.append(styles);
 const host=document.createElement('div');
 host.className='pont-auction-notify';host.hidden=true;
 host.innerHTML='<button type="button" class="pont-auction-bell" aria-label="Notificări plăți licitații" title="Plăți licitații"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></button><span class="pont-auction-notice" hidden></span>';
 topbar.append(host);
 const bell=host.querySelector('button'),notice=host.querySelector('.pont-auction-notice');
 const dialog=document.createElement('dialog');
 dialog.className='pont-auction-pay-dialog';
 dialog.innerHTML='<div class="pont-auction-pay-inner"><button type="button" class="pont-auction-pay-close" aria-label="Închide">×</button><h2>Finalizează plata licitației</h2><p class="pont-payment-info"></p><div class="pont-auction-pay-list"></div><form class="pont-auction-pay-form" hidden><div class="pont-auction-pay-element"></div><button class="pont-auction-pay-submit" type="submit" disabled>Autorizează plata</button></form><p class="pont-auction-pay-msg" role="status" aria-live="polite"></p><p class="pont-auction-pay-note">Plata este securizată prin Stripe. Datele cardului nu sunt stocate în PONT.</p></div>';
 document.body.append(dialog);
 const close=dialog.querySelector('.pont-auction-pay-close'),info=dialog.querySelector('.pont-payment-info');
 const list=dialog.querySelector('.pont-auction-pay-list'),form=dialog.querySelector('form');
 const elementHost=dialog.querySelector('.pont-auction-pay-element'),submit=form.querySelector('button');
 const message=dialog.querySelector('.pont-auction-pay-msg');
 let due=[],busy=false,stripe=null,elements=null,visible=false;
 const formatMonth=month=>new Intl.DateTimeFormat('ro-RO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'T12:00:00Z'));
 const money=value=>Number(value).toLocaleString('ro-RO',{maximumFractionDigits:2})+' lei';
 function render() {
  const count=due.length;
  bell.classList.toggle('is-due',count>0);
  notice.hidden=count===0;
  notice.textContent=count?('Finalizează plata licitației pentru '+formatMonth(due[0].campaign_month)+(count>1?' (+'+(count-1)+')':'')):'';
  bell.setAttribute('aria-label',count?'Plăți restante pentru '+count+' licitații':'Nu ai plăți restante');
 }
 async function refresh() {
  if(!visible||busy)return;
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
 function showList(){
  form.hidden=true;list.hidden=false;info.textContent='Licitații încheiate, cu plată de finalizat';
  message.textContent='';
  list.replaceChildren();
  if(!due.length){const p=document.createElement('p');p.textContent='Nu ai plăți de finalizat.';list.append(p);return}
  for(const item of due){
   const row=document.createElement('div');row.className='pont-auction-pay-row';
   const caption=document.createElement('span');caption.textContent=formatMonth(item.campaign_month)+' · '+money(item.amount);
   const btn=document.createElement('button');btn.type='button';btn.textContent='Plătește';
   btn.addEventListener('click',()=>openPayment(item));
   row.append(caption,btn);list.append(row);
  }
 }
 async function loadStripe(){
  if(window.Stripe)return;
  await new Promise((resolve,reject)=>{
   const s=document.createElement('script');
   s.src='https://js.stripe.com/v3/';s.onload=resolve;s.onerror=()=>reject(Error('Stripe nu s-a putut încărca'));
   document.head.append(s);
  });
 }
 async function openPayment(item){
  if(busy)return;
  busy=true;form.hidden=false;list.hidden=true;submit.disabled=true;elementHost.replaceChildren();
  info.textContent='Campania '+formatMonth(item.campaign_month)+' · '+money(item.amount);
  message.textContent='Se pregătește formularul de card…';
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session?.access_token)throw Error('Sesiunea a expirat');
   const response=await fetch(config.url+'/functions/v1/pont-stripe-auctions?action=create',{
    method:'POST',headers:{authorization:'Bearer '+session.access_token,apikey:config.anonKey,'content-type':'application/json'},
    body:JSON.stringify({month:item.campaign_month})
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Plata nu a putut fi inițializată');
   await loadStripe();
   if(!dialog.open)return;
   stripe=window.Stripe(result.publishableKey);
   elements=stripe.elements({clientSecret:result.clientSecret,appearance:{theme:'night',variables:{colorPrimary:'#42e5c9',colorBackground:'#072b31',colorText:'#edf9f7',borderRadius:'10px'}}});
   const payment=elements.create('payment',{layout:'tabs'});
   payment.mount(elementHost);
   submit.disabled=false;message.textContent='';
  }catch(err){message.textContent=err.message}
  finally{busy=false}
 }
 bell.addEventListener('click',()=>{showList();if(!dialog.open)dialog.showModal();if(due.length===1)openPayment(due[0])});
 notice.addEventListener('click',()=>bell.click());
 close.addEventListener('click',()=>{if(!busy)dialog.close()});
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||!stripe||!elements)return;
  busy=true;submit.disabled=true;message.textContent='Se autorizează plata…';
  try{
   const {error,paymentIntent}=await stripe.confirmPayment({
    elements,confirmParams:{return_url:location.origin+location.pathname},redirect:'if_required'
   });
   if(error)throw Error(error.message||'Nu s-a putut autoriza plata');
   message.textContent=paymentIntent?.status==='succeeded'?'Plata a fost autorizată. Actualizarea apare după confirmarea Stripe.':'Plata este în procesare.';
  }catch(err){message.textContent=err.message;submit.disabled=false}
  finally{
   busy=false;
   // Stripe confirms server-side via webhook; refresh the notification after the attempt.
   refresh().catch(e=>console.warn('Stare plată:',e.message));
  }
 });
 const interval=setInterval(()=>{if(visible&&!document.hidden)refresh().catch(e=>console.warn('Notificare plăți:',e.message))},20000);
 document.addEventListener('visibilitychange',()=>{if(visible&&!document.hidden)refresh().catch(()=>{})});
 return {setVisible(value){visible=Boolean(value);host.hidden=!visible;if(visible)refresh().catch(e=>console.warn('Plăți licitații:',e.message));else{due=[];render()}},refresh,destroy(){clearInterval(interval);host.remove();dialog.remove();styles.remove()}};
}
