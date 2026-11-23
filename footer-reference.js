
(()=>{const f=document.querySelector('.pont-footer-premium-mobile');if(!f)return;const d=f.querySelector('.pfm-dialog'),title=d.querySelector('.pfm-dialog-title'),body=d.querySelector('.pfm-dialog-content');const views={contact:['Contact','<p>Contactează echipa PONT:</p><p><a href="tel:+40725693799">☎ 0725 693 799</a></p><p><a href="mailto:clean.slobozia@gmail.com">✉ clean.slobozia@gmail.com</a></p>'],complaint:['Reclamații','<p>Pentru sesizări privind funcționarea platformei PONT, trimite un email la <a href="mailto:clean.slobozia@gmail.com?subject=Reclamatie%20PONT">clean.slobozia@gmail.com</a> sau sună la <a href="tel:+40725693799">0725 693 799</a>.</p><p>Pentru produse, comenzi sau rezervări, contactează mai întâi restaurantul sau organizatorul responsabil. Poți consulta și <a href="../termeni.html">Termenii și condițiile</a>.</p>'],faq:['Întrebări frecvente','<p><strong>Cum comand?</strong> Alegi restaurantul și trimiți solicitarea prin WhatsApp sau telefon, conform opțiunilor disponibile.</p><p><strong>Cine confirmă comanda sau rezervarea?</strong> Restaurantul sau organizatorul, direct.</p><p><strong>Unde reclam o problemă?</strong> Folosește secțiunea Reclamații sau Contact.</p><p>Mai multe informații în <a href="../termeni.html">Termeni și condiții</a>.</p>']};f.querySelectorAll('[data-pfm-dialog]').forEach(b=>b.addEventListener('click',()=>{const v=views[b.dataset.pfmDialog];title.textContent=v[0];body.innerHTML=v[1];d.showModal()}));f.querySelector('.pfm-close').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});f.querySelector('[data-pfm-cookies]').addEventListener('click',()=>{const t=f.querySelector('[data-pont-cookie-settings]');if(t)t.click();else{const b=document.getElementById('pontGlobalPrivacyBanner');if(b)b.hidden=false;else location.href='../cookies.html'}})})();

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
