/* =========================================================================
   NET Compass — local storage layer
   Versioned schema, defensive loading, export / import, storage estimate.
   No backend, no login, no network.
   ========================================================================= */

import { cloneSyllabus, PAPERS, PAPER_II_ORDER } from './data/syllabus.js';
import { DEFAULT_QUOTES } from './data/quotes.js';
import { todayKey, addDays, parseKey } from './engine.js';

export const SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'netcompass.v1';
export const STORAGE_LIMIT = 5 * 1024 * 1024; // typical localStorage budget

function windowsDefault() {
  const w = [{ start: '05:30', end: '08:45' }];
  return { 0: JSON.parse(JSON.stringify(w)), 1: JSON.parse(JSON.stringify(w)), 2: JSON.parse(JSON.stringify(w)),
    3: JSON.parse(JSON.stringify(w)), 4: JSON.parse(JSON.stringify(w)), 5: JSON.parse(JSON.stringify(w)), 6: JSON.parse(JSON.stringify(w)) };
}

function defaultExamPattern() {
  return {
    p1: { questions: 50, marks: 100, minutes: 60, marksPerQ: 2 },
    p2: { questions: 100, marks: 200, minutes: 120, marksPerQ: 2 },
    total: { questions: 150, marks: 300, minutes: 180 },
    negative: 'none', // none | 0.5 | custom
    customNegative: 0,
    verified: false
  };
}

function nextExamWindow() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() + 1 };
}

export function defaultState() {
  const target = nextExamWindow();
  return {
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    onboardingComplete: false,
    profile: {
      name: '',
      lang: 'en',
      theme: 'auto',
      fontSize: 'medium',
      timeFormat: '12',
      startDate: todayKey(),
      targetExam: target,
      wake: '05:00',
      ritual: { enabled: true, start: '05:00', end: '05:30' },
      sleep: '22:30',
      studyWindows: windowsDefault(),
      coaching: { started: false, slots: [] },
      planMode: 'parallel',
      customSplit: { p1: [3], p2: [1, 2, 4, 5] },
      unitOrderP2: PAPER_II_ORDER.slice(),
      notifications: false,
      sounds: true,
      confetti: true,
      showQuotes: true,
      targetScore: null,
      examPattern: defaultExamPattern()
    },
    syllabus: cloneSyllabus(),
    syllabusHistory: [],
    plan: { days: {}, builtAt: null, fromKey: null },
    sessions: {},
    clusters: {},
    actLog: {},
    notes: {},
    flashcards: [],
    revisions: [],
    tests: [],
    errors: [],
    pins: [],
    mcqTotals: {},
    restDays: [],
    buffers: [],
    changelog: [],
    monthlyEvals: [],
    coachingDoubts: [],
    quotes: DEFAULT_QUOTES.map((q) => ({ ...q })),
    settings: { holiday: false },
    demo: false,
    timer: null
  };
}

/* --------------------------------------------------------------- loading */
function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

export function migrate(raw) {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const out = { ...base, ...raw };
  out.profile = { ...base.profile, ...(isObj(raw.profile) ? raw.profile : {}) };
  out.profile.ritual = { ...base.profile.ritual, ...(isObj(raw.profile?.ritual) ? raw.profile.ritual : {}) };
  out.profile.coaching = { ...base.profile.coaching, ...(isObj(raw.profile?.coaching) ? raw.profile.coaching : {}) };
  out.profile.coaching.slots = Array.isArray(raw.profile?.coaching?.slots) ? raw.profile.coaching.slots : [];
  out.profile.examPattern = { ...base.profile.examPattern, ...(isObj(raw.profile?.examPattern) ? raw.profile.examPattern : {}) };
  out.profile.studyWindows = isObj(raw.profile?.studyWindows) ? { ...base.profile.studyWindows, ...raw.profile.studyWindows } : base.profile.studyWindows;
  out.profile.unitOrderP2 = Array.isArray(raw.profile?.unitOrderP2) && raw.profile.unitOrderP2.length
    ? raw.profile.unitOrderP2 : PAPER_II_ORDER.slice();
  out.profile.customSplit = { ...base.profile.customSplit, ...(isObj(raw.profile?.customSplit) ? raw.profile.customSplit : {}) };
  if (!Array.isArray(out.profile.unitOrderP2)) out.profile.unitOrderP2 = PAPER_II_ORDER.slice();

  // syllabus sanity
  if (!Array.isArray(raw.syllabus) || raw.syllabus.length !== 2 || !raw.syllabus.every((p) => Array.isArray(p.units))) {
    out.syllabus = cloneSyllabus();
  }
  const arrKeys = ['flashcards', 'revisions', 'tests', 'errors', 'pins', 'restDays', 'buffers', 'changelog', 'monthlyEvals', 'coachingDoubts', 'syllabusHistory'];
  arrKeys.forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
  ['sessions', 'clusters', 'actLog', 'notes', 'mcqTotals'].forEach((k) => { if (!isObj(out[k])) out[k] = {}; });
  if (!isObj(out.plan) || !isObj(out.plan.days)) out.plan = { days: {}, builtAt: null, fromKey: null };
  if (!Array.isArray(out.quotes) || !out.quotes.length) out.quotes = DEFAULT_QUOTES.map((q) => ({ ...q }));
  out.version = SCHEMA_VERSION;
  return out;
}

export function load() {
  let rawText = null;
  try { rawText = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage blocked */ }
  if (!rawText) return { state: defaultState(), fresh: true, error: null };
  try {
    const raw = JSON.parse(rawText);
    const state = migrate(raw);
    return { state, fresh: false, error: null };
  } catch (e) {
    return { state: defaultState(), fresh: true, error: 'corrupt' };
  }
}

export function save(state) {
  try {
    const text = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, text);
    return { ok: true, bytes: text.length };
  } catch (e) {
    return { ok: false, bytes: 0, error: e && e.name === 'QuotaExceededError' ? 'quota' : 'unknown' };
  }
}

export function storageBytes(state) {
  try { return new Blob([JSON.stringify(state)]).size; } catch (e) { return JSON.stringify(state).length; }
}

export function storagePct(state) {
  return Math.min(100, Math.round((storageBytes(state) / STORAGE_LIMIT) * 100));
}

/* --------------------------------------------------------- export/import */
export function exportFilename(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `net-compass-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export function exportJSON(state) {
  const payload = { app: 'NET Compass', schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), state };
  return JSON.stringify(payload, null, 2);
}

export function validateImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'Not valid JSON.' }; }
  const raw = obj && obj.state ? obj.state : obj;
  if (!isObj(raw)) return { ok: false, error: 'Backup file has no data object.' };
  const core = ['profile', 'sessions', 'clusters', 'plan'].filter((k) => isObj(raw[k]));
  if (!core.length) return { ok: false, error: 'This does not look like a NET Compass backup.' };
  const state = migrate(raw);
  const warnings = [];
  if (!Array.isArray(raw.syllabus)) warnings.push('Syllabus was missing and has been reset to the official data.');
  if (obj && obj.schema && obj.schema > SCHEMA_VERSION) warnings.push('This backup was made by a newer app version. Some fields may be ignored.');
  return { ok: true, state, warnings, meta: { exportedAt: obj.exportedAt || null, schema: obj.schema || null } };
}

export function downloadFile(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ------------------------------------------------------------- utilities */
export function resetState() { return defaultState(); }

export function monthKeyOf(key) { return String(key).slice(0, 7); }

export function restTokensUsedThisMonth(state, ref = todayKey()) {
  const m = monthKeyOf(ref);
  return (state.restDays || []).filter((k) => monthKeyOf(k) === m).length;
}

export function restTokensLeft(state, ref = todayKey()) {
  return Math.max(0, 2 - restTokensUsedThisMonth(state, ref));
}

export function targetExamDate(state) {
  const t = state.profile.targetExam || {};
  const y = Number(t.year) || new Date().getFullYear() + 1;
  const m = Number(t.month) || 6;
  // UGC NET sessions generally run in June and December; use the 15th as a neutral marker
  return `${y}-${String(m).padStart(2, '0')}-15`;
}

export function daysToExam(state) {
  const t = parseKey(targetExamDate(state));
  const now = parseKey(todayKey());
  return Math.round((t - now) / 86400000);
}

export function findPinForCluster(state, clusterId) {
  return (state.pins || []).find((p) => p.clusterId === clusterId && !p.broken) || null;
}

export function nowISO() { return new Date().toISOString(); }

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export { PAPERS };
