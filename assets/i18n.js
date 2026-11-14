(() => {
  'use strict';
  const languages = ['zh', 'en', 'fr', 'de', 'es'];
  const languageNames = { zh: '中文', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español' };
  const storageKey = 'admire-language-selection';
  const defaultLanguage = 'en';
  const rows = window.ADMIRE_CATALOG || [];
  const normalize = value => value.trim().replace(/\s+/g, ' ');
  const lookup = new Map();
  const reverse = new Map();
  for (const row of rows) {
    lookup.set(normalize(row[0]), row);
    for (const translated of row.slice(1)) {
      if (!reverse.has(normalize(translated))) reverse.set(normalize(translated), row[0]);
    }
  }
  const baseLanguage = value => String(value || '').toLowerCase().split(/[-_]/)[0];
  const browserLanguage = () => (navigator.languages || [navigator.language]).map(baseLanguage).find(code => languages.includes(code)) || defaultLanguage;
  const readPreference = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
  const savedLanguage = readPreference();
  let automatic = false;
  let language = defaultLanguage;
  const attributes = ['alt', 'title', 'aria-label', 'placeholder', 'data-title', 'data-description', 'data-demo-title', 'data-demo-description', 'data-caption'];
  const originals = new WeakMap();
  const skipped = node => node.parentElement?.closest('script, style, noscript, [data-i18n-skip]');
  const ui = {
    label: ['语言','Language','Langue','Sprache','Idioma'],
    auto: ['跟随浏览器','Browser default','Automatique','Automatisch','Automático'],
    changed: ['已切换为中文','Language changed to English','Langue changée en français','Sprache auf Deutsch geändert','Idioma cambiado a español'],
    enlarge: ['放大查看 ','Enlarge: ','Agrandir : ','Vergrößern: ','Ampliar: ']
  };

  const canonical = value => {
    const key = normalize(value);
    if (lookup.has(key)) return value;
    if (reverse.has(key)) return reverse.get(key);
    const zoomLabel = key.match(/^放大查看\s*(.+)$/);
    if (zoomLabel) return '放大查看 ' + (reverse.get(normalize(zoomLabel[1])) || zoomLabel[1]);
    return value;
  };

  function translate(value, target = language) {
    const index = languages.indexOf(target);
    if (index < 0) return value;
    const original = canonical(value);
    if (target === 'zh') return original;
    const key = normalize(original);
    const row = lookup.get(key);
    if (row) {
      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];
      return leading + row[index] + trailing;
    }
    let match = key.match(/^(\d+)\s*篇$/);
    if (match) return [`${match[1]} 篇`,`${match[1]} papers`,`${match[1]} articles`,`${match[1]} Arbeiten`,`${match[1]} artículos`][index];
    match = key.match(/^共\s*(\d+)\s*篇$/);
    if (match) return [key,`${match[1]} papers in total`,`${match[1]} articles au total`,`Insgesamt ${match[1]} Arbeiten`,`${match[1]} artículos en total`][index];
    match = key.match(/^代表论文\s*(\d+)\s*篇(?:\s*·\s*核心框架\s*(\d+)\s*项)?$/);
    if (match) {
      const n = match[1], f = match[2];
      const papers = [key,`${n} featured papers`,`${n} articles sélectionnés`,`${n} ausgewählte Arbeiten`,`${n} artículos destacados`][index];
      const frameworks = ['',` · ${f} core framework${f === '1' ? '' : 's'}`,` · ${f} ${f === '1' ? 'cadre central' : 'cadres centraux'}`,` · ${f} Kernframework${f === '1' ? '' : 's'}`,` · ${f} marco${f === '1' ? '' : 's'} central${f === '1' ? '' : 'es'}`][index];
      return papers + (f ? frameworks : '');
    }
    match = key.match(/^(全部论文|软件空间|物理空间|科学发现空间|其他研究)\s*(\d+)\s*篇论文索引$/);
    if (match) return `${translate(match[1], target)} · ${translate(`${match[2]} 篇`, target)}`;
    match = key.match(/^放大查看\s*(.+)$/);
    if (match) return ui.enlarge[index] + translate(match[1], target);
    return original;
  }

  function update(node, attribute) {
    const current = attribute ? node.getAttribute(attribute) : node.nodeValue;
    if (!current || !current.trim()) return;
    const records = originals.get(node) || new Map();
    const key = attribute || 'text';
    let record = records.get(key);
    // Remember the source separately so switching languages does not translate a translation.
    if (!record || record.rendered !== current) record = { source: canonical(current), rendered: current };
    const next = translate(record.source);
    record.rendered = next;
    records.set(key, record);
    originals.set(node, records);
    if (current !== next) {
      if (attribute) node.setAttribute(attribute, next);
      else node.nodeValue = next;
    }
  }

  function figureSource(original, figure, originalLanguage) {
    return !figure || language === originalLanguage ? original : `assets/i18n/figures/${figure}.${language}.webp`;
  }

  function localizeFigure(image) {
    const data = image.dataset;
    data.figureOriginal ||= image.getAttribute('src');
    const source = figureSource(data.figureOriginal, data.localizedFigure, data.figureOriginalLanguage);
    if (source && image.getAttribute('src') !== source) image.setAttribute('src', source);
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!skipped(node)) update(node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches('script, style, noscript, [data-i18n-skip]')) return;
      for (const attribute of attributes) if (node.hasAttribute(attribute)) update(node, attribute);
      if (node.matches('img[data-localized-figure]')) localizeFigure(node);
      if (node instanceof HTMLTemplateElement) walk(node.content);
    }
    for (const child of node.childNodes) walk(child);
  }

  const observer = new MutationObserver(mutations => {
    observer.disconnect();
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' && !skipped(mutation.target)) update(mutation.target);
      if (mutation.type === 'attributes' && !mutation.target.closest('[data-i18n-skip]')) update(mutation.target, mutation.attributeName);
      if (mutation.type === 'childList') for (const node of mutation.addedNodes) walk(node);
    }
    observe();
  });
  const observe = () => observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });

  function applyLanguage(code, persist = false) {
    automatic = code === 'auto';
    language = automatic ? browserLanguage() : languages.includes(code) ? code : defaultLanguage;
    if (persist) {
      try { localStorage.setItem(storageKey, automatic ? 'auto' : language); } catch { /* Private browsing may block storage. */ }
    }
    observer.disconnect();
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    walk(document.body);
    document.title = translate('ADMIRE 课题组 · 递归演化驱动的自适应分布式多智能体智能 · 北航');
    const index = languages.indexOf(language);
    if (toggle) {
      document.getElementById('language-current').textContent = languageNames[language];
      toggle.setAttribute('aria-label', `${ui.label[index]}: ${languageNames[language]}`);
      toggle.title = ui.label[index];
      menu.setAttribute('aria-label', ui.label[index]);
      document.getElementById('language-auto-label').textContent = ui.auto[index];
      for (const option of options) option.setAttribute('aria-checked', String(option.dataset.language === (automatic ? 'auto' : language)));
    }
    const status = document.getElementById('language-status');
    if (persist && status) status.textContent = ui.changed[index];
    observe();
    document.dispatchEvent(new CustomEvent('admire:languagechange', { detail: { language, automatic } }));
  }

  const picker = document.querySelector('.language-picker');
  const toggle = document.getElementById('language-toggle');
  const menu = document.getElementById('language-menu');
  const options = menu ? [...menu.querySelectorAll('[data-language]')] : [];
  const closeMenu = (restoreFocus = false) => {
    if (!menu) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };
  const openMenu = (index = options.findIndex(option => option.getAttribute('aria-checked') === 'true')) => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    options[Math.max(0, index)]?.focus({ preventScroll: true });
  };
  toggle?.addEventListener('click', () => menu.hidden ? openMenu() : closeMenu(true));
  toggle?.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowDown' ? 0 : options.length - 1);
    }
  });
  options.forEach(option => option.addEventListener('click', () => {
    applyLanguage(option.dataset.language, true);
    closeMenu(true);
  }));
  menu?.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    }
    if (event.key === 'Tab') closeMenu(true);
  });
  document.addEventListener('pointerdown', event => { if (!picker?.contains(event.target)) closeMenu(); });
  picker?.addEventListener('focusout', event => { if (!picker.contains(event.relatedTarget)) closeMenu(); });
  window.AdmireI18n = { t: translate, setLanguage: applyLanguage, figureSource, get language() { return language; }, get automatic() { return automatic; } };
  window.addEventListener('languagechange', () => { if (automatic) applyLanguage('auto'); });
  applyLanguage(savedLanguage);
})();
