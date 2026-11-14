// PONT: unobtrusive keyboard dismissal when swiping the page on iOS.
// A website cannot receive touch events occurring on the native iOS keyboard.
(() => {
  'use strict';
  const editable = 'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),textarea,[contenteditable="true"]';
  let start = null;
  const activeEditor = () => {
    const element = document.activeElement;
    return element instanceof HTMLElement && element.matches(editable) && !element.matches('[readonly],[disabled]')
      ? element : null;
  };
  const dismiss = () => { const element = activeEditor(); if (element) element.blur(); };
  const reset = () => { start = null; };

  // Keep the browser's native scrolling/swiping behavior. Do not preventDefault.
  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || !activeEditor()) { reset(); return; }
    const target = event.target;
    // Allow caret selection, text editing and scrolling inside a textarea.
    if (target instanceof Element && target.closest(editable)) { reset(); return; }
    const touch = event.touches[0];
    start = { x: touch.clientX, y: touch.clientY };
  }, {capture:true, passive:true});

  document.addEventListener('touchmove', event => {
    if (!start || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Downward swipe on the PAGE, not a simple tap or horizontal gesture.
    if (dy > 48 && dy > Math.abs(dx) * 1.35) { dismiss(); reset(); }
  }, {capture:true, passive:true});
  document.addEventListener('touchend',reset,{capture:true,passive:true});
  document.addEventListener('touchcancel',reset,{capture:true,passive:true});

  // Keyboard-only dismissal: Enter finishes single-line numeric/telephone fields;
  // never intercept Enter in a textarea or normal text form submission.
  document.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') dismiss();
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement &&
        event.target.matches('input[type="number"],input[type="tel"],input[inputmode="numeric"],input[inputmode="decimal"]')) {
      event.preventDefault();
      dismiss();
    }
  }, true);
})();
