(() => {
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  window.CampusFlow = {
    chip: (text, accent = '') => `<span class="chip ${accent}">${esc(text)}</span>`,
    node: (label, icon = '✦', accent = '') => {
      const iconNames = { '◌': 'user-round', '◉': 'circle-dot', '✓': 'circle-check-big', '✦': 'sparkles', '✎': 'pen-line', '⌘': 'git-branch', '▤': 'file-text', '▣': 'inbox', '⌁': 'network', '⌂': 'house', '⌕': 'scan-search', '↻': 'rotate-cw' };
      return `<div class="flow-node ${accent}"><i class="node-icon" data-lucide="${iconNames[icon] || 'circle-dot'}" aria-hidden="true"></i><strong>${esc(label)}</strong></div>`;
    },
    arrow: () => '<span class="flow-arrow" aria-hidden="true">↓</span>',
    horizontal: (labels, icons = []) => `<div class="flow horizontal">${labels.map((label, i) => `${i ? '<span class="flow-arrow side">→</span>' : ''}${window.CampusFlow.node(label, icons[i] || '✦', i === 1 ? 'accent' : '')}`).join('')}</div>`,
    vertical: (labels, icons = []) => `<div class="flow vertical">${labels.map((label, i) => `${window.CampusFlow.node(label, icons[i] || '✦', i === 1 ? 'accent' : '')}${i < labels.length - 1 ? window.CampusFlow.arrow() : ''}`).join('')}</div>`,
    card: (eyebrow, title, body, accent = '') => `<article class="info-card ${accent}"><span class="eyebrow">${esc(eyebrow)}</span><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}</article>`,
  };
})();
