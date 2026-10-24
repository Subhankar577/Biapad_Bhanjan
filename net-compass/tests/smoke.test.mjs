/* Boots the real app in jsdom, then visits every screen and a few flows. */
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { defaultState, SCHEMA_VERSION } from '../js/store.js';
import { rebuildPlan } from '../js/engine.js';

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.message || e)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost:8000/index.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.Blob = window.Blob;
global.URL = window.URL;
global.HTMLElement = window.HTMLElement;
Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true, writable: true });
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
global.CustomEvent = window.CustomEvent;
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {} }));
window.print = () => {};
window.scrollTo = () => {};

// seed a state that has already completed onboarding and generated a plan
const seed = defaultState();
seed.onboardingComplete = true;
seed.profile.name = 'Riya';
seed.profile.startDate = '2026-01-05';
seed.profile.lang = 'en';
seed.profile.theme = 'light';
rebuildPlan(seed);
localStorage.setItem('netcompass.v1', JSON.stringify(seed));

let app;
try {
  app = await import('../js/app.js');
} catch (e) {
  console.error('IMPORT FAILED', e);
  process.exit(1);
}

const root = document.getElementById('app');
console.log('booted, app html length', root.innerHTML.length);
console.log('has onboarding?', root.innerHTML.includes('Welcome aboard'));

async function goto(screen) {
  window.location.hash = `#/${screen}`;
  await new Promise((r) => setTimeout(r, 15));
  const html = root.innerHTML;
  const label = `#/${screen}`;
  if (html.length < 500) errors.push(`EMPTY ${label} (${html.length})`);
  if (/undefined|\[object Object\]|NaN/.test(html.replace(/data-[a-z-]+="[^"]*"/g, ''))) {
    errors.push(`SUSPECT TOKEN in ${label}: ` + (html.match(/undefined|\[object Object\]|NaN/g) || []).slice(0, 3).join(','));
  }
  console.log(label.padEnd(14), String(html.length).padStart(7));
}

for (const s of ['today', 'calendar', 'syllabus', 'tests', 'errors', 'cards', 'resources', 'analytics', 'backlog', 'settings', 'setup']) {
  await goto(s);
}

// click through every data-act button visible per screen, catching throws
window.location.hash = '#/today';
await new Promise((r) => setTimeout(r, 20));
const actions = Array.from(root.querySelectorAll('[data-act]')).map((el) => el.getAttribute('data-act'));
console.log('today actions', [...new Set(actions)].join(', '));

// language toggle
root.querySelector('[data-act="lang.toggle"]').click();
await new Promise((r) => setTimeout(r, 30));
console.log('after lang toggle, bn present:', root.innerHTML.includes('আজ') || root.innerHTML.includes('শুভ'));
root.querySelector('[data-act="lang.toggle"]').click();
await new Promise((r) => setTimeout(r, 30));

// open first session card
const row = root.querySelector('[data-act="today.open"]');
if (row) {
  row.click();
  await new Promise((r) => setTimeout(r, 30));
  const sheet = document.querySelector('.sheet');
  console.log('session sheet open:', !!sheet, 'len', sheet ? sheet.innerHTML.length : 0);
  if (sheet && /undefined|NaN/.test(sheet.textContent)) console.log('sheet suspicious text');
  const close = document.querySelector('[data-act="sheet.close"]');
  if (close) close.click();
}

// windows screen drag mount
window.location.hash = '#/settings';
await new Promise((r) => setTimeout(r, 30));
console.log('settings windows strip:', !!document.querySelector('[data-wstrip]'));

console.log('\nERRORS:', errors.length);
errors.slice(0, 20).forEach((e) => console.log(' -', e.slice(0, 400)));
process.exit(errors.length ? 1 : 0);
