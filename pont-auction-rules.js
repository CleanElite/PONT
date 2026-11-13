export const AUCTION_RULES_VERSION='pont-licitatii-2026-11-13';
export function initPontAuctionRules(){
 const style=document.createElement('style');
 style.textContent=`
 .pont-rules-trigger{display:inline-flex;justify-content:center;align-items:center;min-height:36px;padding:8px 13px;border:1px solid #bc9e68;border-radius:10px;background:#103337;color:#f7e1ad;font:650 12px/1.3 system-ui;cursor:pointer}
 .pont-rules-slot{display:flex;justify-content:center;margin:12px auto}
 dialog.pont-rules-dialog[open]{position:fixed;inset:0;box-sizing:border-box;width:min(650px,calc(100vw - 20px));max-width:calc(100vw - 20px);max-height:88dvh;margin:auto;padding:0;border:1px solid #72978d;border-radius:18px;background:#0a292e;color:#e6f2ee;overflow:hidden;z-index:2147483647}
 dialog.pont-rules-dialog::backdrop{background:#000c;backdrop-filter:blur(4px)}
 .pont-rules-head{position:relative;padding:18px 54px 15px 17px;border-bottom:1px solid #4a736c}
 .pont-rules-head small{color:#dfc18b;letter-spacing:.1em}.pont-rules-head h2{color:#fff;font:500 27px/1.2 Georgia,serif;margin:5px 0 0}
 .pont-rules-close{position:absolute;right:12px;top:13px;width:36px;height:36px;border:1px solid #678e86;border-radius:50%;background:#153a3f;color:white;font-size:22px}
 .pont-rules-body{max-height:calc(88dvh - 145px);overflow-y:auto;overscroll-behavior:contain;padding:14px 18px 22px;text-align:left;font:400 13px/1.6 system-ui}
 .pont-rules-body h3{color:#f1d29c;font:700 14px/1.3 system-ui;margin:16px 0 5px}.pont-rules-body p{margin:0 0 7px}
 .pont-rules-body a{color:#a8e8dc}.pont-rules-footer{padding:11px;border-top:1px solid #436d65;text-align:center}
 .pont-rules-done{min-height:40px;padding:8px 25px;border:1px solid #92ddc9;border-radius:10px;background:#13796d;color:white}
 .pont-rules-accept{display:flex!important;align-items:flex-start!important;gap:10px!important;text-align:left!important;margin:13px 0!important;color:#f2f4ef!important;font:550 12px/1.5 system-ui!important;cursor:pointer!important}
 .pont-rules-accept input{flex:none!important;appearance:auto!important;-webkit-appearance:checkbox!important;width:19px!important;height:19px!important;margin:0!important;accent-color:#90d9c8!important}
 #bidForm .pont-rules-warning{margin:0 0 10px!important;min-height:0!important;text-align:left!important}#bidForm .pont-rules-accept{margin-top:17px!important;margin-bottom:7px!important}.pont-rules-warning{color:#ffd2ba;font:550 11px/1.4 system-ui}
 `;
 document.head.append(style);
 const dialog=document.createElement('dialog');dialog.className='pont-rules-dialog';dialog.setAttribute('aria-labelledby','pontRulesTitle');
 dialog.innerHTML=`<header class="pont-rules-head"><small>PONT · 13.11.2026</small><h2 id="pontRulesTitle">Regulament licitație</h2><button type="button" class="pont-rules-close" aria-label="Închide">×</button></header><div class="pont-rules-body">
 <h3>1. Participanți</h3><p>Participă restaurantele partenere PONT, prin conturi autentificate și autorizate.</p>
 <h3>2. Scop</h3><p>Licitația stabilește poziții de promovare. O ofertă nu garantează comenzi, vizualizări, venituri sau o poziție fixă înainte de închidere.</p>
 <h3>3. Valoarea ofertei</h3><p>Oferta minimă este <strong>50 lei</strong>. Se licitează în multipli de 10 lei. O ofertă poate fi majorată, redusă până la minimum 50 lei sau retrasă cât licitația este activă. Modificările sunt interzise în pauză și după închidere.</p>
 <h3>4. Departajare</h3><p>Oferta mai mare are prioritate. <strong>La egalitate câștigă prioritatea restaurantul care a licitat primul în campania respectivă.</strong> Modificarea sumei nu schimbă data inițială; retragerea și revenirea creează o dată nouă.</p>
 <h3>5. Administrare</h3><p>Administratorul PONT poate deschide, suspenda, relua și închide licitația. Clasamentul rămâne provizoriu până la închidere, când se definitivează pozițiile disponibile.</p>
 <h3>6. Plată</h3><p><strong>Nu se solicită și nu se autorizează nicio plată înainte ca administratorul să încheie licitația.</strong> După încheiere, numai restaurantele câștigătoare pot achita suma finală licitată prin metoda afișată. Ofertele achitate nu mai pot fi modificate.</p>
 <h3>7. Neplată și rambursări</h3><p>Termenele concrete de plată, consecințele neplății, anularea și rambursările trebuie stabilite și comunicate în condițiile contractuale B2B înainte de prima încasare. Neplata poate determina pierderea poziției, conform condițiilor acceptate; se respectă drepturile legale aplicabile.</p>
 <h3>8. Conduită</h3><p>Se interzic ofertele frauduloase și utilizarea conturilor fără autorizare. Sunt posibile măsuri de protejare a integrității licitației conform contractului și legii.</p>
 <h3>9. Acceptare</h3><p>La fiecare ofertă sau modificare se solicită acceptare explicită. PONT înregistrează contul, restaurantul, suma, campania, momentul și versiunea regulamentului.</p>
 <h3>10. Alte condiții</h3><p>Se aplică și <a href="../termeni.html" target="_blank" rel="noopener">Termenii și condițiile PONT</a>. Condițiile contractuale pentru plata și rambursarea ofertelor necesită verificare juridică înainte de încasările reale.</p>
 </div><footer class="pont-rules-footer"><button type="button" class="pont-rules-done">Am înțeles</button></footer>`;
 document.body.append(dialog);
 function addButton(parent){if(!parent)return;const slot=document.createElement('div');slot.className='pont-rules-slot';const button=document.createElement('button');button.type='button';button.className='pont-rules-trigger';button.textContent='Regulament licitație';button.onclick=()=>{if(!dialog.open)dialog.showModal()};slot.append(button);parent.append(slot)}
 addButton(document.getElementById('customer'));
 addButton(document.getElementById('auctionModalExplainer')?.parentElement);
 const form=document.getElementById('bidForm'),submit=document.getElementById('bidSubmit');
 const label=document.createElement('label');
 label.className='pont-rules-accept';
 label.innerHTML='<input type="checkbox" id="pontAuctionConsent"><span>Accept termenii și condițiile, am citit regulamentul.</span>';
 const warning=document.createElement('p');
 warning.className='pont-rules-warning';warning.id='pontAuctionConsentWarning';warning.setAttribute('role','alert');warning.setAttribute('aria-live','polite');
 if(form&&submit){form.insertBefore(label,submit);form.insertBefore(warning,submit)}
 const checkbox=label.querySelector('input');
 checkbox.addEventListener('change',()=>{warning.textContent='';document.getElementById('bidMessage').textContent=''});
 dialog.querySelector('.pont-rules-close').onclick=()=>dialog.close();
 dialog.querySelector('.pont-rules-done').onclick=()=>dialog.close();
 return {
  resetConsent(){checkbox.checked=false;warning.textContent=''},
  isAccepted(){return checkbox.checked},
  showConsentError(){
   const text='Bifează că ai luat la cunoștință și accepți termenii și regulamentul licitației.';
   warning.textContent=text;
   const message=document.getElementById('bidMessage');
   if(message)message.textContent=text;
   checkbox.focus({preventScroll:true});
  }
 };
}
