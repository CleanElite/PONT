// The period is one complete message. Keep enough copies for the visible width.
const pixelsPerSecond = 42;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const rail of document.querySelectorAll('[data-pont-ad] .ad-rail')) {
  const message = rail.firstElementChild;
  const viewport = rail.parentElement;
  let movement;
  let lastWidth;
  function fit() {
    const width = message.getBoundingClientRect().width;
    if (!width || !viewport.clientWidth) return;
    const copies = Math.ceil(viewport.clientWidth / width) + 1;
    while (rail.childElementCount < copies) rail.append(message.cloneNode(true));
    while (rail.childElementCount > copies) rail.lastElementChild.remove();
    if (lastWidth === width && Boolean(movement) === !reducedMotion.matches) return;
    const elapsed = Number(movement?.currentTime || 0);
    movement?.cancel();
    movement = null;
    lastWidth = width;
    if (!reducedMotion.matches) {
      movement = rail.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-' + width + 'px)' }],
        { duration: width * 1000 / pixelsPerSecond, iterations: Infinity, easing: 'linear' });
      movement.currentTime = elapsed;
    }
  }
  const observer = new ResizeObserver(fit);
  observer.observe(viewport);
  observer.observe(message);
  reducedMotion.addEventListener('change', fit);
  fit();
}
