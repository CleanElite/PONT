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
    ['ciorba de burta', 'pont-dish-ciorba-burta-20261117.jpg'],
    ['supa de pui cu taitei', 'pont-dish-supa-taitei-20261117.jpg'],
    ['snitel de pui cu piure', 'pont-dish-snitel-piure-20261117.jpg'],
    ['musaca de cartofi', 'pont-dish-musaca-20261117.jpg']
  ]);
  // The carousel is finite: the autoplay gently reverses at each real end.
  const pixelsPerSecond = 14;
  let maxOffset = 0;
  let offset = 0;
  let direction = 1;
  let frameId = 0;
  let lastFrameTime = 0;
  let resumeTimer = 0;
  let drag = null;

  const clampOffset = value => Math.max(0, Math.min(maxOffset, value));
  const hasKeyboardFocus = () => gallery.contains(document.activeElement) && document.activeElement.matches(':focus-visible');

  function paint() {
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    arrows.forEach(arrow => {
      const left = Number(arrow.dataset.galleryStep) < 0;
      arrow.disabled = maxOffset < 1 || (left ? offset < .5 : offset >= maxOffset - .5);
    });
  }

  function canAutoPlay() {
    return maxOffset > 1 && menu.open && !checkout.open && !document.hidden &&
      !reducedMotion.matches && !hasKeyboardFocus() && !drag && !resumeTimer;
  }

  function tick(now) {
    frameId = 0;
    if (!canAutoPlay()) {
      lastFrameTime = 0;
      return;
    }
    if (lastFrameTime) {
      let next = offset + direction * Math.min(now - lastFrameTime, 64) * pixelsPerSecond / 1000;
      // Reflect at the bounds instead of jumping back to a cloned sequence.
      if (next >= maxOffset) {
        next = maxOffset - (next - maxOffset);
        direction = -1;
      } else if (next <= 0) {
        next = -next;
        direction = 1;
      }
      offset = clampOffset(next);
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

  function measureTrack() {
    if (!viewport.clientWidth || !track.firstElementChild) return;
    maxOffset = Math.max(0, track.firstElementChild.scrollWidth - viewport.clientWidth);
    offset = clampOffset(offset);
    if (offset >= maxOffset - .5) direction = -1;
    if (offset <= .5) direction = 1;
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

  function moveByCard(step) {
    if (maxOffset < 1) return;
    const card = track.querySelector('.pont-dish-gallery__item');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(card.parentElement).gap) || 0;
    offset = clampOffset(offset + step * (card.getBoundingClientRect().width + gap));
    direction = offset >= maxOffset - .5 ? -1 : offset <= .5 ? 1 : step;
    paint();
    resumeAfterInteraction();
  }

  viewport.addEventListener('pointerdown', event => {
    if (!maxOffset || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    drag = { id: event.pointerId, x: event.clientX };
    gallery.dataset.dragging = '';
    syncPlayback();
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    offset = clampOffset(offset - delta);
    if (Math.abs(delta) > .2) direction = delta < 0 ? 1 : -1;
    drag.x = event.clientX;
    paint();
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    delete gallery.dataset.dragging;
    if (offset >= maxOffset - .5) direction = -1;
    else if (offset <= .5) direction = 1;
    resumeAfterInteraction();
  }

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    viewport.addEventListener(type, endDrag);
  }

  arrows.forEach(arrow => arrow.addEventListener('click', () => moveByCard(Number(arrow.dataset.galleryStep))));
  viewport.addEventListener('keydown', event => {
    if (maxOffset < 1 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    moveByCard(event.key === 'ArrowLeft' ? -1 : 1);
  });

  gallery.addEventListener('focusin', syncPlayback);
  gallery.addEventListener('focusout', () => queueMicrotask(syncPlayback));
  reducedMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  new MutationObserver(syncPlayback).observe(menu, { attributeFilter: ['open'] });
  new MutationObserver(syncPlayback).observe(checkout, { attributeFilter: ['open'] });
  new ResizeObserver(measureTrack).observe(viewport);

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

  function makeEdge() {
    const edge = document.createElement('span');
    edge.className = 'pont-dish-gallery__edge';
    edge.setAttribute('aria-hidden', 'true');
    return edge;
  }

  function makeCourseDivider() {
    const divider = document.createElement('div');
    divider.className = 'pont-dish-gallery__course-divider';
    divider.setAttribute('aria-hidden', 'true');
    const first = document.createElement('span');
    first.className = 'pont-dish-gallery__divider-ribbon pont-dish-gallery__divider-ribbon--first';
    first.textContent = '‹ Felul 1';
    const emblem = document.createElement('span');
    emblem.className = 'pont-dish-gallery__divider-emblem';
    emblem.innerHTML = '<svg viewBox="0 0 44 36" aria-hidden="true" focusable="false">' +
      '<path d="M16 7c-4-4 5-4 1-9M23 8c-4-4 5-5 1-10M30 7c-4-4 5-4 1-9" transform="translate(0 4)"/>' +
      '<path d="M4 26h36M7 25a15 15 0 0 1 30 0M3 29h38M20 9h4"/>' +
      '</svg>';
    const second = document.createElement('span');
    second.className = 'pont-dish-gallery__divider-ribbon pont-dish-gallery__divider-ribbon--second';
    second.textContent = 'Felul 2 ›';
    divider.append(first, emblem, second);
    return divider;
  }

  window.pontRenderDishGallery = dishes => {
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    drag = null;
    delete gallery.dataset.dragging;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrameTime = 0;
    maxOffset = 0;
    offset = 0;
    direction = 1;
    track.style.transform = '';
    track.replaceChildren();

    const first = dishes.filter(dish => dish.category === 'first' && dish.name.trim());
    const second = dishes.filter(dish => dish.category === 'second' && dish.name.trim());
    const cards = [...first, ...second];
    gallery.hidden = !cards.length;
    if (!cards.length) return;

    const sequence = document.createElement('div');
    sequence.className = 'pont-dish-gallery__sequence';
    sequence.setAttribute('role', 'list');
    sequence.append(makeEdge());
    first.forEach((dish, index) => sequence.append(makeDishCard(dish, index < 4)));
    if (first.length && second.length) sequence.append(makeCourseDivider());
    second.forEach((dish, index) => sequence.append(makeDishCard(dish, first.length + index < 4)));
    sequence.append(makeEdge());
    track.append(sequence);
    gallery.removeAttribute('data-loop');
    viewport.tabIndex = 0;
    // The ends and the available distance can change when images/fonts finish loading.
    measureTrack();
  };
})();
