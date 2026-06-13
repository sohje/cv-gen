/**
 * main.js
 * Application entry point. Owns init sequence.
 * All inter-module dependencies are explicit via import.
 */

import { loadCV } from './loader.js';
import { renderCV } from './renderer.js';
import { initTheme } from './theme.js';
import { initPDF } from './pdf.js';

function updateOgMeta(data) {
  const { meta, about } = data;

  const set = (sel, value) => {
    const el = document.querySelector(sel);
    if (el && value) el.setAttribute('content', value);
  };

  const name = meta?.name ?? '';
  const title = name ? `${name} — CV` : 'CV';
  const description = about
    ? about.replace(/\s+/g, ' ').trim().slice(0, 200)
    : '';

  document.title = title;
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[name="description"]', description);
}

function renderError(err) {
  const root = document.getElementById('cv-root');
  if (!root) return;

  // Build error DOM without innerHTML to avoid XSS
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-triangle-exclamation';
  icon.setAttribute('aria-hidden', 'true');

  const heading = document.createElement('h2');
  heading.textContent = 'Failed to load CV';

  const pre = document.createElement('pre');
  pre.textContent = err.message;

  const hint = document.createElement('p');
  hint.textContent = 'Place cv.yaml, cv.json, or cv.md next to index.html.';

  const wrapper = document.createElement('div');
  wrapper.className = 'cv-error';
  wrapper.append(icon, heading, pre, hint);

  root.replaceChildren(wrapper);
}

async function init() {
  // Theme must be first — button needs correct state before paint
  initTheme();

  try {
    const data = await loadCV();
    updateOgMeta(data);
    renderCV(data);
  } catch (err) {
    console.error('CV load error:', err);
    renderError(err);
  }

  // PDF init after render so the button is in the DOM
  initPDF();
}

init();
