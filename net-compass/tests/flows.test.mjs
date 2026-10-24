/* End-to-end flows: a study day, revision, backlog, cards, tests, settings. */
import { boot } from './harness.mjs';
import { defaultState } from '../js/store.js';
import { getDay, addDays, todayKey, sessionById, dayProgress, gateResults, buildTimeline } from '../js/engine.js';

const { window, document, root, errors, go, wait } = await boot({
  profile: { ...defaultState().profile, name: 'Riya', startDate: '2026-10-05' }
});
const state = window.NETCompass.state;
const results = [];
function check(label, cond, extra = '') {
  results.push({ label, ok: !!cond, extra });
  if (!cond) console.log('  ✗', label, extra);
}

/* ------------------------------------------------ a full learning session */
const sid = state.plan.days['2026-10-28'].s[0];
const sess = sessionById(state, sid);
await go('today/2026-10-28');
check('timeline renders', root.querySelectorAll('.tl-row').length >= 5);

// open the last block of the day, which belongs to the same cluster
const rows = Array.from(root.querySelectorAll('[data-act="today.open"]'));
rows[rows.length - 1].click();
await wait(60);
check('session card opens', !!document.querySelector('.sheet'));
check('what to study block', /What to study/.test(document.querySelector('.sheet').textContent));
check('links with badges', document.querySelectorAll('.sheet .link').length >= 3);
check('cornell notes', !!document.querySelector('.sheet textarea[data-field="cue"]'));

// write a Cornell note
const cue = document.querySelector('.sheet textarea[data-field="cue"]');
cue.value = 'p→q false only when p true, q false';
cue.dispatchEvent(new window.Event('input', { bubbles: true }));
await wait(40);
check('note autosaves', (state.notes[sid] || {}).cue?.includes('p→q'));

// flashcard quick-add
const ff = document.querySelector('.sheet form[data-form="flash.add"]');
ff.querySelector('[name="front"]').value = 'When is p→q false?';
ff.querySelector('[name="back"]').value = 'When p is true and q is false.';
ff.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(50);
check('flashcard added from session', state.flashcards.length === 1, `n=${state.flashcards.length}`);

// MCQ log with accuracy maths
const mf = document.querySelector('.sheet form[data-form="mcq.log"]');
mf.querySelector('[name="attempted"]').value = '20';
mf.querySelector('[name="correct"]').value = '15';
mf.querySelector('[name="time"]').value = '24';
mf.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(60);
const mcq = state.mcqTotals[sess.clusterId];
check('mcq totals stored', mcq && mcq.attempted === 20 && mcq.correct === 15, JSON.stringify(mcq));

// self-explanation + confidence, then the gate
const explain = document.querySelector('.sheet [data-act="gate.explain"]');
if (explain) { explain.click(); await wait(40); }
const conf4 = Array.from(document.querySelectorAll('.sheet [data-act="sess.conf"]')).find((b) => b.dataset.n === '4');
conf4.click();
await wait(50);
const g = gateResults(state, sess);
check('gate reads 3/3', g.passed === 3, JSON.stringify(g));
const applyGate = document.querySelector('.sheet [data-act="gate.apply"]');
check('gate apply button', !!applyGate);
if (applyGate) { applyGate.click(); await wait(120); }
check('cluster marked done', state.clusters[sess.clusterId]?.status === 'done');
check('revisions scheduled at 4 offsets', state.revisions.filter((r) => r.clusterId === sess.clusterId).length === 4);

// checklist + finish sheet
const chk = document.querySelector('.sheet [data-change="sess.chk"]');
if (chk) { chk.checked = true; chk.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(40); }
const closeBtn = document.querySelector('.sheet [data-act="sheet.close"]');
if (closeBtn) closeBtn.click();
await wait(50);

// mark the whole day done with quick-done
for (let i = 0; i < 14; i++) {
  const b = root.querySelector('[data-act="today.quickdone"]');
  if (!b) break;
  b.click();
  await wait(20);
}
check('day complete', dayProgress(state, '2026-10-28').complete, JSON.stringify(dayProgress(state, '2026-10-28')));

/* ------------------------------------------------------------------ rest */
await go('today');
const rest = document.querySelector('[data-act="today.rest"]');
if (rest) { rest.click(); await wait(80); }
check('rest token consumed', state.restDays.includes(todayKey()), JSON.stringify(state.restDays));
check('rest day uses template H', getDay(state, todayKey())?.t === 'H');

await go('settings');
const undo = document.querySelector('[data-act="set.restundo"]');
if (undo) { undo.click(); await wait(80); }
check('rest token undo', state.restDays.length === 0);

/* ---------------------------------------------------------------- tests */
await go('tests');
document.querySelector('[data-act="test.new"]').click();
await wait(60);
const tf = document.querySelector('form[data-form="test.save"]');
tf.querySelector('[name="attempted"]').value = '30';
tf.querySelector('[name="correct"]').value = '21';
tf.querySelector('[name="time"]').value = '40';
tf.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(80);
const t = state.tests[0];
check('test logged', t && t.attempted === 30 && t.correct === 21);
const historyText = root.textContent.replace(/\s+/g, ' ');
check('score shown in history', historyText.includes('42'), historyText.slice(0, 120));
check('accuracy shown in history', historyText.includes('70%'));
check('speed shown in history', /80/.test(historyText));

/* --------------------------------------------------------------- errors */
await go('errors');
document.querySelector('[data-act="err.new"]').click();
await wait(60);
const ef = document.querySelector('form[data-form="err.save"]');
ef.querySelector('[name="question"]').value = 'Edges in K5?';
ef.querySelector('[name="correctAnswer"]').value = '10';
ef.querySelector('[name="concept"]').value = 'n(n-1)/2';
ef.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(100);
check('error saved', state.errors.length === 1);
check('concept gap opens flashcard prompt', !!document.querySelector('.sheet'));

/* ---------------------------------------------------------------- cards */
await go('cards');
const cf = document.querySelector('form[data-form="flash.add"]');
if (cf) {
  cf.querySelector('[name="front"]').value = 'BFS uses which structure?';
  cf.querySelector('[name="back"]').value = 'A queue.';
  cf.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await wait(60);
}
check('flashcard added from library', state.flashcards.length === 2);
const study = document.querySelector('[data-act="cards.study"]');
check('study mode button enabled', study && !study.disabled);
if (study && !study.disabled) {
  study.click(); await wait(60);
  check('study front shown', !!document.querySelector('[data-act="cards.reveal"]'));
  document.querySelector('[data-act="cards.reveal"]').click(); await wait(50);
  const good = document.querySelector('[data-act="cards.right"]');
  if (good) { good.click(); await wait(60); }
  check('card box advanced', state.flashcards.some((c) => c.box === 2), JSON.stringify(state.flashcards.map((c) => c.box)));
}

/* -------------------------------------------------------------- backlog */
await go('backlog');
document.querySelector('[data-act="bl.replan"]').click();
await wait(80);
check('replan preview opens', !!document.querySelector('.sheet'));
const apply = document.querySelector('[data-act="bl.apply"]');
check('replan apply button', !!apply);
if (apply) { apply.click(); await wait(150); }
check('changelog written', state.changelog.length === 1);
check('plan still has 730 days', Object.keys(state.plan.days).length === 730);

/* ------------------------------------------------------------- settings */
await go('settings');
const examForm = document.querySelector('form[data-form="set.exam"]');
examForm.querySelector('[name="p1q"]').value = '50';
examForm.querySelector('[name="p1m"]').value = '100';
examForm.querySelector('[name="p1t"]').value = '60';
examForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(80);
check('exam pattern saved unverified', state.profile.examPattern.verified === false && state.profile.examPattern.total.questions === 150,
  JSON.stringify(state.profile.examPattern.total));

// reset guard: wrong word keeps data
document.querySelector('[data-act="set.reset"]').click();
await wait(60);
const rform = document.querySelector('form[data-form="set.resetgo"]');
rform.querySelector('[name="confirm"]').value = 'NOPE';
rform.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(60);
check('reset blocked without RESET', Object.keys(state.plan.days).length === 730);
const toasts = Array.from(document.querySelectorAll('.toast')).map((n) => n.textContent).join(' | ');
check('reset error toast', /RESET/.test(toasts), toasts);

/* ------------------------------------------------------------- language */
await go('today');
document.querySelector('[data-act="lang.toggle"]').click();
await wait(80);
check('bengali UI', /আজ|শুভ|দিন/.test(root.textContent) && state.profile.lang === 'bn');
document.querySelector('[data-act="lang.toggle"]').click();
await wait(60);

/* ---------------------------------------------------------------- done */
const bad = results.filter((r) => !r.ok);
console.log(`flows: ${results.length - bad.length}/${results.length} passed`);
console.log('runtime errors:', errors.length);
errors.slice(0, 6).forEach((e) => console.log(' -', e.slice(0, 220)));
process.exit(bad.length || errors.length ? 1 : 0);
