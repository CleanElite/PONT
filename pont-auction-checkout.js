// One canonical full-screen Stripe checkout for PONT auction payments.
// Used by the restaurant admin bell, payment notice, and Promovare payment button.
let stripeScriptPromise=null;
function loadStripeJs(){
 if(window.Stripe)return Promise.resolve();
 if(stripeScriptPromise)return stripeScriptPromise;
 stripeScriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://js.stripe.com/v3/';
  script.onload=resolve;
  script.onerror=()=>reject(Error('Stripe nu a putut fi încărcat'));
  document.head.append(script);
 }).catch(error=>{stripeScriptPromise=null;throw error});
 return stripeScriptPromise;
}
const sheet=`
html.pont-checkout-locked{overflow:hidden!important;overscroll-behavior:none!important}
body.pont-checkout-locked{position:fixed!important;overflow:hidden!important;left:0!important;right:0!important;width:100%!important}
dialog.pont-checkout[open]{
 position:fixed!important;inset:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important;
 margin:0!important;transform:none!important;display:block!important;
 box-sizing:border-box!important;width:100vw!important;min-width:100vw!important;max-width:none!important;
 height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;
 padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;
 background:linear-gradient(165deg,#061d22 0%,#031417 58%,#071f24 100%)!important;
 color:#edf9f7!important;color-scheme:dark!important;box-shadow:none!important;z-index:2147483647!important;
}
dialog.pont-checkout::backdrop{background:#031417!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.pont-checkout .pont-checkout-content{
 box-sizing:border-box;position:relative;width:100%;height:100%;max-height:100%;
 overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
 padding:max(82px,env(safe-area-inset-top)) max(19px,calc((100vw - 500px)/2)) max(35px,env(safe-area-inset-bottom));
 text-align:center;
}
.pont-checkout .pont-checkout-close{
 position:fixed!important;top:max(16px,env(safe-area-inset-top))!important;right:max(18px,env(safe-area-inset-right))!important;
 z-index:50!important;display:grid!important;place-items:center!important;width:46px!important;height:46px!important;
 border:1px solid #80e4d1a3!important;border-radius:50%!important;background:#0a4447!important;color:#fff!important;
 font:400 27px/1 system-ui!important;cursor:pointer;touch-action:manipulation;
}
.pont-checkout .pont-checkout-kicker{color:#e7c98b;letter-spacing:.19em;text-transform:uppercase;font:750 11px/1.5 system-ui;margin:0 auto 8px}
.pont-checkout h2{color:#f7fffb!important;font:650 clamp(24px,6vw,32px)/1.2 Georgia,serif!important;margin:0 auto 14px!important;max-width:490px}
.pont-checkout .pont-checkout-summary{color:#e8faf6;font:650 14px/1.5 system-ui;margin:0 auto 22px;max-width:490px}
.pont-checkout form{max-width:490px;margin:0 auto;text-align:left}
.pont-checkout .pont-checkout-element{min-height:45px}
.pont-checkout .pont-checkout-payment-stage{position:relative;max-width:490px;margin:0 auto}
.pont-checkout .pont-checkout-payment-stage.is-loading .pont-checkout-payment-fields{
 position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none;
}
.pont-checkout .pont-checkout-payment-stage:not(.is-loading) .pont-checkout-loader{display:none!important}
.pont-checkout .pont-checkout-loader{display:flex;min-height:150px;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#c3e9e2;font:550 13px/1.4 system-ui;text-align:center}
.pont-checkout .pont-checkout-spinner{display:block;width:36px;height:36px;border:3px solid #4e8985;border-top-color:#80f5df;border-radius:50%;animation:pont-checkout-spin .8s linear infinite}
@keyframes pont-checkout-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.pont-checkout .pont-checkout-spinner{animation-duration:1.8s}}
.pont-checkout .pont-checkout-message{min-height:19px;color:#ffd0c4;font:550 12px/1.45 system-ui;text-align:center;margin:11px auto}
.pont-checkout .pont-checkout-submit{
 display:block;width:100%;min-height:50px;margin-top:14px;border:1px solid #85e6d6;border-radius:12px;
 background:linear-gradient(135deg,#178777,#0e6058);color:#fafffe;font:750 15px/1.3 system-ui;cursor:pointer;
}
.pont-checkout .pont-checkout-submit:disabled{opacity:.5;cursor:not-allowed}
.pont-checkout .pont-checkout-note{max-width:490px;margin:15px auto 0;color:#accbc7;font:450 11px/1.5 system-ui}
@supports(height:100svh){dialog.pont-checkout[open]{height:100svh!important;min-height:100svh!important;max-height:100svh!important}}
`;
export function initPontAuctionCheckout({db,config,onFinished}){
 if(!db||!config?.url||!config?.anonKey)throw Error('Conexiune Stripe neconfigurată');
 const css=document.createElement('style');css.textContent=sheet;document.head.append(css);
 const dialog=document.createElement('dialog');dialog.className='pont-checkout';dialog.setAttribute('aria-labelledby','pontCheckoutTitle');
 dialog.innerHTML=`<div class="pont-checkout-content">
  <button type="button" class="pont-checkout-close" aria-label="Închide plata">×</button>
  <p class="pont-checkout-kicker">PLATĂ SECURIZATĂ</p>
  <h2 id="pontCheckoutTitle">Finalizează plata licitației</h2>
  <p class="pont-checkout-summary"></p>
  <form class="pont-checkout-form">
   <div class="pont-checkout-payment-stage is-loading">
    <div class="pont-checkout-loader" role="status" aria-live="polite">
     <span class="pont-checkout-spinner" aria-hidden="true"></span>
     <span>Se încarcă formularul de plată…</span>
    </div>
    <div class="pont-checkout-payment-fields">
     <div class="pont-checkout-element"></div>
     <button type="submit" class="pont-checkout-submit" disabled>Autorizează plata</button>
    </div>
   </div>
   <p class="pont-checkout-message" role="status" aria-live="polite"></p>
  </form>
  <p class="pont-checkout-note">Datele cardului sunt procesate securizat de Stripe. PONT nu le stochează.</p>
 </div>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector);
 const scrollArea=$('.pont-checkout-content'),elementHost=$('.pont-checkout-element');
 const submit=$('.pont-checkout-submit'),message=$('.pont-checkout-message');
 const paymentStage=$('.pont-checkout-payment-stage'),loader=$('.pont-checkout-loader');
 let busy=false,submitting=false,requestId=0,stripe=null,elements=null,paymentElement=null,locked=false,scrollY=0,savedStyles=null,touchY=0;
 function resetPaymentStage(){
  paymentStage.classList.add('is-loading');
  loader.hidden=false;
  submit.disabled=true;
 }
 function paymentReady(id){
  if(id!==requestId||!dialog.open)return;
  paymentStage.classList.remove('is-loading');
  loader.hidden=true;
  submit.disabled=false;
  busy=false;
  message.textContent='';
 }
 function paymentLoadError(id,error){
  if(id!==requestId||!dialog.open)return;
  loader.hidden=true;
  submit.disabled=true;
  busy=false;
  message.textContent=error?.message||'Formularul Stripe nu a putut fi încărcat. Închide și reîncearcă.';
 }
 function touchStart(event){touchY=event.touches[0]?.clientY??0}
 function blockScroll(event){
  if(!locked||!event.cancelable)return;
  if(!dialog.contains(event.target)){event.preventDefault();return}
  const delta=event.type==='touchmove'?touchY-(event.touches[0]?.clientY??touchY):event.deltaY;
  if(event.type==='touchmove')touchY=event.touches[0]?.clientY??touchY;
  // Stripe fields are in cross-origin iframes; never capture gestures inside them.
  if(event.target.closest?.('iframe'))return;
  const atTop=scrollArea.scrollTop<=0;
  const atBottom=scrollArea.scrollTop+scrollArea.clientHeight>=scrollArea.scrollHeight-1;
  if((delta<0&&atTop)||(delta>0&&atBottom))event.preventDefault();
 }
 function lock(){
  if(locked)return;
  scrollY=window.scrollY;locked=true;
  savedStyles={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,left:document.body.style.left,right:document.body.style.right,overflow:document.body.style.overflow};
  document.documentElement.classList.add('pont-checkout-locked');document.body.classList.add('pont-checkout-locked');
  Object.assign(document.body.style,{position:'fixed',top:'-'+scrollY+'px',left:'0',right:'0',width:'100%',overflow:'hidden'});
  document.addEventListener('touchstart',touchStart,{passive:true,capture:true});
  document.addEventListener('touchmove',blockScroll,{passive:false,capture:true});
  document.addEventListener('wheel',blockScroll,{passive:false,capture:true});
 }
 function unlock(){
  if(!locked)return;
  locked=false;
  document.removeEventListener('touchstart',touchStart,true);
  document.removeEventListener('touchmove',blockScroll,true);
  document.removeEventListener('wheel',blockScroll,true);
  document.documentElement.classList.remove('pont-checkout-locked');document.body.classList.remove('pont-checkout-locked');
  Object.assign(document.body.style,savedStyles||{});savedStyles=null;
  window.scrollTo(0,scrollY);
 }
 function close(){
  if(submitting){message.textContent='Plata este în curs de autorizare. Așteaptă răspunsul Stripe.';return}
  ++requestId;busy=false;
  if(paymentElement){try{paymentElement.destroy()}catch(_){}paymentElement=null}
  if(dialog.open)dialog.close();
  unlock();
 }
 $('.pont-checkout-close').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
 dialog.addEventListener('close',()=>{++requestId;busy=false;unlock()});
 function formatMonth(month){return new Intl.DateTimeFormat('ro-RO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'T12:00:00Z'))}
 function money(amount){return Number(amount).toLocaleString('ro-RO',{maximumFractionDigits:2})+' lei'}
 async function open(item){
  if(busy||submitting||dialog.open)return;
  if(!item?.restaurant_id||!/^[0-9]{4}-(0[1-9]|1[0-2])-01$/.test(item.campaign_month||''))throw Error('Datele licitației sunt invalide');
  busy=true;const id=++requestId;stripe=null;elements=null;
  if(paymentElement){try{paymentElement.destroy()}catch(_){}paymentElement=null}
  resetPaymentStage();
  message.textContent='';
  $('.pont-checkout-summary').textContent='Campania '+formatMonth(item.campaign_month)+' · '+money(item.amount);
  elementHost.replaceChildren();scrollArea.scrollTop=0;
  lock();dialog.showModal();
  try{
   const {data:{session},error:authError}=await db.auth.getSession();
   if(authError||!session?.access_token)throw Error('Sesiunea a expirat');
   if(id!==requestId||!dialog.open)return;
   const response=await fetch(config.url+'/functions/v1/pont-stripe-auctions?action=create',{
    method:'POST',headers:{authorization:'Bearer '+session.access_token,apikey:config.anonKey,'content-type':'application/json'},
    body:JSON.stringify({month:item.campaign_month,restaurantId:item.restaurant_id})
   });
   const result=await response.json();
   if(id!==requestId||!dialog.open)return;
   if(!response.ok)throw Error(result.error||'Plata nu a putut fi inițializată');
   await loadStripeJs();
   if(id!==requestId||!dialog.open)return;
   stripe=window.Stripe(result.publishableKey);
   elements=stripe.elements({clientSecret:result.clientSecret,appearance:{theme:'night',variables:{colorPrimary:'#42e5c9',colorBackground:'#072b31',colorText:'#edf9f7',borderRadius:'10px'}}});
   paymentElement=elements.create('payment',{layout:'tabs'});
   paymentElement.on('ready',()=>paymentReady(id));
   paymentElement.on('loaderror',event=>paymentLoadError(id,event?.error));
   paymentElement.mount(elementHost);
  }catch(error){if(id===requestId&&dialog.open)paymentLoadError(id,error)}
  finally{if(id===requestId&&!paymentStage.classList.contains('is-loading'))busy=false}
 }
 $('.pont-checkout-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if(busy||submitting||!stripe||!elements)return;
  busy=true;submitting=true;submit.disabled=true;
  message.textContent='Se autorizează plata…';
  try{
   const {error,paymentIntent}=await stripe.confirmPayment({elements,confirmParams:{return_url:location.origin+location.pathname},redirect:'if_required'});
   if(error)throw Error(error.message||'Plata nu a fost autorizată');
   message.textContent=paymentIntent?.status==='succeeded'
    ?'Plata a fost autorizată. Confirmarea în PONT se actualizează după notificarea Stripe.'
    :'Plata este în procesare. Verificăm confirmarea Stripe.';
   if(typeof onFinished==='function')await onFinished();
  }catch(error){message.textContent=error.message||'Plata nu a reușit';submit.disabled=false}
  finally{busy=false;submitting=false}
 });
 return {open,close,destroy(){close();dialog.remove();css.remove()},get isOpen(){return dialog.open}};
}
