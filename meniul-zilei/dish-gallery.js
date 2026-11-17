(() => {
  const gallery = document.querySelector('#pontDishGallery');
  const viewport = gallery.querySelector('.pont-dish-gallery__viewport');
  const track = gallery.querySelector('.pont-dish-gallery__track');
  const arrows = [...gallery.querySelectorAll('[data-gallery-step]')];
  const menu = gallery.closest('dialog');
  const checkout = document.querySelector('#pontCheckoutOverlay');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scriptUrl = document.currentScript.src;
  const assets = new URL('../assets/', scriptUrl);
  const sprite = new URL('../admin-icons.svg?v=1#fork-knife', scriptUrl);
  const labelByCourse = { first: 'Felul 1', second: 'Felul 2' };
  const referencePhotos = new Map([
    ['ciorba de burta', 'pont-dish-ciorba-burta.webp'],
    ['supa de pui cu taitei', 'pont-dish-supa-taitei.webp'],
    ['snitel de pui cu piure', 'pont-dish-snitel-piure.webp'],
    ['musaca de cartofi', 'pont-dish-musaca.webp']
  ]);
  const pixelsPerSecond = 14;
  // The content is triplicated: one cycle on either side of the displayed cycle.
  // This permits long continuous drags in either direction without a hard edge.
  let cycleWidth = 0;
  let offset = 0;
  let frameId = 0;
  let lastFrameTime = 0;
  let resumeTimer = 0;
  let drag = null;

  const normalize = value => cycleWidth ? ((value % cycleWidth) + cycleWidth) % cycleWidth : 0;
  const hasKeyboardFocus = () => gallery.contains(document.activeElement) && document.activeElement.matches(':focus-visible');

  function paint() {
    if (!cycleWidth) return;
    // The middle sequence is always the visible starting point.
    track.style.transform = `translate3d(${-cycleWidth - normalize(offset)}px, 0, 0)`;
  }

  function canAutoPlay() {
    return cycleWidth > 0 && menu.open && !checkout.open && !document.hidden &&
      !reducedMotion.matches && !hasKeyboardFocus() && !drag && !resumeTimer;
  }

  function tick(now) {
    frameId = 0;
    if (!canAutoPlay()) {
      lastFrameTime = 0;
      return;
    }
    if (lastFrameTime) {
      // The cap prevents an unexpected jump after a suspended background frame.
      offset += Math.min(now - lastFrameTime, 64) * pixelsPerSecond / 1000;
      paint();
    }
    lastFrameTime = now;
    frameId = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (!canAutoPlay()) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrameTime = 0;
      return;
    }
    if (!frameId) {
      lastFrameTime = 0;
      frameId = requestAnimationFrame(tick);
    }
  }

  function measureLoop() {
    const first = track.firstElementChild;
    const next = first?.nextElementSibling;
    if (!next || !viewport.clientWidth) return;
    const width = next.getBoundingClientRect().left - first.getBoundingClientRect().left;
    if (width <= 0 || Math.abs(width - cycleWidth) < .5) return;
    const progress = cycleWidth ? normalize(offset) / cycleWidth : 0;
    cycleWidth = width;
    offset = progress * width;
    paint();
    syncPlayback();
  }

  function resumeAfterInteraction() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      resumeTimer = 0;
      syncPlayback();
    }, 1100);
    syncPlayback();
  }

  function moveByCard(direction) {
    if (!cycleWidth) return;
    const card = track.querySelector('.pont-dish-gallery__item');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(card.parentElement).gap) || 0;
    offset += direction * (card.getBoundingClientRect().width + gap);
    paint();
    resumeAfterInteraction();
  }

  viewport.addEventListener('pointerdown', event => {
    if (!cycleWidth || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    drag = { id: event.pointerId, x: event.clientX };
    gallery.dataset.dragging = '';
    syncPlayback();
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    // Incremental movement avoids accumulated touch offsets and wrap-around jumps.
    offset -= event.clientX - drag.x;
    drag.x = event.clientX;
    paint();
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    delete gallery.dataset.dragging;
    resumeAfterInteraction();
  }

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    viewport.addEventListener(type, endDrag);
  }

  arrows.forEach(arrow => arrow.addEventListener('click', () => moveByCard(Number(arrow.dataset.galleryStep))));
  viewport.addEventListener('keydown', event => {
    if (!cycleWidth || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    moveByCard(event.key === 'ArrowLeft' ? -1 : 1);
  });

  gallery.addEventListener('focusin', syncPlayback);
  gallery.addEventListener('focusout', () => queueMicrotask(syncPlayback));
  reducedMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  const dialogState = new MutationObserver(syncPlayback);
  dialogState.observe(menu, { attributeFilter: ['open'] });
  dialogState.observe(checkout, { attributeFilter: ['open'] });
  new ResizeObserver(measureLoop).observe(viewport);

  track.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.dataset.referencePhoto) {
      image.remove();
      return;
    }
    image.src = image.dataset.referencePhoto;
    image.title = 'Fotografie ilustrativă';
    delete image.dataset.referencePhoto;
  }, true);

  function makeDishCard(dish, eager) {
    const card = document.createElement('div');
    card.className = 'pont-dish-gallery__item';
    card.setAttribute('role', 'listitem');
    card.toggleAttribute('data-sold-out', !dish.available);

    const photo = document.createElement('div');
    photo.className = 'pont-dish-gallery__photo';
    const placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', sprite.href);
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.append(use);
    photo.append(placeholder);

    const normalized = dish.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
    const reference = referencePhotos.get(normalized);
    const published = /^https?:\/\//i.test(dish.photo_url ?? '') ? dish.photo_url : '';
    if (published || reference) {
      const image = document.createElement('img');
      image.alt = '';
      image.draggable = false;
      image.width = 124;
      image.height = 124;
      image.loading = eager ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (published && reference) image.dataset.referencePhoto = new URL(reference, assets).href;
      if (!published) image.title = 'Fotografie ilustrativă';
      image.src = published || new URL(reference, assets).href;
      photo.append(image);
    }

    const name = document.createElement('strong');
    const text = document.createElement('span');
    name.className = 'pont-dish-gallery__name';
    name.title = dish.name;
    text.textContent = dish.name;
    name.append(text);

    const course = document.createElement('span');
    course.className = 'pont-dish-gallery__course';
    course.textContent = labelByCourse[dish.category] + (dish.available ? '' : ' · Epuizat');
    card.append(photo, name, course);
    return card;
  }

  // A repeatable visual cue: the beginning of today's dish sequence.
  // Its copy at the loop seam makes the reset legible without interrupting the animation.
  function makeCycleStartMarker() {
    const marker = document.createElement('div');
    marker.className = 'pont-dish-gallery__cycle-start';
    marker.setAttribute('aria-hidden', 'true');
    marker.innerHTML = '<span class="pont-dish-gallery__cycle-line"></span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" focusable="false">' +
      '<path d="M7 5c-2-2 2-3 0-5M12 5c-2-2 2-3 0-5M17 5c-2-2 2-3 0-5" transform="translate(0 2)"/>' +
      '<path d="M4 11h16l-1.5 5.5a5 5 0 0 1-4.8 3.5h-3.4a5 5 0 0 1-4.8-3.5L4 11Z"/>' +
      '<path d="M2 21h20"/>' +
      '</svg>' +
      '<span class="pont-dish-gallery__cycle-line"></span>';
    return marker;
  }

  window.pontRenderDishGallery = dishes => {
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    drag = null;
    delete gallery.dataset.dragging;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrameTime = 0;
    cycleWidth = 0;
    offset = 0;
    track.style.transform = '';
    track.replaceChildren();

    const [first, second] = Object.keys(labelByCourse).map(category =>
      dishes.filter(dish => dish.category === category && dish.name.trim())
    );
    const cards = [...first.slice(0, 2), ...second.slice(0, 2), ...first.slice(2), ...second.slice(2)];
    const loops = cards.length >= 4;
    gallery.hidden = !cards.length;
    gallery.toggleAttribute('data-loop', loops);
    viewport.tabIndex = loops ? 0 : -1;
    arrows.forEach(arrow => { arrow.hidden = !loops; });
    if (!cards.length) return;

    const sequence = document.createElement('div');
    sequence.className = 'pont-dish-gallery__sequence';
    sequence.setAttribute('role', 'list');
    // The gold cooking-pot marker precedes the first Felul 1, once per cycle.
    sequence.append(makeCycleStartMarker(), ...cards.map((dish, index) => makeDishCard(dish, index < 4)));
    track.append(sequence);
    if (loops) {
      const before = sequence.cloneNode(true);
      const after = sequence.cloneNode(true);
      for (const copy of [before, after]) {
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('img').forEach(image => { image.loading = 'lazy'; });
      }
      track.replaceChildren(before, sequence, after);
    }
    measureLoop();
  };
})();
