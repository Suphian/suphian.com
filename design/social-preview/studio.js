const directions = {
  signature: {
    name: 'Signature',
    number: '01',
    description: 'The full homepage wordmark on a dark, softly lit background. A dedicated square export keeps the whole signature visible in compact and wide messaging cards.',
    title: 'Suphian Tweel',
    subtitle: 'Product, payments & AI. Good ideas deserve to get made.',
  },
  editorial: {
    name: 'Editorial',
    number: '02',
    description: 'The homepage statement leads, paired with the full wordmark and your name. More editorial and personal.',
    title: 'Suphian Tweel',
    subtitle: 'Product, payments & AI. Good ideas deserve to get made.',
  },
  contrast: {
    name: 'Contrast',
    number: '03',
    description: 'The full red wordmark on white, with a restrained name and role footer. Clear, crisp, and easy to read at message size.',
    title: 'Suphian Tweel',
    subtitle: 'Product, payments & AI. Good ideas deserve to get made.',
  },
};

const sources = {
  signature: new URL('./assets/signature.png', import.meta.url).href,
  editorial: new URL('./assets/editorial.png', import.meta.url).href,
  contrast: new URL('./assets/contrast.png', import.meta.url).href,
};
const signatureSquare = new URL('./assets/signature-square.png', import.meta.url).href;
const directionButtons = [...document.querySelectorAll('[data-direction]')];
const themeButtons = [...document.querySelectorAll('[data-theme]')].filter(element => element.tagName === 'BUTTON');

function selectDirection(key) {
  if (!Object.hasOwn(directions, key)) return;
  const direction = directions[key];
  const source = sources[key];

  directionButtons.forEach(button => {
    const selected = button.dataset.direction === key;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  const heroImage = document.getElementById('hero-image');
  heroImage.src = source;
  heroImage.alt = `${direction.name} social preview featuring the full Suphian artwork`;
  document.getElementById('hero-image-link').href = source;
  document.getElementById('hero-image-link').setAttribute('aria-label', `Open ${direction.name} artwork at full size`);
  document.getElementById('viewer-label').textContent = `${direction.number} / ${direction.name.toUpperCase()}`;
  document.getElementById('direction-title').textContent = direction.name;
  document.getElementById('direction-description').textContent = direction.description;
  document.getElementById('recommendation').hidden = key !== 'signature';
  document.getElementById('messaging-export').hidden = key !== 'signature';
  document.getElementById('comparison-label').textContent = direction.name;

  document.querySelectorAll('[data-selected-image]').forEach(img => {
    const isMessaging = Boolean(img.closest('.context-panel'));
    img.src = key === 'signature' && isMessaging ? signatureSquare : source;
    img.width = 1200;
    img.height = key === 'signature' && isMessaging ? 1200 : 630;
    const context = img.closest('.compact-panel') ? 'a square center-cropped WhatsApp thumbnail' : img.closest('.imessage-panel') ? 'iMessage card size' : img.closest('.whatsapp-panel') ? 'WhatsApp card size' : 'the same width as the previous preview';
    img.alt = `${direction.name} social preview shown at ${context}`;
  });
  document.querySelectorAll('[data-selected-title]').forEach(element => { element.textContent = direction.title; });
  document.querySelectorAll('[data-selected-description]').forEach(element => { element.textContent = direction.subtitle; });

  const download = document.getElementById('download-link');
  download.href = source;
  download.download = `suphian-${key}-1200x630.png`;
  document.getElementById('fullsize-link').href = source;
  document.getElementById('selection-status').textContent = `${direction.name} selected. Artwork and messaging mockups updated.`;
  const url = new URL(window.location.href);
  url.searchParams.set('direction', key);
  window.history.replaceState(null, '', url);
}

directionButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectDirection(button.dataset.direction));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? directionButtons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + directionButtons.length) % directionButtons.length;
    directionButtons[next].focus();
    selectDirection(directionButtons[next].dataset.direction);
  });
});

themeButtons.forEach(button => button.addEventListener('click', () => {
  const theme = button.dataset.theme;
  document.getElementById('artwork-viewer').dataset.theme = theme;
  themeButtons.forEach(item => {
    const selected = item.dataset.theme === theme;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
}));

const requestedDirection = new URLSearchParams(window.location.search).get('direction');
document.getElementById('square-download-link').href = signatureSquare;
selectDirection(requestedDirection && Object.hasOwn(directions, requestedDirection) ? requestedDirection : 'signature');

Object.keys(directions).forEach(key => {
  const img = new Image();
  img.src = sources[key];
});
