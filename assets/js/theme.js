/* Machining Desk — standalone color preferences (independent of machining data). */
(() => {
  'use strict';

  const KEY = 'machiningDeskAppearance';
  const defaults = { mode: 'dark', accent: '#4cddbb' };
  const root = document.documentElement;
  const layer = document.getElementById('appearanceLayer');
  const dialog = document.getElementById('appearanceDialog');
  const opener = document.getElementById('openAppearance');
  const closeButton = document.getElementById('closeAppearance');
  const colorPicker = document.getElementById('customAccent');
  const swatches = [...document.querySelectorAll('.appearance-swatch')];
  const modeInputs = [...document.querySelectorAll('input[name="appearanceMode"]')];
  const isHex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
  let previousFocus = null;
  let settings = { ...defaults };

  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed && (parsed.mode === 'dark' || parsed.mode === 'light') && isHex(parsed.accent)) {
      settings = { mode: parsed.mode, accent: parsed.accent.toLowerCase() };
    }
  } catch { /* Storage may be disabled; the controls still work in memory. */ }

  function luminance(hex) {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const linear = c.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  // Correct very light/dark custom colors until small accent-colored text is readable.
  function readableAccent(color, mode) {
    const background = mode === 'light' ? '#ffffff' : '#0d1420';
    const bgLum = luminance(background);
    const parts = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    const toward = mode === 'light' ? 0 : 255;
    const channel = n => Math.max(0, Math.min(255, Math.round(n)));
    for (let step = 0; step <= 100; step++) {
      const amount = step / 100;
      const rgb = parts.map(n => channel(n * (1 - amount) + toward * amount));
      const adjusted = '#' + rgb.map(n => n.toString(16).padStart(2, '0')).join('');
      const l = luminance(adjusted);
      const ratio = (Math.max(l, bgLum) + 0.05) / (Math.min(l, bgLum) + 0.05);
      if (ratio >= 4.5) return adjusted;
    }
    return mode === 'light' ? '#000000' : '#ffffff';
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Not available in private browsing. */ }
  }

  function paint() {
    root.dataset.theme = settings.mode;
    root.style.setProperty('--accent', readableAccent(settings.accent, settings.mode));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.mode === 'light' ? '#e9f0f7' : '#0d1420');
    colorPicker.value = settings.accent;
    modeInputs.forEach(input => { input.checked = input.value === settings.mode; });
    swatches.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.accent === settings.accent));
    });
  }

  function update(partial) {
    settings = { ...settings, ...partial };
    paint();
    save();
  }

  function open() {
    previousFocus = document.activeElement;
    paint();
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dialog.focus();
  }

  function close() {
    layer.classList.add('hidden');
    document.body.style.overflow = '';
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  opener.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  document.getElementById('doneAppearance').addEventListener('click', close);
  document.getElementById('appearanceBackdrop').addEventListener('click', close);
  document.getElementById('resetAppearance').addEventListener('click', () => update({ ...defaults }));
  modeInputs.forEach(input => input.addEventListener('change', () => {
    if (input.checked) update({ mode: input.value });
  }));
  swatches.forEach(button => button.addEventListener('click', () => update({ accent: button.dataset.accent })));
  colorPicker.addEventListener('input', () => { if (isHex(colorPicker.value)) update({ accent: colorPicker.value.toLowerCase() }); });

  document.addEventListener('keydown', event => {
    if (layer.classList.contains('hidden')) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button, input:not([disabled])')].filter(el => el.getClientRects().length);
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && (index <= 0)) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0]?.focus(); }
    }
  });

  paint();
})();
