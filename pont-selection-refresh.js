(() => {
  const entry = document.querySelector('.entry');
  const indicator = document.querySelector('.pont-pull-indicator');
  const dragStart = 12;
  const refreshDistance = 80;
  let gesture;
  let suppressClick = false;

  function resetGesture() {
    gesture = undefined;
    entry.classList.remove('is-pulling');
    entry.style.removeProperty('--pull-offset');
    delete indicator.dataset.state;
    indicator.style.removeProperty('--pull-progress');
  }

  function canRefresh(event) {
    const distance = event.clientY - gesture.y;
    const sideways = Math.abs(event.clientX - gesture.x);
    return distance >= refreshDistance && distance > sideways;
  }

  entry.addEventListener('pointerdown', event => {
    if (!event.isPrimary) {
      if (event.pointerType === 'touch' && gesture) {
        suppressClick = true;
        resetGesture();
      }
      return;
    }
    if (event.button !== 0) return;
    suppressClick = false;
    if (entry.inert || document.querySelector('dialog[open], .pont-global-consent:not([hidden])')) return;
    if (event.target.closest('button, input, .pont-admin-entry')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, pulling: false };
  });

  entry.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const distance = event.clientY - gesture.y;
    const sideways = Math.abs(event.clientX - gesture.x);

    if (!gesture.pulling) {
      if (Math.max(Math.abs(distance), sideways) < dragStart) return;
      suppressClick = true;
      if (distance < dragStart || distance <= sideways) {
        resetGesture();
        return;
      }

      gesture.pulling = true;
      entry.setPointerCapture(event.pointerId);
      entry.classList.add('is-pulling');
    }

    entry.style.setProperty('--pull-offset', `${Math.min(20, Math.max(0, distance) / 4)}px`);
    const progress = distance > sideways ? Math.min(1, distance / refreshDistance) : 0;
    indicator.style.setProperty('--pull-progress', `${progress * 100}%`);
    indicator.dataset.state = canRefresh(event) ? 'ready' : 'pulling';
  });

  entry.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    const refresh = gesture.pulling && canRefresh(event);
    resetGesture();
    if (!refresh) return;
    indicator.dataset.state = 'refreshing';
    try { sessionStorage.setItem('pont-selection-refresh', '1'); } catch {}
    location.reload();
  });

  function cancel(event) {
    if (gesture?.id === event.pointerId) resetGesture();
  }

  entry.addEventListener('pointercancel', cancel);
  // Touch first captures on the pressed child, then transfers capture to the page.
  entry.addEventListener('lostpointercapture', event => {
    if (event.target === entry) cancel(event);
  });
  entry.addEventListener('pointerleave', event => {
    if (!gesture?.pulling) cancel(event);
  });
  entry.addEventListener('dragstart', event => event.preventDefault());
  window.addEventListener('click', event => {
    if (suppressClick && event.detail && entry.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
