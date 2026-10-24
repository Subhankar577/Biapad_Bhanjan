/* Error Notebook — the single highest-leverage screen in Phase 2. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, L, esc, icon, emptyState } from './dom.js';
import { donut, barChart } from './charts.js';
import { todayKey, addDays, parseKey, logMcq, scheduleRevisions } from '../engine.js';
import { uid } from '../store.js';

const TYPES = [
  { id: 'concept', en: 'Concept gap', bn: 'কনসেপ্ট গ্যাপ', color: '#c9483f', ic: '🧠' },
  { id: 'silly', en: 'Silly mistake', bn: 'বোকা ভুল', color: '#d99a2b', ic: '😅' },
  { id: 'time', en: 'Time pressure', bn: 'সময়ের চাপ', color: '#2563b8', ic: '⏱' },
  { id: 'guess', en: 'Random guess', bn: 'আন্দাজ', color: '#6355d8', ic: '🎲' },
  { id: 'misread', en: 'Misread question', bn: 'প্রশ্ন ভুল পড়া', color: '#168a5f', ic: '👀' }
];
const STATUSES = [
  { id: 'new', en: 'New', bn: 'নতুন' },
  { id: 'reviewed', en: 'Reviewed', bn: 'দেখা হয়েছে' },
  { id: 'retested', en: 'Re-tested', bn: 'আবার পরীক্ষা' },
  { id: 'resolved', en: 'Resolved', bn: 'সমাধান' }
];

let fType = 'all', fStatus = 'all', fSearch = '';

function typeMeta(id) { return TYPES.find((t) => t.id === id) || TYPES[0]; }

export function render(state) {
  const errs = (state.errors || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const visible = errs.filter((e) => {
    if (fType !== 'all' && e.errorType !== fType) return false;
    if (fStatus !== 'all' && e.status !== fStatus) return false;
    if (fSearch && !(`${e.question} ${e.concept} ${e.source} ${e.correctAnswer}`).toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  });
  const byType = TYPES.map((t) => ({ label: bi(t.en, t.bn), value: errs.filter((e) => e.errorType === t.id).length, color: t.color }));
  const resolved = errs.filter((e) => e.status === 'resolved').length;
  const unitCounts = {};
  errs.forEach((e) => {
    if (!e.clusterId) return;
    const uid = e.clusterId.split('C')[0];
    unitCounts[uid] = (unitCounts[uid] || 0) + 1;
  });
  const topUnits = Object.entries(unitCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Error notebook', 'এরর নোটবুক')}</div>
      <div class="page-sub">${bi('Your mistakes are the syllabus you actually need', 'তোমার ভুলগুলোই আসল সিলেবাস')}</div></div>
    <button class="btn btn-primary btn-sm" data-act="err.new">${icon('plus', 15)} ${bi('Add error', 'ভুল যোগ')}</button>
  </div>

  <div class="grid g3">
    <div class="stat"><div class="stat-v">${errs.length}</div><div class="stat-k">${bi('errors logged', 'ভুল লগ')}</div></div>
    <div class="stat"><div class="stat-v">${errs.length ? Math.round((resolved / errs.length) * 100) : 0}%</div><div class="stat-k">${bi('resolved', 'সমাধান')}</div></div>
    <div class="stat"><div class="stat-v">${errs.filter((e) => e.status === 'new').length}</div><div class="stat-k">${bi('open', 'খোলা')}</div></div>
  </div>

  ${errs.length === 0 ? `<div class="card mt">${emptyState('📓', bi('No errors logged yet.', 'এখনও কোনো ভুল লগ করা হয়নি।'),
    bi('After every practice set, add each wrong answer here. Concept gaps automatically create a revision task.', 'প্রতিটি প্র্যাকটিসের পর প্রতিটি ভুল এখানে যোগ করো। কনসেপ্ট গ্যাপ স্বয়ংক্রিয়ভাবে রিভিশন তৈরি করবে।'),
    `<button class="btn btn-primary btn-sm" data-act="err.new">${icon('plus', 15)} ${bi('Add first error', 'প্রথম ভুল যোগ')}</button>`)}</div>` : `
  <div class="grid g2 mt">
    <div class="card tight"><div class="card-title mb">${bi('Error types', 'ভুলের ধরন')}</div>${donut(byType, 124)}</div>
    <div class="card tight"><div class="card-title mb">${bi('Most error-prone units', 'সবচেয়ে বেশি ভুলের ইউনিট')}</div>
      ${topUnits.length ? topUnits.map(([uid, n]) => {
        let u = null, p = null;
        state.syllabus.forEach((pp) => pp.units.forEach((uu) => { if (uu.id === uid) { u = uu; p = pp; } }));
        return `<div class="bar-row"><span>${p?.id === 'P1' ? 'I' : 'II'}·U${u?.n}</span>
          <div class="bar-track"><div class="bar-fill bad" style="width:${Math.min(100, (n / topUnits[0][1]) * 100)}%"></div></div>
          <span class="bar-val">${n}</span></div>`;
      }).join('') : `<div class="hint">${bi('Tag errors with a topic to see this.', 'টপিক ট্যাগ করলে এটি দেখা যাবে।')}</div>`}
    </div>
  </div>`}

  <div class="card mt">
    <div class="row wrap mb" style="gap:6px">
      <select class="select" data-change="err.filterType" style="width:auto;padding:7px 9px;font-size:.75rem">
        <option value="all">${bi('All types', 'সব ধরন')}</option>
        ${TYPES.map((t) => `<option value="${t.id}" ${fType === t.id ? 'selected' : ''}>${bi(t.en, t.bn)}</option>`).join('')}
      </select>
      <select class="select" data-change="err.filterStatus" style="width:auto;padding:7px 9px;font-size:.75rem">
        <option value="all">${bi('All statuses', 'সব স্টেটাস')}</option>
        ${STATUSES.map((s) => `<option value="${s.id}" ${fStatus === s.id ? 'selected' : ''}>${bi(s.en, s.bn)}</option>`).join('')}
      </select>
      <input class="input" data-input="err.search" value="${esc(fSearch)}" placeholder="${bi('Search errors', 'ভুল খোঁজো')}" style="width:150px;padding:7px 9px;font-size:.75rem">
    </div>
    <div class="col" style="gap:8px">
      ${visible.length === 0 ? `<div class="hint center" style="padding:16px">${bi('Nothing matches this filter.', 'এই ফিল্টারে কিছু নেই।')}</div>`
        : visible.map((e) => {
          const tm = typeMeta(e.errorType);
          const st = STATUSES.find((s) => s.id === e.status) || STATUSES[0];
          return `<div class="card tight" style="background:var(--surface-2);box-shadow:none">
            <div class="row between" style="align-items:flex-start;gap:8px">
              <div style="min-width:0">
                <div class="row wrap" style="gap:5px;margin-bottom:4px">
                  <span class="pill" style="background:${tm.color}22;color:${tm.color}">${tm.ic} ${bi(tm.en, tm.bn)}</span>
                  <span class="pill line">${esc(st.en)}</span>
                  <span class="tiny muted">${esc(e.date)}${e.source ? ' · ' + esc(e.source) : ''}</span>
                </div>
                <div style="font-size:.84rem;font-weight:600;line-height:1.45">${esc(e.question)}</div>
                <div class="tiny muted mt">${bi('Mine:', 'আমার:')} ${esc(e.myAnswer || '—')} · ${bi('Correct:', 'সঠিক:')} ${esc(e.correctAnswer || '—')}</div>
                ${e.concept ? `<div class="small mt" style="color:var(--ink-2)"><b>${bi('To revise:', 'রিভিশন:')}</b> ${esc(e.concept)}</div>` : ''}
              </div>
              <div class="row" style="gap:3px;flex:0 0 auto">
                <button class="icon-btn" data-act="err.status" data-id="${esc(e.id)}" data-s="retested" title="${bi('Mark re-tested', 'রি-টেস্টেড')}">${icon('refresh', 14)}</button>
                <button class="icon-btn" data-act="err.status" data-id="${esc(e.id)}" data-s="resolved" title="${bi('Mark resolved', 'সমাধান')}">${icon('check', 14)}</button>
                <button class="icon-btn" data-act="err.del" data-id="${esc(e.id)}" aria-label="${bi('Delete', 'মুছো')}">${icon('trash', 14)}</button>
              </div>
            </div>
          </div>`;
        }).join('')}
    </div>
  </div>

  <div class="note-band mt">${icon('info', 15)} <span>${bi('"Concept gap" errors automatically add a revision task for tomorrow and offer a flashcard. That is the loop that raises your score.',
    '"কনসেপ্ট গ্যাপ" ভুল স্বয়ংক্রিয়ভাবে কালকের রিভিশন যোগ করে ও ফ্ল্যাশকার্ড বানাতে বলে। এই লুপই স্কোর বাড়ায়।')}</span></div>
  `;
}

function errorSheet(state, R) {
  R.openSheet({
    title: bi('Add an error', 'একটি ভুল যোগ করো'),
    sub: bi('One line is enough. The tagging matters more than the wording.', 'এক লাইনই যথেষ্ট। লেখার চেয়ে ট্যাগিং বেশি জরুরি।'),
    body: () => `
      <form data-form="err.save">
        <div class="field"><label>${bi('What was the question?', 'প্রশ্নটি কী ছিল?')}</label>
          <textarea class="textarea" name="question" required placeholder="${bi('Short version: e.g. "Number of spanning trees in K4"', 'সংক্ষেপে: যেমন "K4-এ স্প্যানিং ট্রির সংখ্যা"')}"></textarea></div>
        <div class="row mt" style="gap:8px">
          <div class="field" style="flex:1"><label>${bi('Source', 'সূত্র')}</label><input class="input" name="source" placeholder="${bi('PYQ 2019 / mock 3 / GFG set', 'PYQ 2019 / মক ৩ / GFG সেট')}"></div>
          <div class="field" style="flex:1"><label>${bi('Date', 'তারিখ')}</label><input class="input" type="date" name="date" value="${todayKey()}"></div>
        </div>
        <div class="row mt" style="gap:8px">
          <div class="field" style="flex:1"><label>${bi('My answer', 'আমার উত্তর')}</label><input class="input" name="myAnswer"></div>
          <div class="field" style="flex:1"><label>${bi('Correct answer', 'সঠিক উত্তর')}</label><input class="input" name="correctAnswer"></div>
        </div>
        <div class="field mt"><label>${bi('Error type', 'ভুলের ধরন')}</label>
          <div class="row wrap" style="gap:6px">
            ${TYPES.map((t) => `<label class="chip"><input type="radio" name="errorType" value="${t.id}" ${t.id === 'concept' ? 'checked' : ''} style="margin-right:4px;accent-color:var(--brand)"> ${t.ic} ${bi(t.en, t.bn)}</label>`).join('')}
          </div></div>
        <div class="field mt"><label>${bi('Related topic', 'সম্পর্কিত টপিক')}</label>
          <select class="select" name="clusterId">
            <option value="">${bi('— not sure —', '— নিশ্চিত নই —')}</option>
            ${state.syllabus.map((p) => p.units.map((u) => `<optgroup label="${esc(p.short.en)} · U${u.n} ${esc(u.name.en)}">${u.clusters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('')).join('')}
          </select></div>
        <div class="field mt"><label>${bi('Concept to revise', 'যে কনসেপ্ট রিভিশন দরকার')}</label>
          <input class="input" name="concept" placeholder="${bi('e.g. Cayley\u2019s formula n^(n-2)', 'যেমন Cayley-র সূত্র n^(n-2)')}"></div>
        <button class="btn btn-primary btn-block mt" type="submit">${icon('check', 16)} ${bi('Save error', 'ভুল সেভ')}</button>
      </form>
      <div class="note-band mt">${icon('info', 15)} <span>${bi('"Concept gap" errors create a revision task at D+1 and prompt a flashcard.', '"কনসেপ্ট গ্যাপ" ভুল D+1-এ রিভিশন তৈরি করে ও ফ্ল্যাশকার্ডের প্রস্তাব দেয়।')}</span></div>`
  });
}

register('err.new', () => errorSheet(R.state, R));
register('err.filterType', ({ value }) => { fType = value; R.refresh(); });
register('err.filterStatus', ({ value }) => { fStatus = value; R.refresh(); });
register('err.status', ({ data }) => {
  const state = R.state;
  const e = (state.errors || []).find((x) => x.id === data.id);
  if (!e) return;
  e.status = data.s;
  e.statusAt = todayKey();
  R.save(); R.refresh();
  R.toast(bi(`Marked ${data.s}.`, `${data.s} মার্ক হয়েছে।`), 'ok');
});
register('err.del', ({ data }) => {
  R.state.errors = (R.state.errors || []).filter((x) => x.id !== data.id);
  R.save(); R.refresh();
});
register('err.flash', ({ data }) => {
  const state = R.state;
  const e = (state.errors || []).find((x) => x.id === data.id);
  if (!e) return;
  state.flashcards = state.flashcards || [];
  state.flashcards.push({
    id: uid('fc'), front: e.question, back: e.correctAnswer || e.concept || '',
    clusterId: e.clusterId || '', box: 1, createdAt: todayKey(), dueKey: addDays(todayKey(), 1), reviews: 0
  });
  R.save();
  R.toast(bi('Flashcard created from the error.', 'ভুল থেকে ফ্ল্যাশকার্ড তৈরি হয়েছে।'), 'ok');
});
registerForm('err.save', ({ data }) => {
  const state = R.state;
  const err = {
    id: uid('err'),
    date: data.date || todayKey(),
    question: String(data.question || '').slice(0, 500),
    source: data.source || '',
    myAnswer: data.myAnswer || '',
    correctAnswer: data.correctAnswer || '',
    errorType: data.errorType || 'concept',
    clusterId: data.clusterId || '',
    concept: data.concept || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };
  state.errors = state.errors || [];
  state.errors.unshift(err);
  if (err.errorType === 'concept' && err.clusterId) {
    state.revisions = state.revisions || [];
    state.revisions.push({ id: `err-${err.id}`, clusterId: err.clusterId, due: addDays(todayKey(), 1), offset: 1, done: false, kind: 'error' });
  }
  R.save(); R.refresh();
  if (err.errorType === 'concept') {
    R.openSheet({
      title: bi('Make a flashcard?', 'ফ্ল্যাশকার্ড বানাবে?'),
      sub: bi('This error is a concept gap — a card will catch it next time.', 'এই ভুলটি কনসেপ্ট গ্যাপ — একটি কার্ড পরের বার ধরবে।'),
      body: `<form data-form="flash.add">
        <input type="hidden" name="clusterId" value="${esc(err.clusterId)}">
        <div class="field"><label>${bi('Front (question)', 'সামনে (প্রশ্ন)')}</label>
          <textarea class="textarea" name="front" required style="min-height:70px">${esc(err.question)}</textarea></div>
        <div class="field mt"><label>${bi('Back (answer / concept)', 'পেছনে (উত্তর / কনসেপ্ট)')}</label>
          <textarea class="textarea" name="back" required style="min-height:70px">${esc(err.correctAnswer || err.concept || '')}</textarea></div>
        <button class="btn btn-primary btn-block mt" type="submit">${icon('cards', 16)} ${bi('Create flashcard', 'ফ্ল্যাশকার্ড তৈরি')}</button>
        <button class="btn btn-ghost btn-block mt" type="button" data-act="sheet.close">${bi('Not now', 'এখন নয়')}</button>
      </form>`,
      after: () => {}
    });
  } else {
    R.closeSheet();
    R.toast(bi('Error saved.', 'ভুল সেভ হয়েছে।'), 'ok');
  }
});
onInput('err.search', ({ value }) => { fSearch = value; R.refresh(); });
