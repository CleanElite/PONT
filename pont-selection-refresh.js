(() => {
  const entry = document.querySelector('.entry');
  const status = document.querySelector('.pont-pull-status');
  const threshold = 80;
  let gesture;
  let dragged = false;

  entry.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    dragged = false;
    if (entry.inert || document.querySelector('dialog[open], .pont-global-consent:not([hidden])')) return;
    if (event.target.closest('button, input, .pont-admin-entry')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  entry.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const distance = event.clientY - gesture.y;
    const sideways = Math.abs(event.clientX - gesture.x);
    if (!dragged && ((sideways > 14 && sideways > distance) || distance < -14)) {
      gesture = undefined;
      return;
    }
    if (!dragged && distance < 14) return;
    if (!dragged) entry.setPointerCapture(event.pointerId);
    dragged = true;
    gesture.ready = distance >= threshold;
    status.textContent = gesture.ready ? 'Eliberează pentru reîmprospătare' : 'Trage în jos pentru reîmprospătare';
  });

  function finish(event) {
    if (gesture?.id !== event.pointerId) return;
    const refresh = event.type === 'pointerup' && gesture.ready && event.clientY - gesture.y >= threshold;
    gesture = undefined;
    status.textContent = refresh ? 'Se reîmprospătează…' : '';
    if (refresh) {
      try { sessionStorage.setItem('pont-selection-refresh', '1'); } catch {}
      location.reload();
    }
  }

  entry.addEventListener('pointerup', finish);
  entry.addEventListener('pointercancel', finish);
  entry.addEventListener('lostpointercapture', finish);
  entry.addEventListener('pointerleave', event => { if (!dragged) finish(event); });
  entry.addEventListener('dragstart', event => event.preventDefault());
  entry.addEventListener('click', event => {
    if (dragged && event.detail) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
