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
  let animation = null;
  let cycleWidth = 0;
  let resumeTimer = 0;
  let drag = null;

  const position = () => ((animation?.currentTime ?? 0) * pixelsPerSecond / 1000) % cycleWidth;
  const hasKeyboardFocus = () => gallery.contains(document.activeElement) && document.activeElement.matches(':focus-visible');

  function syncPlayback() {
    if (!animation) return;
    const canPlay = menu.open && !checkout.open && !document.hidden &&
      !reducedMotion.matches && !hasKeyboardFocus() && !drag && !resumeTimer;
    if (canPlay) animation.play();
    else animation.pause();
  }

  function seek(pixels) {
    const wrapped = ((pixels % cycleWidth) + cycleWidth) % cycleWidth;
    animation.pause();
    animation.currentTime = wrapped * 1000 / pixelsPerSecond;
  }

  function measureLoop() {
    const first = track.firstElementChild;
    const copy = first?.nextElementSibling;
    if (!copy || !viewport.clientWidth) return;
    const width = copy.getBoundingClientRect().left - first.getBoundingClientRect().left;
    if (width <= 0 || width === cycleWidth) return;

    const progress = cycleWidth ? position() / cycleWidth : 0;
    animation?.cancel();
    cycleWidth = width;
    animation = track.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(${-cycleWidth}px, 0, 0)` }
    ], { duration: cycleWidth * 1000 / pixelsPerSecond, iterations: Infinity, easing: 'linear' });
    seek(progress * cycleWidth);
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
    if (!animation) return;
    const card = track.querySelector('.pont-dish-gallery__item');
    const width = cycleWidth / card.parentElement.childElementCount;
    seek(position() + direction * width);
    resumeAfterInteraction();
  }

  viewport.addEventListener('pointerdown', event => {
    if (!animation || !event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, offset: position() };
    gallery.dataset.dragging = '';
    syncPlayback();
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) seek(drag.offset + drag.x - event.clientX);
  });

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
    if (!animation || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
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

  window.pontRenderDishGallery = dishes => {
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    drag = null;
    delete gallery.dataset.dragging;
    animation?.cancel();
    animation = null;
    cycleWidth = 0;
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
    sequence.append(...cards.map((dish, index) => makeDishCard(dish, index < 4)));
    track.append(sequence);
    if (loops) {
      const copy = sequence.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('img').forEach(image => { image.loading = 'lazy'; });
      track.append(copy);
    }
    measureLoop();
  };
})();
