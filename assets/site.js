(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = document.getElementById('site-nav');
  const menuToggle = document.getElementById('site-menu-toggle');
  const compact = window.matchMedia('(max-width: 800px)');
  const main = document.getElementById('content');
  const home = document.getElementById('home');
  const links = [...nav.querySelectorAll('a')];
  const sections = [...main.querySelectorAll(':scope > .section')];
  const pages = new Map([['#top', home], ...sections.map(section => ['#' + section.id, section])]);
  const publicationAnchors = new Map(
    [...document.querySelectorAll('#papers [data-publication-anchor]')].map(heading => ['#' + heading.id, heading])
  );
  const backToTop = document.querySelector('.footer-inner a');
  let currentLink;

  function setMenu(open) {
    menuToggle.hidden = !compact.matches;
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.hidden = compact.matches && !open;
  }

  function syncHeaderOffset() {
    const offset = compact.matches ? header.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-height', `${offset}px`);
  }

  function showPage(focusContent = false) {
    if (window.location.hash === '#apply') history.replaceState(null, '', '#top');
    const fragment = window.location.hash;
    const anchor = publicationAnchors.get(fragment);
    const hash = anchor ? '#papers' : pages.has(fragment) ? fragment : '#top';
    const page = pages.get(hash);
    for (const section of pages.values()) section.hidden = section !== page;
    currentLink?.removeAttribute('aria-current');
    currentLink = links.find(link => link.hash === hash);
    currentLink.setAttribute('aria-current', 'page');
    backToTop.setAttribute('href', hash);
    setMenu(false);
    if (anchor) {
      syncHeaderOffset();
      anchor.focus({ preventScroll: true });
      anchor.scrollIntoView();
    } else if (focusContent) {
      main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  menuToggle.addEventListener('click', () => {
    const open = nav.hidden;
    setMenu(open);
    if (open) currentLink.focus();
  });
  document.getElementById('language-toggle').addEventListener('click', () => setMenu(false));
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView();
  });
  for (const element of [header, nav]) {
    element.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      menuToggle.focus();
    });
  }
  document.addEventListener('pointerdown', event => {
    if (compact.matches && !nav.hidden && !header.contains(event.target) && !nav.contains(event.target)) setMenu(false);
  });
  compact.addEventListener('change', () => {
    setMenu(false);
    syncHeaderOffset();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || (!pages.has(link.hash) && !publicationAnchors.has(link.hash)) ||
        event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    showPage(true);
  });
  window.addEventListener('hashchange', () => showPage(true));
  new ResizeObserver(syncHeaderOffset).observe(header);
  syncHeaderOffset();

  const researchDetails = [...document.querySelectorAll('#directions .direction-details')];
  researchDetails.forEach(detail => {
    detail.querySelector('summary').addEventListener('click', event => {
      event.preventDefault();
      const open = researchDetails.some(item => !item.open);
      researchDetails.forEach(item => { item.open = open; });
    });
  });

  function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDetails = lightbox.querySelector('.lightbox-details');
  const lightboxDescription = document.getElementById('lightboxDescription');
  const lightboxEmail = document.getElementById('lightboxEmail');
  const lightboxOriginal = document.getElementById('lightboxOriginal');
  let lightboxTrigger;

  function showLightboxImage(trigger) {
    const thumbnail = trigger.querySelector('img');
    const imageSrc = thumbnail?.getAttribute('src');
    const originalThumbnail = thumbnail?.dataset.figureOriginal;
    const localized = originalThumbnail && imageSrc !== originalThumbnail;
    const original = trigger.dataset.src || originalThumbnail;
    const src = localized ? imageSrc : original || thumbnail?.currentSrc || imageSrc;
    if (!src) return false;

    const title = trigger.dataset.title || thumbnail?.alt || '图片';
    const description = trigger.dataset.description || '';
    const isProfile = trigger.dataset.profile === 'true';
    const email = isProfile ? trigger.dataset.profileEmail || '' : '';
    lightboxTitle.textContent = title;
    lightboxImage.src = src;
    lightboxImage.alt = thumbnail?.alt || title;
    lightboxOriginal.hidden = !localized || !original;
    if (localized && original) lightboxOriginal.href = original;
    else lightboxOriginal.removeAttribute('href');
    lightboxDetails.hidden = !description && !email && lightboxOriginal.hidden;
    lightboxDescription.textContent = description;
    lightboxDescription.hidden = !description;
    lightboxEmail.hidden = !email;
    lightboxEmail.textContent = email;
    if (email) lightboxEmail.href = `mailto:${email}`;
    else lightboxEmail.removeAttribute('href');
    lightbox.classList.toggle('lightbox--profile', isProfile);
    return true;
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('.image-open');
    if (!trigger || !showLightboxImage(trigger)) return;
    lightboxTrigger = trigger;
    lightbox.showModal();
    lightbox.scrollTop = 0;
  });

  document.addEventListener('admire:languagechange', () => {
    if (lightbox.open && lightboxTrigger) showLightboxImage(lightboxTrigger);
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => {
    lightboxTrigger = null;
    lightboxImage.removeAttribute('src');
  });
  closeOnBackdrop(lightbox);

  function selectTab(tabs, selected) {
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === selected));
      tab.tabIndex = tab === selected ? 0 : -1;
    });
  }

  function bindTabs(tabList, tabs, activate) {
    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
    tabList.addEventListener('keydown', event => {
      const index = tabs.indexOf(event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  }

  const teamTabList = document.querySelector('.team-tabs');
  const teamTabs = [...teamTabList.querySelectorAll('[data-team-tab]')];
  bindTabs(teamTabList, teamTabs, selected => {
    selectTab(teamTabs, selected);
    teamTabs.forEach(tab => {
      document.getElementById(tab.getAttribute('aria-controls')).hidden = tab !== selected;
    });
  });

  const paperTabList = document.querySelector('.paper-tabs');
  const paperTabs = [...paperTabList.querySelectorAll('[data-paper-tab]')];
  const paperPanel = document.getElementById('paper-tab-panel');
  const paperList = paperPanel.querySelector('.paper-list');
  const paperGallery = paperPanel.querySelector('.paper-gallery');
  const paperGalleryHeading = document.getElementById('paper-architectures');
  const titleKey = title => title.trim().replace(/\s+/g, ' ').toLowerCase();
  const papers = [...paperList.querySelectorAll('.paper-row')].map(row => ({
    row,
    title: titleKey(row.querySelector('h3').textContent),
    space: row.dataset.paperSpace,
    year: Number(row.querySelector('.num').textContent),
    rank: row.querySelector('.ccf-a') ? 2 : row.querySelector('.ccf-b') ? 1 : 0
  })).sort((a, b) => b.year - a.year || b.rank - a.rank);
  paperList.append(...papers.map(({ row }) => row));

  const newsList = document.getElementById('home-news-list');
  // Conference entries sort by their first day.
  const newsEntries = [...newsList.querySelectorAll(':scope > .home-exchange')].map(entry => ({
    entry,
    date: entry.querySelector('time').dateTime
  }));
  const newsDay = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const newsMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  function addPublicationNews({ date, title, metadata, summary }) {
    const time = document.createElement(date.length === 4 ? 'p' : 'time');
    time.className = 'home-news-date';
    time.lang = 'en';
    time.setAttribute('data-i18n-skip', '');
    if (date.length === 4) {
      time.textContent = date;
    } else {
      time.dateTime = date;
      const formatter = date.length === 7 ? newsMonth : newsDay;
      time.textContent = formatter.format(new Date(date));
    }
    const entry = document.createElement('article');
    entry.className = 'home-news home-publication';
    const heading = document.createElement('h3');
    heading.append(...[...title.childNodes].map(node => node.cloneNode(true)));
    const details = document.createElement('p');
    details.className = 'meta';
    details.append(...[...metadata.childNodes].map(node => node.cloneNode(true)));
    entry.append(time, heading, details);
    if (summary) {
      const description = document.createElement('p');
      description.className = 'home-publication-summary';
      description.lang = 'en';
      description.setAttribute('data-i18n-skip', '');
      description.textContent = summary;
      entry.append(description);
    }
    newsEntries.push({ entry, date });
  }

  for (const { row, year } of papers) {
    addPublicationNews({
      date: row.dataset.newsDate || String(year),
      title: row.querySelector('h3'),
      metadata: row.lastElementChild,
      summary: row.dataset.newsSummary
    });
  }

  for (const row of document.querySelectorAll('#papers .output-row[data-news-date]')) {
    addPublicationNews({
      date: row.dataset.newsDate,
      title: row.querySelector('.output-title'),
      metadata: row.querySelector('.output-news-meta'),
      summary: row.dataset.newsSummary
    });
  }

  // ISO dates sort newest first, with less precise dates following their dated peers.
  newsEntries.sort((a, b) => b.date.localeCompare(a.date));
  const recentNewsCount = 6;
  newsList.prepend(...newsEntries.slice(0, recentNewsCount).map(({ entry }) => entry));

  const archive = document.getElementById('home-news-archive');
  const newsYears = new Map();
  for (const { entry, date } of newsEntries.slice(recentNewsCount)) {
    const year = date.slice(0, 4);
    if (!newsYears.has(year)) {
      const group = document.createElement('details');
      group.className = 'home-news-year';
      const summary = document.createElement('summary');
      summary.textContent = year;
      group.append(summary);
      newsYears.set(year, group);
    }
    newsYears.get(year).append(entry);
  }
  archive.querySelector('.home-news-archive-entries').append(...newsYears.values());
  archive.hidden = newsYears.size === 0;

  // Match figures to the bibliography to preserve its order and separate paper counts from frameworks.
  const paperByTitle = new Map(papers.map((paper, index) => [paper.title, { ...paper, index }]));
  const galleryItems = [...paperGallery.querySelectorAll('.image-card')].map(card => {
    const paper = paperByTitle.get(titleKey(card.querySelector('.image-open').dataset.title));
    if (paper && card.dataset.galleryKind !== 'framework') {
      card.dataset.galleryKind = 'paper';
      card.querySelector('.caption-kicker').append(` · ${paper.year}`);
    }
    return { card, paper };
  }).sort((a, b) => (a.paper?.index ?? Infinity) - (b.paper?.index ?? Infinity));
  paperGallery.append(...galleryItems.map(({ card }) => card));

  const spaceNames = { all: '全部论文', software: '软件空间', physical: '物理空间', science: '科学发现空间', other: '其他研究' };
  const paperCountFor = space => papers.filter(paper => space === 'all' || paper.space === space).length;

  function activatePaperTab(selected) {
    const space = selected.dataset.paperTab;
    selectTab(paperTabs, selected);
    paperPanel.setAttribute('aria-labelledby', selected.id);
    for (const { row } of papers) row.dataset.active = String(space === 'all' || row.dataset.paperSpace === space);
    paperPanel.querySelectorAll('[data-paper-intro]').forEach(intro => {
      intro.dataset.active = String(intro.dataset.paperIntro === space);
    });
    const visibleCards = galleryItems.filter(({ card }) => space === 'all' || card.dataset.paperSpace === space);
    for (const { card } of galleryItems) card.dataset.active = String(space === 'all' || card.dataset.paperSpace === space);

    const paperCount = paperCountFor(space);
    const representativeCount = visibleCards.filter(({ card }) => card.dataset.galleryKind === 'paper').length;
    const frameworkCount = visibleCards.filter(({ card }) => card.dataset.galleryKind === 'framework').length;
    paperGalleryHeading.hidden = paperGallery.hidden = visibleCards.length === 0;
    paperPanel.querySelector('[data-paper-index-count]').textContent = `共 ${paperCount} 篇`;
    paperPanel.querySelector('[data-paper-gallery-count]').textContent = `代表论文 ${representativeCount} 篇${frameworkCount ? ` · 核心框架 ${frameworkCount} 项` : ''}`;
    paperList.setAttribute('aria-label', `${spaceNames[space]} ${paperCount} 篇论文索引`);
    paperList.scrollTop = 0;
  }

  paperTabs.forEach(tab => {
    const count = paperCountFor(tab.dataset.paperTab);
    tab.querySelector('.paper-tab-count').textContent = `${count} 篇`;
  });
  bindTabs(paperTabList, paperTabs, activatePaperTab);
  activatePaperTab(paperTabs.find(tab => tab.getAttribute('aria-selected') === 'true'));
  showPage(pages.has(window.location.hash));

  const exchange = document.getElementById('exchange-dialog');
  const exchangeBody = document.getElementById('exchange-dialog-body');
  const exchangeTitle = document.getElementById('exchange-dialog-title');
  const zoom = document.getElementById('exchange-zoom');
  const zoomImage = document.getElementById('exchange-zoom-image');
  const zoomTitle = document.getElementById('exchange-zoom-title');
  const zoomCount = document.getElementById('exchange-zoom-count');
  let activeGallery;

  function updateZoom() {
    const { index, thumbs } = activeGallery;
    const photo = thumbs[index].dataset;
    zoomImage.src = photo.full;
    zoomImage.alt = photo.title;
    zoomTitle.textContent = photo.title;
    zoomCount.textContent = `${index + 1} / ${thumbs.length}`;
  }

  function initializeGallery(gallery) {
    const main = gallery.querySelector('.exchange-main');
    const photo = main.querySelector('img');
    const caption = gallery.querySelector('[data-exchange-caption]');
    const count = gallery.querySelector('[data-exchange-count]');
    const thumbs = [...gallery.querySelectorAll('.exchange-thumb')];

    const select = index => {
      activeGallery.index = (index + thumbs.length) % thumbs.length;
      const thumb = thumbs[activeGallery.index];
      photo.src = thumb.dataset.preview;
      photo.alt = thumb.dataset.title;
      main.setAttribute('aria-label', `放大查看 ${thumb.dataset.title}`);
      caption.textContent = thumb.dataset.caption;
      count.textContent = `${String(activeGallery.index + 1).padStart(2, '0')} / ${String(thumbs.length).padStart(2, '0')}`;
      thumbs.forEach(item => item.setAttribute('aria-pressed', String(item === thumb)));
      if (zoom.open) updateZoom();
    };

    activeGallery = { index: 0, thumbs, select };
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => select(index));
      thumb.addEventListener('keydown', event => {
        let destination;
        if (event.key === 'ArrowRight') destination = index + 1;
        else if (event.key === 'ArrowLeft') destination = index - 1;
        else if (event.key === 'Home') destination = 0;
        else if (event.key === 'End') destination = thumbs.length - 1;
        else return;
        event.preventDefault();
        select(destination);
        thumbs[activeGallery.index].focus();
      });
    });
    main.addEventListener('click', () => {
      updateZoom();
      zoom.showModal();
    });
  }

  document.querySelectorAll('[data-exchange-open]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const content = document.getElementById(trigger.dataset.exchangeOpen).content.cloneNode(true);
      const heading = content.querySelector('h3');
      exchangeTitle.textContent = heading.textContent;
      content.querySelector('.exchange-entry').setAttribute('aria-labelledby', exchangeTitle.id);
      heading.remove();
      exchangeBody.replaceChildren(content);
      initializeGallery(exchangeBody.querySelector('[data-exchange-gallery]'));
      exchange.showModal();
      exchange.scrollTop = 0;
    });
  });

  exchange.querySelector('[data-exchange-close]').addEventListener('click', () => exchange.close());
  zoom.querySelector('[data-photo-close]').addEventListener('click', () => zoom.close());
  zoom.querySelector('[data-photo-prev]').addEventListener('click', () => activeGallery.select(activeGallery.index - 1));
  zoom.querySelector('[data-photo-next]').addEventListener('click', () => activeGallery.select(activeGallery.index + 1));
  zoom.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    activeGallery.select(activeGallery.index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  closeOnBackdrop(exchange);
  closeOnBackdrop(zoom);
  zoom.addEventListener('close', () => zoomImage.removeAttribute('src'));
  exchange.addEventListener('close', () => {
    if (zoom.open) zoom.close();
    exchangeBody.replaceChildren();
    activeGallery = undefined;
  });
})();
