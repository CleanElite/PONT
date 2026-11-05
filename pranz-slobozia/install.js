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
  const guide = installHelp.querySelector('p');
  guide.replaceChildren();
  guide.style.lineHeight = '1.8';
  if (appleMobile) {
    const steps = ['••• Cele trei puncte din Safari', 'Partajează ↑', 'Adaugă pe ecranul principal'];
    steps.forEach((step, index) => {
      const line = document.createElement('strong');
      line.style.display = 'block';
      line.style.padding = '8px 0';
      line.textContent = (index + 1) + '. ' + step;
      guide.append(line);
    });
    const confirmation = document.createElement('small');
    confirmation.textContent = 'În fereastra care apare, confirmă cu „Adaugă”.';
    guide.append(confirmation);
  } else {
    guide.textContent = 'În Chrome, apasă ⋮ → Instalează aplicația.';
  }
  installHelp.showModal();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('PONT installation setup:', error));
}
