/* PYQ & mock tracker: log a test, see trends, per-unit accuracy, history. */
import { R } from '../runtime.js';
import { register, registerForm } from './actions.js';
import { bi, esc, icon, emptyState, monthGrid } from './dom.js';
import { lineChart, barChart, donut } from './charts.js';
import { todayKey, parseKey, unitProgress, overallProgress, keyForDay, monthLabel } from '../engine.js';
import { uid } from '../store.js';

let filterType = 'all';
let filterPaper = 'all';
let search = '';
let sortKey = 'date';
let sortDir = -1;

function scoreOf(state, t) {
  const pat = state.profile.examPattern;
  const per = t.paper === 'P1' ? pat.p1.marksPerQ : pat.p2.marksPerQ;
  const neg = pat.negative === 'none' ? 0 : Number(pat.negative) || Number(pat.customNegative) || 0;
  const correct = Number(t.correct) || 0;
  const wrong = Number(t.wrong) || Math.max(0, (Number(t.attempted) || 0) - correct);
  return Math.max(-999, correct * per - (t.paper === 'Both' ? 0 : wrong * neg));
}

function statsOf(state, t) {
  const attempted = Number(t.attempted) || 0;
  const correct = Number(t.correct) || 0;
  const wrong = Number(t.wrong) || Math.max(0, attempted - correct);
  const unanswered = Number(t.unanswered) || 0;
  const time = Number(t.time) || 0;
  return {
    attempted, correct, wrong, unanswered, time,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    speed: attempted ? Math.round((time * 60) / attempted) : 0,
    score: scoreOf(state, t)
  };
}

export function render(state) {
  const tests = (state.tests || []).slice();
  const pat = state.profile.examPattern;
  const sorted = tests.slice().sort((a, b) => {
    if (sortKey === 'score') return (statsOf(state, a).score - statsOf(state, b).score) * sortDir;
    if (sortKey === 'accuracy') return (statsOf(state, a).accuracy - statsOf(state, b).accuracy) * sortDir;
    return (a.date > b.date ? 1 : a.date < b.date ? -1 : 0) * sortDir;
  });
  const visible = sorted.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterPaper !== 'all' && t.paper !== filterPaper && t.paper !== 'Both') return false;
    if (search && !(`${t.name || ''} ${t.notes || ''} ${t.date} ${(t.units || []).join(' ')}`).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const accuracySeries = sorted.slice(-12).map((t) => statsOf(state, t).accuracy);
  const speedSeries = sorted.slice(-12).map((t) => statsOf(state, t).speed);
  const scoreSeries = sorted.slice(-12).map((t) => statsOf(state, t).score);
  const labels = sorted.slice(-12).map((t) => t.date.slice(5));
  const p1 = tests.filter((t) => t.paper === 'P1');
  const p2 = tests.filter((t) => t.paper === 'P2');
  const both = tests.filter((t) => t.paper === 'Both');
  const avg = (arr, f) => arr.length ? Math.round(arr.reduce((s, t) => s + f(statsOf(state, t)), 0) / arr.length) : 0;

  const unitAcc = [];
  state.syllabus.forEach((p) => p.units.forEach((u) => {
    const up = unitProgress(state, u.id);
    if (up.attempted > 0) unitAcc.push({ unit: u, paper: p.id, acc: up.accuracy, n: up.attempted });
  }));
  unitAcc.sort((a, b) => b.acc - a.acc);

  const allUnits = [];
  state.syllabus.forEach((p) => p.units.forEach((u) => {
    const up = unitProgress(state, u.id);
    allUnits.push({ id: u.id, n: u.n, paper: p.id, acc: up.accuracy, attempted: up.attempted });
  }));

  const byMonth = {};
  tests.forEach((t) => {
    const mk = String(t.date || '').slice(0, 7);
    if (!mk) return;
    const st = statsOf(state, t);
    const m = byMonth[mk] || { n: 0, acc: 0, score: 0, best: 0 };
    m.n += 1; m.acc += st.accuracy; m.score += st.score; m.best = Math.max(m.best, st.score);
    byMonth[mk] = m;
  });
  const monthsList = Object.entries(byMonth).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 6)
    .map(([mk, m]) => ({ mk, n: m.n, acc: Math.round(m.acc / m.n), score: Math.round(m.score / m.n), best: m.best }));

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('PYQ & mock tracker', 'PYQ ও মক ট্র্যাকার')}</div>
      <div class="page-sub">${bi('Every test is data. Log it honestly.', 'প্রতিটি টেস্টই ডেটা। সৎভাবে লগ করো।')}</div></div>
    <button class="btn btn-primary btn-sm" data-act="test.new">${icon('plus', 15)} ${bi('Log test', 'টেস্ট লগ')}</button>
  </div>

  <div class="grid g4">
    <div class="stat"><div class="stat-v">${tests.length}</div><div class="stat-k">${bi('tests logged', 'টেস্ট লগ')}</div></div>
    <div class="stat"><div class="stat-v">${avg(tests, (s) => s.accuracy)}%</div><div class="stat-k">${bi('avg accuracy', 'গড় অ্যাকুরেসি')}</div></div>
    <div class="stat"><div class="stat-v">${avg(tests, (s) => s.speed)}s</div><div class="stat-k">${bi('sec / question', 'সেকেন্ড / প্রশ্ন')}</div></div>
    <div class="stat"><div class="stat-v">${tests.length ? Math.max(...tests.map((t) => statsOf(state, t).score)) : 0}</div><div class="stat-k">${bi('best score', 'সেরা স্কোর')}</div></div>
  </div>

  ${tests.length === 0 ? `<div class="card mt">${emptyState('🧪', bi('No tests logged yet.', 'এখনও কোনো টেস্ট লগ করা হয়নি।'), bi('Log your first topic-wise PYQ set after a learn day — 10 questions is enough.', 'একটি লার্ন ডে-র পর প্রথম টপিকভিত্তিক PYQ লগ করো — ১০টি প্রশ্নই যথেষ্ট।'),
    `<button class="btn btn-primary btn-sm" data-act="test.new">${icon('plus', 15)} ${bi('Log first test', 'প্রথম টেস্ট লগ')}</button>`)}</div>` : `
  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Accuracy trend', 'অ্যাকুরেসি ট্রেন্ড')}</span><span class="hint">${bi('last 12 tests', 'শেষ ১২ টেস্ট')}</span></div>
    ${lineChart({ series: [{ values: accuracySeries, color: 'var(--brand)' }], labels, yMax: 100, target: 60, height: 140, yLabel: 'accuracy' })}
  </div>
  <div class="grid g2 mt">
    <div class="card tight"><div class="card-title mb">${bi('Speed (sec / Q)', 'গতি (সেকেন্ড / প্রশ্ন)')}</div>
      ${lineChart({ series: [{ values: speedSeries, color: 'var(--gold)' }], labels, height: 110, yLabel: 'speed' })}
      <div class="hint mt">${bi('Target: 72 sec/Q for Paper II, 60 for Paper I.', 'লক্ষ্য: পত্র II-তে ৭২ সেকেন্ড/প্রশ্ন, পত্র I-তে ৬০।')}</div></div>
    <div class="card tight"><div class="card-title mb">${bi('Score trend', 'স্কোর ট্রেন্ড')}</div>
      ${lineChart({ series: [{ values: scoreSeries, color: 'var(--ok)' }], labels, height: 110, target: state.profile.targetScore || undefined, yLabel: 'score' })}
      <div class="hint mt">${bi('Out of 300 in a full mock.', 'পূর্ণ মকে ৩০০-এর মধ্যে।')}</div></div>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Paper I vs Paper II', 'পত্র I বনাম পত্র II')}</span></div>
    <div class="bars">
      ${barRow(bi('Paper I', 'পত্র I'), avg(p1, (s) => s.accuracy), p1.length + ' ' + bi('tests', 'টেস্ট'), '')}
      ${barRow(bi('Paper II', 'পত্র II'), avg(p2, (s) => s.accuracy), p2.length + ' ' + bi('tests', 'টেস্ট'), '')}
      ${barRow(bi('Full mocks', 'পূর্ণ মক'), avg(both, (s) => s.accuracy), both.length + ' ' + bi('tests', 'টেস্ট'), '')}
    </div>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Per-unit accuracy', 'ইউনিটভিত্তিক অ্যাকুরেসি')}</span>
      <span class="hint">${bi('from all logged MCQs', 'সব লগ করা MCQ থেকে')}</span></div>
    <div class="uheat mt">
      ${allUnits.map((u) => `<i class="${u.attempted ? (u.acc >= 70 ? 'ok' : u.acc >= 50 ? 'warn' : 'bad') : 'none'}"
        title="${u.paper === 'P1' ? 'Paper I' : 'Paper II'} · U${u.n}${u.attempted ? ` · ${u.acc}% of ${u.attempted} Q` : ` · ${bi('no attempts yet', 'এখনও চেষ্টা নেই')}`}">${u.paper === 'P1' ? 'I' : 'II'}${u.n}</i>`).join('')}
    </div>
    <div class="hint mt">${bi('Darker = stronger. Tap a unit in Syllabus for the cluster breakdown.', 'গাঢ় = বেশি ভালো। ক্লাস্টারভিত্তিক দেখতে সিলেবাসে ইউনিটে ট্যাপ করো।')}</div>
    ${unitAcc.length === 0 ? `<div class="hint mt">${bi('Log MCQ results inside session cards to fill this table.', 'টেবিল ভরতে সেশন কার্ডে MCQ ফল লগ করো।')}</div>`
      : unitAcc.map((x) => `<div class="bar-row"><span title="${esc(x.unit.name.en)}">${x.paper === 'P1' ? 'I' : 'II'}·U${x.unit.n}</span>
        <div class="bar-track"><div class="bar-fill ${x.acc >= 70 ? 'ok' : x.acc >= 50 ? 'warn' : 'bad'}" style="width:${x.acc}%"></div></div>
        <span class="bar-val">${x.acc}%</span></div>`).join('')}
  </div>`}

  ${monthsList.length ? `<div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Month by month', 'মাস ধরে')}</span>
      <span class="hint">${bi('last 6 months', 'শেষ ৬ মাস')}</span></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>${bi('Month', 'মাস')}</th><th class="num">${bi('Tests', 'টেস্ট')}</th><th class="num">${bi('Avg acc', 'গড় অ্যাকু')}</th><th class="num">${bi('Avg score', 'গড় স্কোর')}</th><th class="num">${bi('Best', 'সেরা')}</th></tr></thead>
      <tbody>${monthsList.map((m) => `<tr><td>${esc(monthLabel(m.mk, state.profile.lang))}</td>
        <td class="num">${m.n}</td><td class="num">${m.acc}%</td><td class="num">${m.score}</td><td class="num">${m.best}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="hint mt">${bi('Watch the monthly average, not a single good day.', 'একদিনের ভালো ফল নয়, মাসের গড় দেখো।')}</div>
  </div>` : ''}

  ${tests.length ? `<div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Test history', 'টেস্ট হিস্ট্রি')}</span>
      <span class="hint">${visible.length} ${bi('shown', 'দেখানো')}</span></div>
    <div class="row wrap mb" style="gap:6px">
      <select class="select" data-change="test.filterType" style="width:auto;padding:7px 9px;font-size:.75rem">
        ${[['all', bi('All types', 'সব ধরন')], ['topic', bi('Topic-wise', 'টপিকভিত্তিক')], ['sectional', bi('Sectional', 'সেকশনাল')], ['part', bi('Part mock', 'পার্ট মক')], ['full', bi('Full mock', 'পূর্ণ মক')]]
          .map(([v, l]) => `<option value="${v}" ${filterType === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select class="select" data-change="test.filterPaper" style="width:auto;padding:7px 9px;font-size:.75rem">
        ${[['all', bi('Both papers', 'দুই পত্র')], ['P1', bi('Paper I', 'পত্র I')], ['P2', bi('Paper II', 'পত্র II')], ['Both', bi('Full', 'পূর্ণ')]]
          .map(([v, l]) => `<option value="${v}" ${filterPaper === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <input class="input" data-input="test.search" value="${esc(search)}" placeholder="${bi('Search', 'খোঁজো')}" style="width:130px;padding:7px 9px;font-size:.75rem">
    </div>
    <div class="table-wrap"><table class="table">
      <thead><tr>
        <th data-act="test.sort" data-k="date">${bi('Date', 'তারিখ')}</th>
        <th>${bi('Type', 'ধরন')}</th><th>${bi('Paper', 'পত্র')}</th>
        <th class="num" data-act="test.sort" data-k="accuracy">${bi('Acc', 'অ্যাকু')}</th>
        <th class="num" data-act="test.sort" data-k="score">${bi('Score', 'স্কোর')}</th>
        <th class="num">${bi('Speed', 'গতি')}</th><th></th>
      </tr></thead>
      <tbody>
        ${visible.map((t) => {
          const s = statsOf(state, t);
          return `<tr>
            <td>${esc(t.date)}<div class="tiny muted">${esc(t.name || '')}</div></td>
            <td><span class="pill line">${esc(typeLabel(t.type))}</span></td>
            <td>${t.paper === 'Both' ? bi('I + II', 'I + II') : t.paper}</td>
            <td class="num">${s.accuracy}%<div class="tiny muted">${s.correct}/${s.attempted}</div></td>
            <td class="num">${s.score}</td>
            <td class="num">${s.speed}s</td>
            <td><button class="icon-btn" data-act="test.del" data-id="${esc(t.id)}" aria-label="${bi('Delete', 'মুছো')}">${icon('trash', 14)}</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>` : ''}

  <div class="note-band mt">${icon('info', 15)} <span>${bi('Marks per question and negative marking come from Settings → Exam pattern. Confirm them with the latest NTA bulletin.',
    'প্রতি প্রশ্নের নম্বর ও নেগেটিভ মার্কিং Settings → Exam pattern থেকে আসে। সর্বশেষ NTA বুলেটিনে যাচাই করো।')}</span></div>
  `;
}

function barRow(label, pct, sub, tone) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return `<div class="bar-row"><span>${label}<div class="tiny muted">${sub}</div></span>
    <div class="bar-track"><div class="bar-fill ${p >= 70 ? 'ok' : p >= 50 ? 'warn' : 'bad'}" style="width:${p}%"></div></div>
    <span class="bar-val">${p}%</span></div>`;
}

function typeLabel(t) {
  return ({ topic: bi('Topic', 'টপিক'), sectional: bi('Sectional', 'সেকশনাল'), part: bi('Part mock', 'পার্ট মক'), full: bi('Full mock', 'পূর্ণ মক') })[t] || t;
}

function testSheet(state, R, editId) {
  const t = editId ? (state.tests || []).find((x) => x.id === editId) : null;
  const s = t ? statsOf(state, t) : null;
  R.openSheet({
    title: t ? bi('Edit test', 'টেস্ট এডিট') : bi('Log a test', 'টেস্ট লগ করো'),
    sub: bi('Be honest — the analysis is only as good as the data.', 'সৎ থাকো — ডেটা যত ভালো, বিশ্লেষণ তত ভালো।'),
    body: () => `
      <form data-form="test.save">
        <input type="hidden" name="id" value="${t ? esc(t.id) : ''}">
        <div class="row" style="gap:8px">
          <div class="field" style="flex:1"><label>${bi('Date', 'তারিখ')}</label><input class="input" type="date" name="date" value="${esc(t?.date || todayKey())}" required></div>
          <div class="field" style="flex:1"><label>${bi('Type', 'ধরন')}</label>
            <select class="select" name="type">
              ${[['topic', bi('Topic-wise', 'টপিকভিত্তিক')], ['sectional', bi('Sectional', 'সেকশনাল')], ['part', bi('Part mock', 'পার্ট মক')], ['full', bi('Full mock', 'পূর্ণ মক')]]
                .map(([v, l]) => `<option value="${v}" ${t?.type === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
        </div>
        <div class="row mt" style="gap:8px">
          <div class="field" style="flex:1"><label>${bi('Paper', 'পত্র')}</label>
            <select class="select" name="paper">
              <option value="P1" ${t?.paper === 'P1' ? 'selected' : ''}>Paper I</option>
              <option value="P2" ${t?.paper === 'P2' || !t ? 'selected' : ''}>Paper II</option>
              <option value="Both" ${t?.paper === 'Both' ? 'selected' : ''}>Paper I + II</option>
            </select></div>
          <div class="field" style="flex:1"><label>${bi('Name (optional)', 'নাম (ঐচ্ছিক)')}</label><input class="input" name="name" value="${esc(t?.name || '')}" placeholder="${bi('e.g. Graph Theory PYQ 2019–23', 'যেমন Graph Theory PYQ 2019–23')}"></div>
        </div>
        <div class="field mt"><label>${bi('Units covered', 'কোন ইউনিট')}</label>
          <select class="select" name="units" multiple size="4">
            ${state.syllabus.map((p) => `<optgroup label="${esc(p.short.en)}">${p.units.map((u) => `<option value="${u.id}" ${(t?.units || []).includes(u.id) ? 'selected' : ''}>U${u.n} ${esc(u.name.en)}</option>`).join('')}</optgroup>`).join('')}
          </select>
          <span class="hint">${bi('Leave empty for a full mock.', 'পূর্ণ মকে খালি রাখো।')}</span>
        </div>
        <div class="mini-grid mt">
          <div class="field"><label>${bi('Attempted', 'করেছি')}</label><input class="input" type="number" min="0" name="attempted" value="${t?.attempted ?? ''}" required inputmode="numeric"></div>
          <div class="field"><label>${bi('Correct', 'সঠিক')}</label><input class="input" type="number" min="0" name="correct" value="${t?.correct ?? ''}" required inputmode="numeric"></div>
          <div class="field"><label>${bi('Wrong', 'ভুল')}</label><input class="input" type="number" min="0" name="wrong" value="${t?.wrong ?? ''}" inputmode="numeric"></div>
          <div class="field"><label>${bi('Unanswered', 'উত্তর দিইনি')}</label><input class="input" type="number" min="0" name="unanswered" value="${t?.unanswered ?? ''}" inputmode="numeric"></div>
          <div class="field"><label>${bi('Time (min)', 'সময় (মিনিট)')}</label><input class="input" type="number" min="0" name="time" value="${t?.time ?? ''}" inputmode="numeric"></div>
          <div class="field"><label>${bi('Score (auto)', 'স্কোর (স্বয়ংক্রিয়)')}</label><input class="input" value="${s ? s.score : '—'}" disabled></div>
        </div>
        <div class="field mt"><label>${bi('Notes / what to fix', 'নোট / কী ঠিক করতে হবে')}</label>
          <textarea class="textarea" name="notes" placeholder="${bi('Patterns you noticed, silly mistakes, topics to revisit…', 'যে প্যাটার্ন দেখলে, বোকা ভুল, আবার দেখার টপিক…')}">${esc(t?.notes || '')}</textarea></div>
        <button class="btn btn-primary btn-block mt" type="submit">${icon('check', 16)} ${bi('Save test', 'টেস্ট সেভ')}</button>
      </form>
      <div class="note-band mt">${icon('info', 15)} <span>${bi('Score uses the exam pattern in Settings. Accuracy = correct ÷ attempted. Speed = time ÷ attempted.',
        'স্কোর Settings-এর পরীক্ষার প্যাটার্ন ব্যবহার করে। অ্যাকুরেসি = সঠিক ÷ করা, গতি = সময় ÷ করা।')}</span></div>`
  });
}

/* ------------------------------------------------------------- actions */
register('test.new', () => testSheet(R.state, R, null));
register('test.del', ({ data }) => {
  const state = R.state;
  state.tests = (state.tests || []).filter((t) => t.id !== data.id);
  R.save(); R.refresh();
  R.toast(bi('Test removed.', 'টেস্ট মুছে গেছে।'), 'ok');
});
register('test.sort', ({ data }) => {
  if (sortKey === data.k) sortDir *= -1; else { sortKey = data.k; sortDir = -1; }
  R.refresh();
});
registerForm('test.save', ({ data, el }) => {
  const state = R.state;
  const units = [];
  const sel = el.querySelector('select[name="units"]');
  if (sel) Array.from(sel.selectedOptions).forEach((o) => units.push(o.value));
  const attempted = Number(data.attempted) || 0;
  const correct = Math.min(Number(data.correct) || 0, attempted);
  const rec = {
    id: data.id || uid('test'),
    date: data.date || todayKey(),
    type: data.type || 'topic',
    paper: data.paper || 'P2',
    name: data.name || '',
    units,
    attempted, correct,
    wrong: Number(data.wrong) || Math.max(0, attempted - correct),
    unanswered: Number(data.unanswered) || 0,
    time: Number(data.time) || 0,
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
  state.tests = state.tests || [];
  const i = state.tests.findIndex((x) => x.id === rec.id);
  if (i >= 0) state.tests[i] = rec; else state.tests.push(rec);
  R.save();
  R.closeSheet();
  R.refresh();
  R.toast(bi('Test saved. Now analyse every wrong answer.', 'টেস্ট সেভ হয়েছে। এখন প্রতিটি ভুল উত্তর বিশ্লেষণ করো।'), 'ok');
});

import { onInput } from './actions.js';
onInput('test.search', ({ value }) => { search = value; R.refresh(); });
register('test.filterType', ({ value }) => { filterType = value; R.refresh(); });
register('test.filterPaper', ({ value }) => { filterPaper = value; R.refresh(); });
