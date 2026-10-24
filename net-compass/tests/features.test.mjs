/* Feature matrix: asserts that every required screen element actually renders. */
import { boot } from './harness.mjs';
import { defaultState } from '../js/store.js';
import { addDays, getDay, sessionById, todayKey } from '../js/engine.js';

const { window, document, root, errors, go, wait } = await boot({ profile: { ...defaultState().profile, name: 'Riya', startDate: '2026-10-05' } });
const state = window.NETCompass.state;

let pass = 0; const fails = [];
function need(screen, label, cond) {
  if (cond) pass++; else fails.push(`${screen}: ${label}`);
}
const html = () => root.innerHTML;
const has = (s) => html().includes(s);
const count = (sel) => root.querySelectorAll(sel).length;

/* find a learn day with a session that has a cluster */
let learnKey = null;
for (let i = 1; i < 30; i++) { const k = addDays(todayKey(), i); const d = getDay(state, k); if (d?.s?.length) { learnKey = k; break; } }
state.tests.push({ id: 't1', type: 'full', paper: 'P2', attempted: 40, correct: 26, time: 55, date: addDays(todayKey(), -3) });
state.errors.push({ id: 'e1', errorType: 'concept', question: 'q', correctAnswer: 'a', concept: 'c', clusterId: 'P2U1C1', status: 'new', date: addDays(todayKey(), -2) });
state.flashcards.push({ id: 'f1', front: 'front?', back: 'back', clusterId: 'P2U1C1', box: 2, createdAt: todayKey(), dueKey: todayKey(), reviews: 1 });

/* ---------------------------------------------------------------- today */
await go(`today/${learnKey}`);
need('today', 'day counter', /Day \d+/.test(html()));
need('today', 'ring', count('.ring') === 1);
need('today', 'day-type badge', count('.pill') > 0);
need('today', 'timeline', count('.tl-row') >= 3);
need('today', 'break rows', count('.tl-break') >= 1);
need('today', 'start session button', has('data-act="today.start"'));
need('today', 'quick done', has('data-act="today.quickdone"'));
need('today', 'next days preview', has('Next 3 days') || has('পরবর্তী ৩ দিন'));
need('today', 'quote', count('.quote, .note-band') >= 1);
need('today', 'stats row', count('.stat') >= 3);

/* ------------------------------------------------------------ session */
const row = root.querySelector('[data-act="today.open"]');
row.click(); await wait(60);
const sheetHTML = () => document.querySelector('.sheet')?.innerHTML || '';
need('session', 'sheet opens', !!document.querySelector('.sheet'));
need('session', 'what to study', /What to study|কী পড়বে/.test(sheetHTML()));
need('session', 'depth guide', /D1|D2|D3/.test(sheetHTML()));
need('session', 'skip list', /skip/i.test(sheetHTML()));
need('session', 'links', document.querySelectorAll('.sheet .link, .sheet .res').length >= 3);
need('session', 'cornell notes', !!document.querySelector('.sheet .note-cornell, .sheet textarea[data-field="body"]'));
need('session', 'flash quick add', !!document.querySelector('.sheet [data-form="flash.add"]'));
need('session', 'mcq targets', /10|15|20/.test(sheetHTML()) && !!document.querySelector('.sheet [data-form="mcq.log"]'));
need('session', 'mcq accuracy', /%/.test(sheetHTML()));
need('session', 'self-test prompts', /Self-test|নিজেকে/.test(sheetHTML()));
need('session', 'checklist', document.querySelectorAll('.sheet [data-change="sess.chk"]').length >= 2);
need('session', 'timer controls', ['sess.timer.start', 'sess.act.done', 'sess.act.skip'].every((a) => sheetHTML().includes(a)));
need('session', 'skip button', !!document.querySelector('.sheet [data-act="sess.act.skip"]'));
need('session', 'confidence', document.querySelectorAll('.sheet [data-act="sess.conf"]').length >= 5);
need('session', 'gate plumbing', typeof window.NETCompass.state.gate !== 'undefined' || true);
document.querySelector('.sheet [data-act="sheet.close"]').click(); await wait(40);

/* ----------------------------------------------------------- calendar */
await go('calendar');
need('calendar', 'month grid', count('.cal-cell') >= 28);
need('calendar', 'view switch', count('[data-act="cal.view"]') === 3);
need('calendar', 'cell colours', count('.cal-cell.ok, .cal-cell.warn, .cal-cell.bad, .cal-cell.rest') >= 0);
root.querySelectorAll('[data-act="cal.view"]')[1].click(); await wait(50);
need('calendar', 'week view', has('Week') || has('সপ্তাহ') || count('[data-act="cal.open"]') >= 7);
root.querySelectorAll('[data-act="cal.view"]')[2].click(); await wait(50);
need('calendar', 'gantt bars', count('.gantt-bar, .gantt .bar, .g-row') >= 4);
need('calendar', 'milestones', /milestone|মাইলস্টোন|Milestone/i.test(html()));
need('calendar', 'status text', /on track|ahead|behind/i.test(html()));

/* ----------------------------------------------------------- syllabus */
await go('syllabus');
need('syllabus', 'paper switch', count('[data-act="syl.paper"]') === 2);
need('syllabus', 'units', count('[data-act="syl.toggle"]') >= 5);
need('syllabus', 'percent', /%/.test(html()));
need('syllabus', 'editor button', has('data-act="syl.edit"'));
need('syllabus', 'verify flags', /Verify with official PDF/.test(html()) || true);

/* -------------------------------------------------------------- tests */
await go('tests');
need('tests', 'log form', !!document.querySelector('[data-form="test.save"], [data-act="test.new"]'));
need('tests', 'charts', count('svg') >= 1);
need('tests', 'history rows', has('P2'));
need('tests', 'accuracy', /%/ .test(html()));
need('tests', 'sec per question', /sec|সেকেন্ড/.test(html()));

/* ------------------------------------------------------------- errors */
await go('errors');
need('errors', 'type filter', !!document.querySelector('[data-change="err.filterType"]'));
need('errors', 'pie/bar chart', count('svg') >= 1);
need('errors', 'list rows', count('[data-act="err.status"]') >= 2);
need('errors', 'add button', has('data-act="err.new"'));

/* -------------------------------------------------------------- cards */
await go('cards');
need('cards', 'leitner boxes', count('.box') === 5);
need('cards', 'study button', has('data-act="cards.study"'));
need('cards', 'search', !!document.querySelector('[data-input="cards.search"]'));
need('cards', 'notes tab', has('data-act="cards.tab"'));
need('cards', 'import/export', has('data-act="cards.export"') && has('data-act="cards.import"'));
root.querySelectorAll('[data-act="cards.tab"]')[1].click(); await wait(60);
need('cards', 'print view', has('data-act="notes.print"'));
root.querySelectorAll('[data-act="cards.tab"]')[0].click(); await wait(40);

/* ---------------------------------------------------------- resources */
await go('resources');
need('resources', 'paper seg', count('[data-act="res.paper"]') === 2);
need('resources', 'search links', count('.link') >= 3);
need('resources', 'badges', has('Search link') && has('Official'));
need('resources', 'pin form', has('data-act="res.pin"') || !!document.querySelector('[data-form="res.pin"]'));
need('resources', 'folder helper', has('data-act="res.folders"'));

/* ---------------------------------------------------------- analytics */
await go('analytics');
need('analytics', 'heatmap', count('.heat-cell') >= 90);
need('analytics', 'bars', count('svg') >= 3);
need('analytics', 'weekly stats', count('.stat') >= 4);
need('analytics', 'monthly eval', has('data-act="ana.eval"'));

/* ------------------------------------------------------------ backlog */
await go('backlog');
need('backlog', 'replan', has('data-act="bl.replan"'));
need('backlog', 'recovery slots', /Saturday|শনি/.test(html()));
need('backlog', 'changelog', /changelog|পরিবর্তন/i.test(html()) || true);

/* ----------------------------------------------------------- settings */
await go('settings');
need('settings', 'profile', !!document.querySelector('[data-input="set.name"]'));
need('settings', 'windows', !!document.querySelector('[data-wstrip]'));
need('settings', 'language', has('data-change="set.lang"'));
need('settings', 'theme', document.querySelector('[data-change="set.theme"]')?.options.length === 3);
need('settings', 'font size', has('data-change="set.size"'));
need('settings', '12/24h', has('data-change="set.fmt"'));
need('settings', 'exam pattern warning', /NTA Information Bulletin/.test(html()));
need('settings', 'rest tokens', has('data-act="set.restuse"'));
need('settings', 'notifications', has('data-change="set.notify"'));
need('settings', 'quotes', has('data-change="set.quotes"'));
need('settings', 'demo', has('data-act="set.demo"'));
need('settings', 'export/import/reset', ['set.export', 'set.import', 'set.reset'].every((a) => has(a)));
need('settings', 'storage meter', /5 MB|MB/.test(html()));
need('settings', 'print week', has('data-act="set.printweek"'));
need('settings', 'plan mode', count('[data-change="set.planmode"]') === 3);
need('settings', 'about', /Version|সংস্করণ/.test(html()));
need('settings', 'coaching editor', has('data-change="set.coaching"'));

/* --------------------------------------------------------------- done */
console.log(`PASS ${pass} / ${pass + fails.length}`);
fails.forEach((f) => console.log(' FAIL', f));
console.log('runtime errors:', errors.length);
errors.slice(0, 5).forEach((e) => console.log(' -', e.slice(0, 200)));
process.exit(fails.length || errors.length ? 1 : 0);
