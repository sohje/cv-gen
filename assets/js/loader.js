/**
 * loader.js
 * Fetches CV data file, detects format, parses it, returns unified schema.
 * Supported: .yaml/.yml, .json, .md (YAML frontmatter + sections)
 */

const CANDIDATES = ['cv.yaml', 'cv.yml', 'cv.json', 'cv.md'];

async function fetchFirst(candidates) {
  for (const filename of candidates) {
    try {
      const res = await fetch(filename);
      if (res.ok) return { text: await res.text(), filename };
    } catch (_) {
      // try next
    }
  }
  throw new Error(
    `No CV file found. Place one of [${candidates.join(', ')}] next to index.html`
  );
}

function parseYaml(text) {
  if (typeof jsyaml === 'undefined') {
    throw new Error('js-yaml not loaded. Check libs/js-yaml.min.js');
  }
  return jsyaml.load(text);
}

function parseJson(text) {
  return JSON.parse(text);
}

/**
 * Minimal Markdown parser: YAML frontmatter + H2/H3 section structure.
 * Does NOT require marked.js — we only need our own structured format.
 *
 * Expected structure:
 *   ---
 *   meta: ...
 *   about: ...
 *   ---
 *   ## Experience
 *   ### Company | Role | Period | Location
 *   - bullet
 *
 *   ## Skills
 *   ### Category
 *   tag1, tag2, tag3
 */
function parseMarkdown(text) {
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    throw new Error('Markdown CV must start with YAML frontmatter (--- ... ---)');
  }

  const frontmatter = parseYaml(frontmatterMatch[1]);
  const body = text.slice(frontmatterMatch[0].length).trim();

  const sections = [];
  const sectionBlocks = body.split(/^## /m).filter(Boolean);

  for (const block of sectionBlocks) {
    const lines = block.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    const titleLower = title.toLowerCase();

    if (titleLower.includes('experience') || titleLower.includes('work')) {
      sections.push(parseMarkdownExperience(title, content));
    } else if (titleLower.includes('education')) {
      sections.push(parseMarkdownEducation(title, content));
    } else if (titleLower.includes('skill')) {
      sections.push(parseMarkdownSkills(title, content));
    } else if (titleLower.includes('project')) {
      sections.push(parseMarkdownProjects(title, content));
    } else {
      sections.push(parseMarkdownCustom(title, content));
    }
  }

  return { ...frontmatter, sections };
}

function parseMarkdownExperience(title, content) {
  const items = [];
  const entries = content.split(/^### /m).filter(Boolean);
  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const header = lines[0].split('|').map(s => s.trim());
    const [company = '', role = '', period = '', location = ''] = header;
    const bullets = lines
      .slice(1)
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^[\s-]+/, '').trim());
    items.push({ company, role, period, location, bullets });
  }
  return { type: 'experience', title, items };
}

function parseMarkdownEducation(title, content) {
  const items = [];
  const entries = content.split(/^### /m).filter(Boolean);
  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const header = lines[0].split('|').map(s => s.trim());
    const [institution = '', degree = '', period = ''] = header;
    const noteLine = lines.find(l => l.trim().startsWith('>'));
    const note = noteLine ? noteLine.replace(/^[\s>]+/, '').trim() : '';
    items.push({ institution, degree, period, note });
  }
  return { type: 'education', title, items };
}

function parseMarkdownSkills(title, content) {
  const items = [];
  const entries = content.split(/^### /m).filter(Boolean);
  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const category = lines[0].trim();
    const tagsLine = lines.slice(1).find(l => l.trim());
    const tags = tagsLine ? tagsLine.split(',').map(t => t.trim()).filter(Boolean) : [];
    items.push({ category, tags });
  }
  return { type: 'skills', title, items };
}

function parseMarkdownProjects(title, content) {
  const items = [];
  const entries = content.split(/^### /m).filter(Boolean);
  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const name = lines[0].trim();
    const description = lines.slice(1).find(l => l.trim() && !l.trim().startsWith('- ')) || '';
    const urlLine = lines.find(l => l.trim().startsWith('- url:'));
    const tagsLine = lines.find(l => l.trim().startsWith('- tags:'));
    const url = urlLine ? urlLine.replace(/.*url:\s*/, '').trim() : '';
    const tags = tagsLine
      ? tagsLine.replace(/.*tags:\s*/, '').split(',').map(t => t.trim()).filter(Boolean)
      : [];
    items.push({ name, description: description.trim(), url, tags });
  }
  return { type: 'projects', title, items };
}

function parseMarkdownCustom(title, content) {
  const items = [];
  const lines = content.split('\n').filter(l => l.trim());
  for (const line of lines) {
    if (line.includes(':')) {
      const idx = line.indexOf(':');
      items.push({
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      });
    } else {
      items.push({ label: '', value: line.trim() });
    }
  }
  return { type: 'custom', title, items };
}

function validateSchema(data) {
  if (!data || typeof data !== 'object') throw new Error('CV data must be an object');
  if (!data.meta) throw new Error('CV data must have a "meta" key');
  if (!data.meta.name) throw new Error('meta.name is required');
  if (!Array.isArray(data.sections)) {
    data.sections = [];
  }
  return data;
}

async function loadCV() {
  const { text, filename } = await fetchFirst(CANDIDATES);
  const ext = filename.split('.').pop().toLowerCase();

  let data;
  if (ext === 'yaml' || ext === 'yml') {
    data = parseYaml(text);
  } else if (ext === 'json') {
    data = parseJson(text);
  } else if (ext === 'md') {
    data = parseMarkdown(text);
  } else {
    throw new Error(`Unknown file extension: .${ext}`);
  }

  return validateSchema(data);
}

export { loadCV };
