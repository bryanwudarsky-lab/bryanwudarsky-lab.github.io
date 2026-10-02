'use strict';

/* Hiring lenses: the hero eyebrow and lede, which cases lead, and which highlights show (in order). */
const LENSES = {
  finance: {
    eyebrow: 'Financial Analysis · Business Analysis',
    label: 'Finance & analysis',
    cases: ['case-grocery', 'case-policy'],
    metrics: ['m-goals', 'm-deposits', 'm-resale', 'm-pass', 'm-participants'],
    lede: 'Cost models, market comparisons, and margin tracking, built on banking experience.'
  },
  ops: {
    eyebrow: 'Operations · Process · Reporting',
    label: 'Operations',
    cases: ['case-resale', 'case-grocery'],
    metrics: ['m-productivity', 'm-resale', 'm-participants', 'm-goals', 'm-pass'],
    lede: 'Process, logistics, and reporting, from a 25% productivity gain to 1,000+ transactions run end to end.'
  },
  ld: {
    eyebrow: 'Learning & Development · Program Coordination',
    label: 'Learning & development',
    cases: ['case-curriculum', 'case-training'],
    metrics: ['m-participants', 'm-pass', 'm-grades', 'm-productivity', 'm-goals'],
    lede: 'Program design and delivery for 150+ participants a year, with a 100% certification pass rate.'
  },
  tech: {
    eyebrow: 'Data Analysis · Technical Projects',
    label: 'Technical & data analysis',
    cases: ['case-agentic', 'case-buildlab'],
    metrics: ['m-validation', 'm-productivity', 'm-resale', 'm-pass', 'm-participants'],
    lede: 'Self-hosted software and data tools, with results validated across 100,000 randomized cases.'
  }
};

/* Weighted market score: sum(rating x weight) / sum(weight), highest first. */
function scoreMarkets(markets, weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return markets
    .map(m => ({ ...m, total: Object.keys(weights).reduce((t, k) => t + m.scores[k] * weights[k], 0) / sum }))
    .sort((a, b) => b.total - a.total);
}

/* Distribution-center cost spread across n stores, in $M. */
function allocate(capital, n) {
  return {
    shareLow: capital.dcLow / n, shareHigh: capital.dcHigh / n,
    totalLow: capital.storeSideLow + capital.dcLow / n, totalHigh: capital.storeSideHigh + capital.dcHigh / n
  };
}

if (typeof document !== 'undefined') {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /* Theme toggle: system preference by default, manual choice remembered. */
  const root = document.documentElement;
  const themeButton = $('.theme-toggle');
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  const labelTheme = () => themeButton.setAttribute('aria-label', `Switch to ${currentTheme() === 'dark' ? 'light' : 'dark'} theme`);
  themeButton.hidden = false;
  labelTheme();
  themeButton.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: choice lasts for this page view */ }
    labelTheme();
  });
  darkQuery.addEventListener('change', labelTheme);

  /* Header compacts once the page scrolls. */
  const header = $('.site-header');
  let ticking = false;
  const setCompact = () => { header.classList.toggle('is-compact', window.scrollY > 24); ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(setCompact); } }, { passive: true });
  setCompact();

  /* Hiring lens: reorders cases and highlights, swaps the hero lede, marks matching experience and skills. */
  const casesEl = $('.cases');
  const allCases = $$('.case', casesEl);
  const metricsEl = $('#metrics');
  const allMetrics = $$('.metric', metricsEl);
  const heroEyebrow = $('#hero-eyebrow');
  const heroLede = $('#hero-lede');
  const matchCount = $('#match-count');
  const moreLabel = document.createElement('h3');
  moreLabel.className = 'cases-more-label';
  moreLabel.textContent = 'More case studies';
  const lensStatus = $('#lens-status');
  const caseTitle = id => $(`#${id} h3`).textContent;

  function setCaseExpanded(article, expanded) {
    article.classList.toggle('is-compact', !expanded);
    const toggle = $('.case-toggle', article);
    toggle.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  function applyLens(key) {
    const lens = LENSES[key] ? key : 'finance';
    const config = LENSES[lens];
    document.body.dataset.lens = lens;
    const radio = $(`input[name="lens"][value="${lens}"]`);
    if (radio) radio.checked = true;

    config.cases.forEach(id => casesEl.append(document.getElementById(id)));
    casesEl.append(moreLabel);
    allCases.filter(c => !config.cases.includes(c.id)).forEach(c => casesEl.append(c));
    allCases.forEach(c => {
      const match = config.cases.includes(c.id);
      c.classList.toggle('is-match', match);
      setCaseExpanded(c, match);
    });

    allMetrics.forEach(m => { m.hidden = !config.metrics.includes(m.id); });
    config.metrics.forEach(id => metricsEl.append(document.getElementById(id)));
    allMetrics.filter(m => m.hidden).forEach(m => metricsEl.append(m));
    // each term stays whole; a wrapped line starts with its separator instead of ending on one
    heroEyebrow.replaceChildren(...config.eyebrow.split(' · ').flatMap((term, i) => {
      const s = document.createElement('span');
      s.className = 'nw';
      s.textContent = (i ? '· ' : '') + term;
      return i ? [' ', s] : [s];
    }));
    heroLede.textContent = config.lede;

    const has = el => (el.dataset.lens || '').split(' ').includes(lens);
    const bullets = $$('.bullets li');
    bullets.forEach(li => li.classList.toggle('is-match', has(li)));
    $$('.tl-item').forEach(item => item.classList.toggle('is-match', !!$('.bullets li.is-match', item)));
    $$('.lane').forEach(lane => lane.classList.toggle('is-match', !!document.getElementById(lane.dataset.row)?.classList.contains('is-match')));
    $$('.skill').forEach(skill => skill.classList.toggle('is-match', has(skill)));
    const matched = bullets.filter(li => li.classList.contains('is-match')).length;
    matchCount.textContent = `${matched} of ${bullets.length} bullets match ${config.label}.`;

    lensStatus.textContent = `${config.label}: leading with ${config.cases.map(caseTitle).join(' and ')}. Matching experience and skills are marked.`;
    const url = new URL(location.href);
    if (url.searchParams.get('role') !== lens) {
      url.searchParams.set('role', lens);
      history.replaceState(history.state, '', url);
    }
  }
  $$('input[name="lens"]').forEach(input => input.addEventListener('change', () => applyLens(input.value)));
  applyLens(new URLSearchParams(location.search).get('role'));

  $$('.case-toggle').forEach(button => button.addEventListener('click', () => {
    const article = button.closest('.case');
    setCaseExpanded(article, true);
    const title = $('h3', article);
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }));

  /* Links into a collapsed case or closed disclosure open it first. */
  function reveal(hash) {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const article = target.closest('.case');
    if (article && article.classList.contains('is-compact')) setCaseExpanded(article, true);
    for (let node = target; node && node !== document.body; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.hash);
  });
  window.addEventListener('hashchange', () => reveal(location.hash));
  if (location.hash) { reveal(location.hash); requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView()); }

  /* Grocery study: market weights (with animated re-sort) and distribution allocation. */
  const study = JSON.parse($('#grocery-data').textContent);
  const weightsForm = $('#grocery-weights');
  const weightInputs = $$('[data-weight]', weightsForm);
  const ranking = $('#grocery-ranking-results');
  const weightStatus = $('#weight-status');
  const weightTotal = $('#weight-total');
  const studyWeight = id => study.criteria.find(c => c.id === id).weight;
  weightsForm.hidden = false;
  weightsForm.addEventListener('submit', event => event.preventDefault());
  function updateRanking() {
    const sum = weightInputs.reduce((a, input) => a + Number(input.value), 0);
    weightTotal.textContent = Number.isFinite(sum) ? sum : '';
    if (!weightInputs.every(input => input.value.trim() !== '' && input.validity.valid) || sum <= 0) {
      weightStatus.textContent = 'Use whole numbers from 0 to 100, with at least one above zero.';
      return;
    }
    const weights = Object.fromEntries(weightInputs.map(input => [input.dataset.weight, Number(input.value)]));
    const scored = scoreMarkets(study.markets, weights);
    const rows = $$('li', ranking);
    const before = new Map(rows.map(row => [row, row.getBoundingClientRect().top]));
    scored.forEach((m, i) => {
      const row = $(`[data-market="${m.id}"]`, ranking);
      $('.rank-n', row).textContent = i + 1;
      $('.rank-score', row).textContent = m.total.toFixed(2);
      $('.rank-track span', row).style.transform = `scaleX(${m.total / 5})`;
      ranking.append(row);
    });
    if (!reducedMotion.matches) {
      rows.forEach(row => {
        const delta = before.get(row) - row.getBoundingClientRect().top;
        if (!delta) return;
        row.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
      });
    }
    const original = weightInputs.every(input => Number(input.value) === studyWeight(input.dataset.weight));
    weightStatus.textContent = `${original ? 'Study weights' : 'Your weights'}. ${scored[0].label} leads at ${scored[0].total.toFixed(2)}.`;
  }
  weightsForm.addEventListener('input', updateRanking);
  weightsForm.addEventListener('reset', () => requestAnimationFrame(updateRanking));
  updateRanking();

  const cluster = $('#cluster-stores');
  const money = (lo, hi) => `$${lo.toFixed(2)}M to $${hi.toFixed(2)}M`;
  cluster.disabled = false;
  function updateAllocation() {
    const n = Number(cluster.value);
    const a = allocate(study.capital, n);
    const share = money(a.shareLow, a.shareHigh);
    const total = money(a.totalLow, a.totalHigh);
    const label = `${n} ${n === 1 ? 'store' : 'stores'}`;
    $('#cluster-count').textContent = label;
    $('#dc-allocation').textContent = share;
    $('#store-allocation').textContent = total;
    $('#allocation-status').textContent = `${label}: distribution share ${share} per store; store-side cost plus share ${total}.`;
  }
  cluster.addEventListener('input', updateAllocation);
  updateAllocation();

  /* Copy email. */
  const copyButton = $('.copy-email');
  if (navigator.clipboard && window.isSecureContext) {
    const copyStatus = $('#copy-status');
    const copyLabel = $('.copy-label', copyButton);
    const emailLink = $('.email-link');
    let resetTimer, flashTimer;
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      clearTimeout(resetTimer);
      try {
        await navigator.clipboard.writeText('bryanwudarsky@gmail.com');
        copyButton.classList.add('is-copied');
        copyLabel.textContent = 'Copied';
        copyStatus.textContent = 'Email address copied to your clipboard.';
        emailLink.classList.add('is-flash');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => emailLink.classList.remove('is-flash'), 600);
      } catch (e) {
        copyStatus.textContent = 'Copy was blocked. Select the address above instead.';
      }
      resetTimer = setTimeout(() => {
        copyButton.classList.remove('is-copied');
        copyLabel.textContent = 'Copy';
        copyStatus.textContent = '';
      }, 2500);
    });
  }

  /* Print everything expanded. */
  let printState = null;
  window.addEventListener('beforeprint', () => {
    printState = { compact: $$('.case.is-compact'), closed: $$('details:not([open])') };
    printState.compact.forEach(c => c.classList.remove('is-compact'));
    printState.closed.forEach(d => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printState.compact.forEach(c => c.classList.add('is-compact'));
    printState.closed.forEach(d => { d.open = false; });
    printState = null;
  });
}
if (typeof module !== 'undefined') module.exports = { LENSES, scoreMarkets, allocate };
