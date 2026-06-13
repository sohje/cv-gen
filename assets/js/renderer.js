/**
 * renderer.js
 * Takes unified CV schema, injects HTML into #cv-root.
 */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k === 'innerHTML') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (!child) continue;
    if (typeof child === 'string') node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  }
  return node;
}

function icon(name) {
  return el('i', { className: `fa-solid fa-${name}`, 'aria-hidden': 'true' });
}

function renderMeta(meta) {
  const contactItems = [];

  if (meta.email) {
    contactItems.push(el('a', { href: `mailto:${meta.email}`, className: 'contact-item' },
      icon('envelope'), meta.email));
  }
  if (meta.phone) {
    contactItems.push(el('a', { href: `tel:${meta.phone}`, className: 'contact-item' },
      icon('phone'), meta.phone));
  }
  if (meta.location) {
    contactItems.push(el('span', { className: 'contact-item' },
      icon('location-dot'), meta.location));
  }
  if (meta.website) {
    const label = meta.website.replace(/^https?:\/\//, '');
    contactItems.push(el('a', { href: meta.website, className: 'contact-item', target: '_blank', rel: 'noopener' },
      icon('globe'), label));
  }
  if (meta.linkedin) {
    const label = meta.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '');
    contactItems.push(el('a', { href: meta.linkedin, className: 'contact-item', target: '_blank', rel: 'noopener' },
      el('i', { className: 'fa-brands fa-linkedin', 'aria-hidden': 'true' }), label));
  }
  if (meta.github) {
    const label = meta.github.replace(/^https?:\/\/(www\.)?github\.com\//, '');
    contactItems.push(el('a', { href: meta.github, className: 'contact-item', target: '_blank', rel: 'noopener' },
      el('i', { className: 'fa-brands fa-github', 'aria-hidden': 'true' }), label));
  }

  const contactList = el('div', { className: 'contact-list' }, ...contactItems);

  // Optional profile photo
  const photoEl = meta.photo
    ? el('img', {
        src:       meta.photo,
        alt:       meta.name ? `${meta.name} profile photo` : 'Profile photo',
        className: 'cv-photo',
        width:     '80',
        height:    '80',
      })
    : null;

  const nameBlock = el('div', { className: 'cv-header-left' },
    photoEl,
    el('div', { className: 'cv-header-name' },
      el('h1', {}, meta.name),
      el('p', { className: 'cv-title' }, meta.title || '')
    )
  );

  return el('header', { className: 'cv-header' },
    nameBlock,
    contactList
  );
}

function renderAbout(about) {
  if (!about) return null;
  return el('section', { className: 'cv-section cv-about' },
    el('h2', { className: 'section-title' }, 'About'),
    el('p', { className: 'about-text' }, about)
  );
}

function renderExperience(section) {
  const items = (section.items || []).map(item => {
    const bullets = (item.bullets || []).map(b =>
      el('li', {}, b)
    );
    const meta = [item.period, item.location].filter(Boolean).join(' · ');

    return el('div', { className: 'exp-item' },
      el('div', { className: 'exp-header' },
        el('div', { className: 'exp-title-group' },
          el('span', { className: 'exp-role' }, item.role || ''),
          el('span', { className: 'exp-company' }, item.company || '')
        ),
        meta ? el('span', { className: 'exp-meta' }, meta) : null
      ),
      bullets.length ? el('ul', { className: 'exp-bullets' }, ...bullets) : null
    );
  });

  return el('section', { className: 'cv-section' },
    el('h2', { className: 'section-title' }, section.title),
    el('div', { className: 'exp-list' }, ...items)
  );
}

function renderEducation(section) {
  const items = (section.items || []).map(item =>
    el('div', { className: 'edu-item' },
      el('div', { className: 'edu-header' },
        el('div', { className: 'edu-title-group' },
          el('span', { className: 'edu-degree' }, item.degree || ''),
          el('span', { className: 'edu-institution' }, item.institution || '')
        ),
        item.period ? el('span', { className: 'exp-meta' }, item.period) : null
      ),
      item.note ? el('p', { className: 'edu-note' }, item.note) : null
    )
  );

  return el('section', { className: 'cv-section' },
    el('h2', { className: 'section-title' }, section.title),
    el('div', { className: 'edu-list' }, ...items)
  );
}

function renderSkills(section) {
  const items = (section.items || []).map(item => {
    const tags = (item.tags || []).map(tag =>
      el('span', { className: 'skill-tag' }, tag)
    );
    return el('div', { className: 'skill-category' },
      el('span', { className: 'skill-category-name' }, item.category || ''),
      el('div', { className: 'skill-tags' }, ...tags)
    );
  });

  return el('section', { className: 'cv-section' },
    el('h2', { className: 'section-title' }, section.title),
    el('div', { className: 'skills-list' }, ...items)
  );
}

function renderProjects(section) {
  const items = (section.items || []).map(item => {
    const tags = (item.tags || []).map(tag =>
      el('span', { className: 'skill-tag' }, tag)
    );
    const nameEl = item.url
      ? el('a', { href: item.url, className: 'project-name', target: '_blank', rel: 'noopener' },
          item.name, el('i', { className: 'fa-solid fa-arrow-up-right-from-square project-link-icon', 'aria-hidden': 'true' }))
      : el('span', { className: 'project-name' }, item.name);

    return el('div', { className: 'project-item' },
      el('div', { className: 'project-header' },
        nameEl,
        tags.length ? el('div', { className: 'skill-tags' }, ...tags) : null
      ),
      item.description ? el('p', { className: 'project-desc' }, item.description) : null
    );
  });

  return el('section', { className: 'cv-section' },
    el('h2', { className: 'section-title' }, section.title),
    el('div', { className: 'projects-list' }, ...items)
  );
}

function renderCustom(section) {
  const items = (section.items || []).map(item =>
    el('div', { className: 'custom-item' },
      item.label ? el('span', { className: 'custom-label' }, item.label) : null,
      el('span', { className: 'custom-value' }, item.value || '')
    )
  );

  return el('section', { className: 'cv-section' },
    el('h2', { className: 'section-title' }, section.title),
    el('div', { className: 'custom-list' }, ...items)
  );
}

const SECTION_RENDERERS = {
  experience: renderExperience,
  education: renderEducation,
  skills: renderSkills,
  projects: renderProjects,
  custom: renderCustom,
};

function renderCV(data) {
  const root = document.getElementById('cv-root');
  if (!root) throw new Error('#cv-root element not found');

  root.innerHTML = '';

  const header = renderMeta(data.meta);
  root.appendChild(header);

  if (data.about) {
    root.appendChild(renderAbout(data.about));
  }

  for (const section of (data.sections || [])) {
    const renderer = SECTION_RENDERERS[section.type] || renderCustom;
    const rendered = renderer(section);
    if (rendered) root.appendChild(rendered);
  }
}

export { renderCV };
