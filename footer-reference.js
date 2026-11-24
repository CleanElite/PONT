(()=>{'use strict';const f=document.querySelector('.pont-footer-premium-mobile');if(!f)return;const d=f.querySelector('.pfm-dialog'),title=d.querySelector('.pfm-dialog-title'),body=d.querySelector('.pfm-dialog-content');if(!d)return;const email='clean.slobozia@gmail.com';const views={
contact:['Contact PONT','<p>Contactează echipa PONT:</p><p><a href="tel:+40725693799">☎ 0725 693 799</a></p><p><a href="mailto:'+email+'">✉ '+email+'</a></p><p>Comenzile și rezervările sunt confirmate de restaurant sau organizator.</p>'],
complaint:['Reclamații și sesizări','<p>Pentru probleme privind funcționarea platformei, scrie la <a href="mailto:'+email+'?subject=Sesizare%20PONT">'+email+'</a>.</p><p>Menționează data, restaurantul sau evenimentul, descrierea problemei și, dacă există, numărul comenzii. Nu trimite parole ori date de card.</p><p>Pentru calitatea preparatelor, livrare sau rezervări, contactează restaurantul ori organizatorul responsabil.</p><p>Consultă <a href="../termeni.html">Termenii și condițiile</a> și, dacă este necesar, ANPC/SAL.</p>'],
faq:['Întrebări frecvente','<p><strong>Cum comand?</strong> Alegi restaurantul și preparatele și trimiți solicitarea prin canalul disponibil.</p><p><strong>Cine confirmă comanda?</strong> Restaurantul, direct.</p><p><strong>Pot modifica sau anula?</strong> Contactează direct restaurantul, folosind numărul comenzii dacă există.</p><p><strong>Cine stabilește prețul și disponibilitatea?</strong> Restaurantul care publică oferta.</p><p><strong>Cum particip la evenimente?</strong> Contactează organizatorul pentru confirmare și rezervare.</p><p><strong>Cum contactez PONT?</strong> Folosește secțiunea Contact din footer.</p>']
};f.querySelectorAll('[data-pfm-dialog]').forEach(b=>b.addEventListener('click',()=>{const v=views[b.dataset.pfmDialog];if(!v)return;title.textContent=v[0];body.innerHTML=v[1];if(!d.open)d.showModal()}));f.querySelector('.pfm-close')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});f.querySelector('[data-pfm-cookies]')?.addEventListener('click',()=>{window.dispatchEvent(new Event('pont:open-cookie-settings'));const b=document.getElementById('pontGlobalPrivacyBanner');if(b)b.hidden=false;else location.href='../cookies.html'})})();

(() => {
  const footer = document.querySelector('footer.pont-footer-premium-mobile');
  if (!footer) return;
  const groups = footer.querySelector('.pfm-grid');
  const art = document.createElement('div');
  art.className = 'pont-footer-art';
  const panels = [
    ['Informații legale', [427,164,361,345], '.pfm-column:nth-child(2) nav > *', [[437,253,344,62],[437,315,344,55],[437,370,344,58],[437,428,344,61]]],
    ['Asistență', [797,164,324,345], '.pfm-column:nth-child(3) nav > *', [[813,260,299,68],[813,342,299,67],[813,426,299,67]]],
    ['Protecția consumatorilor', [1131,242,392,278], '.pfm-authorities a', [[1144,258,365,122],[1144,400,365,106]]]
  ];
  for (const [label,[x,y,w,h],selector,areas] of panels) {
    const panel = document.createElement('section');
    panel.setAttribute('aria-label',label);
    panel.className = 'pont-art-panel';
    Object.entries({x:x/1536*100+'%', y:y/865*100+'%',w:w/1536*100+'%', h:h/865*100+'%', ratio:w+'/'+h,
      size:1536/w*100+'% '+865/h*100+'%', pos:x/(1536-w)*100+'% '+y/(865-h)*100+'%'}).forEach(([k,v])=>panel.style.setProperty('--'+k,v));
    const controls = groups.querySelectorAll(selector);
    if (controls.length !== areas.length) return;
    controls.forEach((original,i) => {
      const [left,top,width,height] = areas[i];
      const control = document.createElement(original.tagName);
      if(original.matches('a')){
        control.href=original.href;control.target=original.target;control.rel=original.rel;
      }else{
        control.type='button';control.addEventListener('click',()=>original.click());
      }
      const name=original.getAttribute('aria-label') || original.textContent.replace(/[▤♢◉⚙☏ⓘ✉›]/g,'').trim();
      control.setAttribute('aria-label',name);
      control.style.cssText='left:'+(left-x)/w*100+'%;top:'+(top-y)/h*100+'%;width:'+width/w*100+'%;height:'+height/h*100+'%;';
      panel.append(control);
    });
    art.append(panel);
  }
  const copyright = document.createElement('small');
  copyright.textContent=footer.querySelector('.pfm-bottom').textContent;
  art.append(copyright);
  footer.insertBefore(art,groups);
})();

// Desktop uses the same photograph as the mobile artwork. Sample each detail
// independently so wide screens can expand the composition without stretching type.
(() => {
  const art = document.querySelector('.pont-footer-art');
  if (!art) return;
  function sample(node, x, y, w, h) {
    node.style.setProperty('--crop-size', (1536 / w * 100) + '% ' + (865 / h * 100) + '%');
    node.style.setProperty('--crop-at', (x / (1536 - w) * 100) + '% ' + (y / (865 - h) * 100) + '%');
    node.style.setProperty('--crop-ratio', w + '/' + h);
  }
  function detail(parent, rect, label) {
    const node = document.createElement('span');
    node.className = 'pf-photo-detail';
    if (label) { node.setAttribute('role', 'img'); node.setAttribute('aria-label', label); }
    else node.setAttribute('aria-hidden', 'true');
    sample(node, ...rect);
    parent.prepend(node);
  }
  const panels = art.querySelectorAll('.pont-art-panel');
  const rows = [
    [[450,263,321,42],[450,321,321,43],[450,377,321,44],[450,436,321,44]],
    [[811,257,303,72],[811,339,303,72],[811,423,303,72]],
    [[1140,255,372,130],[1141,397,370,112]]
  ];
  panels.forEach((panel,i) => {
    [...panel.children].forEach((link,j) => sample(link,...rows[i][j]));
    if (i === 0) detail(panel,[449,183,303,52]);
    if (i === 1) detail(panel,[827,182,236,55]);
  });
  const brand = document.createElement('section');
  brand.className = 'pf-photo-brand';
  art.prepend(brand);
  detail(brand,[112,137,241,110],'PONT');
  brand.firstElementChild.style.filter = 'url(#pf-clear-logo)';
  // Key out the dark photographic backing while retaining the original mark and glow.
  art.insertAdjacentHTML('beforeend', `<svg aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="pf-clear-logo" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  .3 2.1 .6 0 -.50"/>
    </filter></defs>
  </svg>`);
  const source = art.parentElement.querySelector('.pfm-brand');
  for (const [selector, name] of [['.pfm-location','city'], ['.pfm-services','services'], ['p','description']]) {
    const line = document.createElement('span');
    line.className = 'pf-photo-' + name;
    line.textContent = source.querySelector(selector).textContent;
    brand.append(line);
  }
})();
