const installButton = document.querySelector('#install-pont');
const installHelp = document.querySelector('#install-help');
const installedMode = matchMedia('(display-mode: standalone)');
let installPrompt;

function updateInstallButton() {
  installButton.hidden = installedMode.matches || navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});

window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  installButton.hidden = true;
});

installedMode.addEventListener('change', updateInstallButton);
updateInstallButton();

installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = undefined;
    try {
      const { outcome } = await prompt.prompt();
      if (outcome === 'accepted') installButton.hidden = true;
      return;
    } catch {
      // The browser menu still provides an installation route.
    }
  }

  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instructions = appleMobile
    ? 'Deschide această pagină în Safari. Apasă Partajează, apoi „Adaugă pe ecranul principal”. Activează „Deschide ca aplicație web” dacă apare și apasă „Adaugă”.'
    : 'Deschide această pagină în Chrome. Din meniul browserului alege „Instalează aplicația” sau „Adaugă pe ecranul principal”.';
  installHelp.querySelector('p').textContent = instructions;
  installHelp.showModal();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('PONT installation setup:', error));
}
