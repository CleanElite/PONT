(() => {
  const order = document.querySelector('#order');
  const header = order.querySelector('.pont-menu-header');
  let previousWidth = 0;

  function pontFitRestaurantTitle(){
    const title=document.getElementById('orderTitle');
    const identity=title?.closest('.pont-menu-identity');
    if(!title||!identity||!identity.clientWidth)return;
    title.style.removeProperty('font-size');
    title.style.removeProperty('letter-spacing');
    const titleLine=title.closest('.pont-menu-title-line');
    const maxWidth=Math.max(1,Math.floor(titleLine?.getBoundingClientRect().width||identity.getBoundingClientRect().width)-8);
    const style=getComputedStyle(title);
    const baseSize=parseFloat(style.fontSize)||30;
    const weight=style.fontWeight;
    const family=style.fontFamily;
    const text=title.textContent||'';
    const canvas=pontFitRestaurantTitle.canvas||(pontFitRestaurantTitle.canvas=document.createElement('canvas'));
    const ctx=canvas.getContext('2d');
    if(!ctx)return;
    ctx.font=weight+' '+baseSize+'px '+family;
    const width=ctx.measureText(text).width;
    const desired=Math.min(baseSize,baseSize*maxWidth/Math.max(width,1));
    title.style.fontSize=Math.max(8,desired-.75)+'px';
    // Account for real glyph widths, including fonts loaded after opening.
    for(let i=0;i<3 && title.scrollWidth>maxWidth;i++){
      const current=parseFloat(getComputedStyle(title).fontSize)||desired;
      title.style.fontSize=Math.max(6,current*maxWidth/Math.max(title.scrollWidth,1)-.75)+'px';
    }
  }

  window.pontResizeRestaurantTitle = pontFitRestaurantTitle;
  document.fonts?.ready.then(() => {
    if (order.open) pontFitRestaurantTitle();
  });
  new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    if (width === previousWidth) return;
    previousWidth = width;
    if (order.open) requestAnimationFrame(pontFitRestaurantTitle);
  }).observe(header);
})();
