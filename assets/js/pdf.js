/**
 * pdf.js
 * Wraps html2pdf.js. Forces light palette before export, restores after.
 * Hides .no-print elements. Filename derived from meta.name.
 */

import { forceLightMode, restoreTheme } from './theme.js';

function slugify(name) {
  return (name || 'cv')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function downloadPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('html2pdf.js not loaded. Check libs/html2pdf.bundle.min.js');
    return;
  }

  const btn  = document.getElementById('pdf-btn');
  const root = document.getElementById('cv-root');

  if (!root) return;

  // Grab name for filename before we touch the DOM
  const nameEl   = root.querySelector('h1');
  const filename = slugify(nameEl ? nameEl.textContent : 'cv') + '-cv.pdf';

  // Disable button, show spinner
  if (btn) {
    btn.disabled   = true;
    btn.innerHTML  = '<i class="fa-solid fa-spinner fa-spin"></i> Generating…';
  }

  // Force light palette — dark backgrounds destroy PDF output
  forceLightMode();

  // Brief paint flush so browser applies the light theme before capture
  await new Promise(r => setTimeout(r, 80));

  const opt = {
    margin:      [10, 10, 10, 10], // mm
    filename,
    image:       { type: 'jpeg', quality: 0.97 },
    html2canvas: {
      scale:           2,
      useCORS:         true,
      letterRendering: true,
      scrollX:         0,
      scrollY:         -window.scrollY,
    },
    jsPDF: {
      unit:        'mm',
      format:      'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(root).save();
  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF generation failed. See console for details.');
  } finally {
    // Restore palette regardless of success/failure
    restoreTheme();

    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Download PDF';
    }
  }
}

function initPDF() {
  const btn = document.getElementById('pdf-btn');
  if (btn) btn.addEventListener('click', downloadPDF);
}

export { initPDF };
