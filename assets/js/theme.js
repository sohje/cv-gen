/**
 * theme.js
 * Palette-based theming system.
 *
 * Architecture:
 *   - PALETTES registry maps id → { label, dark }
 *   - Active palette stored in localStorage under STORAGE_KEY
 *   - Applied via html[data-theme="<id>"] attribute
 *   - CSS defines token overrides per data-theme selector
 *   - Extensible: add new palette = add entry here + CSS block in style.css
 *
 * Public API (exported):
 *   initTheme()        — read stored/system palette, apply, wire up picker
 *   forceLightMode()   — apply "light" palette without persisting (PDF export)
 *   restoreTheme()     — re-apply persisted palette (after PDF export)
 */

const STORAGE_KEY = 'cv-palette';

/**
 * Palette registry. Add new entries here to register a theme.
 * The corresponding CSS block (html[data-theme="id"] { ... }) must exist in style.css.
 * @type {Record<string, { label: string, dark: boolean }>}
 */
const PALETTES = {
  light:    { label: 'Light',    dark: false },
  dark:     { label: 'Dark',     dark: true  },
  warm:     { label: 'Warm',     dark: false },
  slate:    { label: 'Slate',    dark: true  },
  midnight: { label: 'Midnight', dark: true  },
};

const VALID_IDS = Object.keys(PALETTES);

function getActivePalette() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_IDS.includes(stored)) return stored;

  // Migrate from legacy 'cv-theme' key (light/dark only)
  const legacy = localStorage.getItem('cv-theme');
  if (legacy === 'dark') return 'dark';

  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyPalette(id) {
  document.documentElement.setAttribute('data-theme', id);
  // Sync active indicator on picker dots
  document.querySelectorAll('.palette-dot').forEach(btn => {
    const isActive = btn.dataset.palette === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function setPalette(id) {
  if (!PALETTES[id]) return;
  localStorage.setItem(STORAGE_KEY, id);
  applyPalette(id);
}

function forceLightMode() {
  // Does not persist — only for PDF snapshot
  document.documentElement.setAttribute('data-theme', 'light');
}

function restoreTheme() {
  applyPalette(getActivePalette());
}

function initTheme() {
  applyPalette(getActivePalette());

  document.querySelectorAll('.palette-dot').forEach(btn => {
    btn.addEventListener('click', () => setPalette(btn.dataset.palette));
  });
}

export { initTheme, forceLightMode, restoreTheme, PALETTES };
