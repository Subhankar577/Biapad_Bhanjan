/* Shared jsdom harness. */
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { defaultState } from '../js/store.js';
import { rebuildPlan } from '../js/engine.js';

export async function boot(seedPatch = {}) {
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
  global.CustomEvent = window.CustomEvent;
  global.FileReader = window.FileReader;
  global.FormData = window.FormData;
  Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {} }));
  window.print = () => {};
  window.scrollTo = () => {};

  const seed = Object.assign(defaultState(), seedPatch);
  seed.onboardingComplete = true;
  seed.profile.name = seed.profile.name || 'Riya';
  seed.profile.startDate = seed.profile.startDate || '2026-01-05';
  seed.profile.lang = seed.profile.lang || 'en';
  rebuildPlan(seed);
  localStorage.setItem('netcompass.v1', JSON.stringify(seed));

  const app = await import('../js/app.js');
  const root = window.document.getElementById('app');
  const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
  const go = async (hash) => { window.location.hash = hash.startsWith('#') ? hash : `#/${hash}`; await wait(30); };
  return { window, document: window.document, app, root, errors, go, wait, seed };
}
