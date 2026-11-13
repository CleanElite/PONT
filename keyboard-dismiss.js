// PONT – explicit dismissal for iOS numeric and text keyboards.
(() => {
  'use strict';
  const selector = 'input:not([type]),input[type="text"],input[type="search"],input[type="email"],input[type="url"],input[type="password"],input[type="number"],input[type="tel"],input[inputmode="numeric"],input[inputmode="decimal"],input[inputmode="tel"],textarea';
  let active = null;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Gata';
  button.setAttribute('aria-label', 'Închide tastatura');
  button.setAttribute('data-pont-keyboard-done', '');
  button.style.cssText = 'position:fixed;right:12px;bottom:16px;z-index:2147483000;display:none;min-width:66px;min-height:38px;padding:7px 14px;border:1px solid #69dfd0;border-radius:12px;background:#103c42;color:#e9fffc;font:700 14px/1 system-ui,-apple-system,sans-serif;box-shadow:0 3px 18px #0008;cursor:pointer;touch-action:manipulation;';
  const updatePosition = () => {
    const viewport = window.visualViewport;
    const extra = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    button.style.bottom = Math.round(extra + 12) + 'px';
  };
  const hide = () => {
    active = null;
    button.style.display = 'none';
  };
  const dismiss = () => {
    const input = active && document.activeElement === active ? active : document.activeElement;
    if (input instanceof HTMLElement && input.matches(selector)) input.blur();
    hide();
  };
  document.addEventListener('focusin', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || !input.matches(selector) || input.readOnly || input.disabled) {
      hide();
      return;
    }
    active = input;
    if (!button.isConnected) document.body.appendChild(button);
    updatePosition();
    button.style.display = 'block';
  });
  document.addEventListener('focusout', event => {
    if (event.target === active) window.setTimeout(() => {
      if (document.activeElement !== active) hide();
    }, 0);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && (event.target.matches('input[type="number"],input[type="tel"],input[inputmode="numeric"],input[inputmode="decimal"],input[inputmode="tel"]')) && !event.isComposing) {
      event.preventDefault();
      dismiss();
    }
    if (event.key === 'Escape' && active) dismiss();
  }, true);
  // pointerdown works even if iOS's keyboard resizes the viewport during the tap.
  button.addEventListener('pointerdown', event => { event.preventDefault(); dismiss(); });
  button.addEventListener('click', dismiss);
  window.visualViewport?.addEventListener('resize', updatePosition);
  window.visualViewport?.addEventListener('scroll', updatePosition);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('pagehide', hide);
})();
