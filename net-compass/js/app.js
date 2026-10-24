/* =========================================================================
   NET Compass — application shell, router, timer, service worker
   ========================================================================= */

import { load, save as persist, storagePct } from './store.js';
import {
  todayKey, dayNumber, keyForDay, rebuildPlan, parseKey, addDays, dayNet, streak,
  overallProgress, backlogItems, dueRevisions, dueFlashcards, dayNumber as dn,
  addActivityMinutes, dayProgress
} from './engine.js';
import { R, lang } from './runtime.js';
import { bi, L, esc, icon } from './ui/dom.js';
import { bindGlobal } from './ui/actions.js';
import * as todayScreen from './ui/today.js';
import * as calendarScreen from './ui/calendar.js';
import * as syllabusScreen from './ui/syllabus.js';
import * as testsScreen from './ui/tests.js';
import * as errorsScreen from './ui/errors.js';
import * as cardsScreen from './ui/cards.js';
import * as resourcesScreen from './ui/resources.js';
import * as analyticsScreen from './ui/analytics.js';
import * as backlogScreen from './ui/backlog.js';
import * as settingsScreen from './ui/settings.js';
import * as onboarding from './ui/onboarding.js';

const APP_VERSION = '1.0.0';
const SCREENS = {
  today: todayScreen, calendar: calendarScreen, syllabus: syllabusScreen, tests: testsScreen,
  errors: errorsScreen, cards: cardsScreen, resources: resourcesScreen,
  analytics: analyticsScreen, backlog: backlogScreen, settings: settingsScreen
};

const NAV = [
  { id: 'today', ic: 'sun', en: 'Today', bn: 'আজ' },
  { id: 'calendar', ic: 'calendar', en: 'Calendar', bn: 'ক্যালেন্ডার' },
  { id: 'syllabus', ic: 'book', en: 'Syllabus', bn: 'সিলেবাস' },
  { id: 'tests', ic: 'chart', en: 'Tests', bn: 'টেস্ট' },
  { id: 'more', ic: 'menu', en: 'More', bn: 'আরও' }
];
const MORE_ITEMS = [
  { id: 'analytics', ic: 'chart', en: 'Analytics', bn: 'অ্যানালিটিক্স' },
  { id: 'errors', ic: 'alert', en: 'Error Notebook', bn: 'এরর নোটবুক' },
  { id: 'cards', ic: 'cards', en: 'Cards & Notes', bn: 'কার্ড ও নোট' },
  { id: 'resources', ic: 'folder', en: 'Resources', bn: 'রিসোর্স' },
  { id: 'backlog', ic: 'list', en: 'Backlog', bn: 'ব্যাকলগ' },
  { id: 'settings', ic: 'settings', en: 'Settings', bn: 'সেটিংস' }
];

const { state: loadedState, fresh, error: loadError } = load();
const state = loadedState;
R.state = state;

/* --------------------------------------------------------------- theme */
function resolveTheme() {
  const t = state.profile.theme || 'auto';
  if (t === 'auto') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t;
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', resolveTheme());
  document.documentElement.setAttribute('data-lang', state.profile.lang || 'en');
  document.documentElement.setAttribute('data-size', state.profile.fontSize || 'medium');
  document.documentElement.setAttribute('lang', state.profile.lang === 'bn' ? 'bn' : 'en');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolveTheme() === 'dark' ? '#0b0e18' : '#3B3AA8');
}
applyTheme();
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if ((state.profile.theme || 'auto') === 'auto') render();
  });
}

/* ---------------------------------------------------------------- save */
let activeScreen = null;
let saveTimer = null;
let warnedStorage = false;
function save(immediate = false) {
  const doIt = () => {
    const res = persist(state);
    if (!res.ok) toast(bi('Could not save: storage is full. Export a backup and remove some notes.', 'সেভ হয়নি: স্টোরেজ ভরে গেছে। ব্যাকআপ ডাউনলোড করে কিছু নোট মুছুন।'), 'bad');
    const pct = storagePct(state);
    if (pct >= 80 && !warnedStorage) {
      warnedStorage = true;
      toast(bi(`Storage is ${pct}% full. Export a backup soon.`, `স্টোরেজ ${pct}% ভরে গেছে। শিগগিরই ব্যাকআপ নিন।`), 'warn');
    }
  };
  if (immediate) { clearTimeout(saveTimer); doIt(); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doIt, 350);
}

/* ---------------------------------------------------------------- toast */
const toastRoot = document.getElementById('toast-root');
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  toastRoot.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; t.style.transition = '.3s'; }, 3200);
  setTimeout(() => t.remove(), 3600);
}

/* ---------------------------------------------------------------- sheet */
let sheetCfg = null;
function openSheet(cfg) {
  sheetCfg = cfg;
  renderSheet();
}
function closeSheet() {
  sheetCfg = null;
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  document.body.style.overflow = '';
}
function renderSheet() {
  const root = document.getElementById('modal-root');
  if (!sheetCfg) { root.innerHTML = ''; return; }
  const body = typeof sheetCfg.body === 'function' ? sheetCfg.body() : sheetCfg.body;
  root.innerHTML = `
    <div class="backdrop" data-act="sheet.close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(sheetCfg.title || '')}">
      <div class="grab"></div>
      <div class="sheet-head">
        <div style="flex:1;min-width:0">
          <div class="sheet-title">${sheetCfg.title || ''}</div>
          ${sheetCfg.sub ? `<div class="sheet-sub">${sheetCfg.sub}</div>` : ''}
        </div>
        <button class="icon-btn" data-act="sheet.close" aria-label="${bi('Close', 'বন্ধ')}">${icon('x', 17)}</button>
      </div>
      <div class="sheet-body" id="sheet-body">${body}</div>
    </div>`;
  document.body.style.overflow = 'hidden';
  if (typeof sheetCfg.after === 'function') sheetCfg.after(root);
}
function refreshSheet() { if (sheetCfg) renderSheet(); }

/* ---------------------------------------------------------------- timer */
function timerElapsedMs() {
  const t = state.timer;
  if (!t) return 0;
  return (t.accumulated || 0) + (t.running ? Date.now() - t.startedAt : 0);
}
function timerLabel(ms = timerElapsedMs()) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
function timerStart(key, actIndex) {
  const t = state.timer;
  if (t && t.running && (t.key !== key || t.actIndex !== actIndex)) timerPause();
  if (state.timer && state.timer.key === key && state.timer.actIndex === actIndex) {
    state.timer.running = true;
    state.timer.startedAt = Date.now();
  } else {
    state.timer = { key, actIndex, startedAt: Date.now(), accumulated: 0, running: true };
  }
  save();
  tick();
}
function timerPause() {
  if (!state.timer || !state.timer.running) return;
  state.timer.accumulated = timerElapsedMs();
  state.timer.running = false;
  save();
  tick();
}
function timerReset() {
  state.timer = null;
  save();
  tick();
}
function timerStop(log = true) {
  if (!state.timer) return 0;
  const mins = Math.round(timerElapsedMs() / 60000);
  const { key, actIndex } = state.timer;
  if (log && mins >= 1) addActivityMinutes(state, key, actIndex, mins);
  state.timer = null;
  save();
  tick();
  return mins;
}

function tick() {
  const el = document.querySelector('[data-timer-display]');
  if (el) el.textContent = timerLabel();
  const chip = document.querySelector('[data-running-chip]');
  if (chip) {
    if (state.timer && state.timer.running) {
      const d = document.querySelector('[data-chip-time]');
      if (d) d.textContent = timerLabel();
    }
  }
  if (!document.querySelector('[data-running-chip]') && state.timer && state.timer.running) {
    const slot = document.querySelector('[data-timer-slot]');
    if (slot) slot.innerHTML = runningChipHTML();
  }
  // cap warning: logged minutes today + the running block against this day's net time
  if (state.timer && state.timer.running) {
    const key = state.timer.key;
    const spent = dayProgress(state, key).loggedMinutes + timerElapsedMs() / 60000;
    const cap = dayNet(state, key);
    if (cap > 0 && spent > cap + 5 && tick._warnedFor !== key) {
      tick._warnedFor = key;
      toast(bi('You are past today’s planned study time. Rest is part of the plan.', 'আজকের পরিকল্পিত পড়ার সময় পেরিয়ে গেছে। বিশ্রামও প্ল্যানের অংশ।'), 'warn');
    }
  }
}

function runningChipHTML() {
  const t = state.timer;
  if (!t) return '';
  return `<button class="day-chip" data-act="timer.open" title="${bi('Running timer', 'চলমান টাইমার')}">
    <span class="flame">⏱</span><span data-chip-time>${timerLabel()}</span>
    <span style="opacity:.6">${esc(shortActivity(t.key))}</span></button>`;
}
function shortActivity(key) {
  try {
    return `${bi('Day', 'দিন')} ${dn(state.profile.startDate, key)}`;
  } catch (e) { return ''; }
}

/* ------------------------------------------------------------- confetti */
function confetti() {
  if (!state.profile.confetti) return;
  const c = document.getElementById('confetti');
  if (!c) return;
  if (typeof requestAnimationFrame === 'undefined') return;
  let ctx = null;
  try { ctx = c.getContext && c.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) return;
  c.width = window.innerWidth; c.height = window.innerHeight;
  c.classList.add('on');
  const colors = ['#6355d8', '#d99a2b', '#168a5f', '#c9483f', '#2563b8'];
  const parts = Array.from({ length: 90 }, () => ({
    x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.45,
    y: c.height * 0.28 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 7,
    vy: -Math.random() * 9 - 2,
    s: 4 + Math.random() * 5,
    r: Math.random() * Math.PI,
    col: colors[Math.floor(Math.random() * colors.length)],
    life: 0
  }));
  let frame = 0;
  function loop() {
    frame++;
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.vx *= 0.99; p.r += 0.08; p.life++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.col; ctx.globalAlpha = Math.max(0, 1 - p.life / 150);
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    if (frame < 170) requestAnimationFrame(loop);
    else { ctx.clearRect(0, 0, c.width, c.height); c.classList.remove('on'); }
  }
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------- the plan */
function ensurePlan({ force = false } = {}) {
  if (!state.onboardingComplete) return;
  const hasDays = state.plan && state.plan.days && Object.keys(state.plan.days).length > 0;
  if (!hasDays || force) {
    rebuildPlan(state);
    save(true);
  }
}

/* ------------------------------------------------------------ rendering */
function currentScreen() {
  const raw = (location.hash || '#/today').replace(/^#\/?/, '');
  const [name, ...rest] = raw.split('/');
  const clean = name || 'today';
  if (clean === 'setup') return { name: 'setup', param: rest.join('/') };
  return { name: SCREENS[clean] ? clean : 'today', param: rest.join('/') };
}

function navHTML(active, mobile) {
  if (mobile) {
    return NAV.map((n) => {
      const isActive = n.id === active || (n.id === 'more' && MORE_ITEMS.some((m) => m.id === active));
      return `<button class="nb-item ${isActive ? 'active' : ''}" data-act="nav.go" data-to="${n.id}" aria-label="${bi(n.en, n.bn)}">
        ${icon(n.ic, 22)}<span>${bi(n.en, n.bn)}</span><span class="dot"></span></button>`;
    }).join('');
  }
  const all = [...NAV.filter((n) => n.id !== 'more'), ...MORE_ITEMS];
  return `<div class="side-in">
    ${all.map((n) => `<button class="side-item ${n.id === active ? 'active' : ''}" data-act="nav.go" data-to="${n.id}">
      ${icon(n.ic, 19)}<span>${bi(n.en, n.bn)}</span></button>`).join('')}
  </div>`;
}

function topbarHTML() {
  const dayNo = dayNumber(state.profile.startDate, todayKey());
  const s = streak(state);
  return `<header class="topbar"><div class="topbar-in">
    <a class="brand" href="#/today" data-act="nav.go" data-to="today" style="color:inherit;text-decoration:none">
      <span class="brand-mark">${icon('compass', 22)}</span>
      <span class="brand-txt">
        <span class="brand-name">${bi('NET Compass', 'নেট কম্পাস')}</span>
        <span class="brand-tag">${bi('Every day one step, goal NET', 'প্রতিদিন এক ধাপ, লক্ষ্য NET')}</span>
      </span>
    </a>
    <div class="topbar-actions">
      <span class="day-chip" data-timer-slot>
        ${state.timer && state.timer.running
          ? runningChipHTML()
          : `<span class="flame">🔥</span> ${s} · ${bi('Day', 'দিন')} ${Math.max(1, dayNo)}/730`}
      </span>
      <button class="icon-btn" data-act="lang.toggle" title="${bi('Switch language', 'ভাষা বদলাও')}" aria-label="${bi('Switch language', 'ভাষা বদলাও')}">${icon('globe', 17)}</button>
      <button class="icon-btn" data-act="theme.toggle" title="${bi('Theme', 'থিম')}" aria-label="${bi('Theme', 'থিম')}">${icon(resolveTheme() === 'dark' ? 'sun' : 'moon', 17)}</button>
    </div>
  </div></header>`;
}

function render() {
  const root = document.getElementById('app');
  applyTheme();
  if (!state.onboardingComplete) {
    activeScreen = null;
    root.innerHTML = onboarding.render(state, R);
    onboarding.after && onboarding.after(state, R);
    return;
  }
  ensurePlan();
  const { name, param } = currentScreen();
  if (name === 'setup') {
    if (activeScreen !== 'setup') onboarding.resetWizard();
    activeScreen = 'setup';
    root.innerHTML = onboarding.render(state, R, { editing: true });
    onboarding.after && onboarding.after(state, R, { editing: true });
    return;
  }
  const screen = SCREENS[name] || todayScreen;
  activeScreen = name;
  const content = screen.render(state, param, R) || '';
  root.innerHTML = `${topbarHTML()}
    <div class="shell">
      <aside class="side">${navHTML(name, false)}</aside>
      <main class="main" id="main"><div class="screen" data-screen="${name}">${content}</div></main>
    </div>
    <nav class="nav-bottom">${navHTML(name, true)}</nav>`;
  if (screen.after) screen.after(state, param, R);
  tick();
}

function refresh() { render(); }

/* ------------------------------------------------------------- R wiring */
R.state = state;
R.save = save;
R.refresh = refresh;
R.go = (h) => { location.hash = h.startsWith('#') ? h : `#/${h}`; };
R.toast = toast;
R.openSheet = openSheet;
R.closeSheet = closeSheet;
R.refreshSheet = refreshSheet;
R.confetti = confetti;
R.ensurePlan = ensurePlan;
R.timerStart = timerStart;
R.timerPause = timerPause;
R.timerStop = timerStop;
R.timerReset = timerReset;
R.timerElapsed = timerElapsedMs;
R.timerLabel = timerLabel;
R.timerRunning = () => !!(state.timer && state.timer.running);
R.version = APP_VERSION;
R.APP_VERSION = APP_VERSION;
R.SCREENS = SCREENS;
R.MORE_ITEMS = MORE_ITEMS;
R.openSession = (key, actIndex) => {
  const mod = todayScreen;
  if (mod.openSessionSheet) mod.openSessionSheet(state, R, key, actIndex);
};

/* --------------------------------------------------------------- routes */
window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0, behavior: 'instant' }); });

/* nav + sheet + timer actions */
import { register } from './ui/actions.js';
register('nav.go', ({ data }) => {
  if (data.to === 'more') { openMoreSheet(); return; }
  R.go(data.to);
});
register('sheet.close', () => closeSheet());
register('lang.toggle', () => {
  state.profile.lang = state.profile.lang === 'bn' ? 'en' : 'bn';
  save(true); render();
});
register('theme.toggle', () => {
  const cur = resolveTheme();
  state.profile.theme = cur === 'dark' ? 'light' : 'dark';
  save(true); render();
});
register('timer.open', () => {
  if (!state.timer) return;
  R.go(`today`);
});
register('timer.start', () => {
  if (!state.timer) return;
  timerStart(state.timer.key, state.timer.actIndex);
  refreshSheet();
});
register('timer.pause', () => { timerPause(); refreshSheet(); });
register('timer.stop', () => {
  const mins = timerStop(true);
  toast(bi(`Logged ${mins} min.`, `${mins} মিনিট লগ হয়েছে।`));
  closeSheet();
  render();
});
register('timer.reset', () => { timerReset(); refreshSheet(); });
register('open.more', () => openMoreSheet());

function openMoreSheet() {
  openSheet({
    title: bi('More', 'আরও'),
    body: `<div class="col" style="gap:6px">
      ${MORE_ITEMS.map((m) => `<button class="row" data-act="nav.go" data-to="${m.id}"
        style="gap:12px;padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--surface-2);text-align:left;width:100%">
        <span style="width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--brand-soft);color:var(--brand)">${icon(m.ic, 18)}</span>
        <b style="font-size:.9rem">${bi(m.en, m.bn)}</b>
        <span style="margin-left:auto;color:var(--muted)">${icon('chevron', 16)}</span>
      </button>`).join('')}
      <div class="hr"></div>
      <button class="btn btn-ghost btn-block" data-act="nav.go" data-to="setup">${icon('settings', 16)} ${bi('Re-run setup', 'সেটআপ আবার চালাও')}</button>
      <div class="tiny muted center">${bi('NET Compass v', 'নেট কম্পাস v')}${APP_VERSION} · ${bi('works offline', 'অফলাইনেও চলে')}</div>
    </div>`
  });
}

/* ------------------------------------------------------------- interval */
setInterval(() => { if (state.timer && state.timer.running) tick(); }, 1000);

/* notifications: gentle reminder at study-window start (needs permission) */
let lastNotified = '';
setInterval(() => {
  if (!state.profile.notifications) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const key = todayKey();
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const wd = now.getDay();
  const wins = (state.profile.studyWindows || {})[wd] || [];
  wins.forEach((w) => {
    const [h, m] = w.start.split(':').map(Number);
    if (h * 60 + m === mins) {
      const tag = `${key}-${w.start}`;
      if (lastNotified === tag) return;
      lastNotified = tag;
      new Notification(bi('Time to study', 'পড়ার সময়'), {
        body: bi(`Your ${w.start} study window starts now. ${dayNet(state, key)} minutes of net study today.`,
          `তোমার ${w.start} স্টাডি উইন্ডো শুরু হচ্ছে। আজ ${dayNet(state, key)} মিনিট নেট পড়া।`),
        icon: 'icons/icon-192.png'
      });
    }
  });
}, 30000);

/* --------------------------------------------------------------- boot */
bindGlobal(document.getElementById('app'), { state, toast, openSheet, closeSheet, save, render });
bindGlobal(document.getElementById('modal-root'), { state, toast, openSheet, closeSheet, save, render });

if (loadError === 'corrupt') {
  setTimeout(() => toast(bi('Saved data was unreadable. Started with a clean plan.', 'সেভ করা ডেটা পড়া যায়নি। নতুন প্ল্যান দিয়ে শুরু হয়েছে।'), 'warn'), 600);
}
if (fresh && 'serviceWorker' in navigator) {
  // first run — SW is registered below anyway
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline still works via browser cache */ });
  });
}

render();
window.NETCompass = { state, R, render, save };
