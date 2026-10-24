/* Analytics — heatmap, weekly hours, hours per unit, completion curve,
   auto weekly report, monthly self-evaluation. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, L, esc, icon, emptyState, progressBar } from './dom.js';
import { heatmap, barChart, lineChart, donut } from './charts.js';
import {
  todayKey, addDays, diffDays, parseKey, dayMinutes, dayProgress, sessionPlanIndex,
  backlogItems, weeklyReport, streak, overallProgress, sessionDone, dayNet, sessionById,
  dayNumber, keyForDay, monthKey, monthLabel, isLastSundayOfMonth, weekday
} from '../engine.js';
import { uid } from '../store.js';

export function render(state) {
  const today = todayKey();
  const start = state.profile.startDate;
  const idx = sessionPlanIndex(state);
  const overall = overallProgress(state);
  const back = backlogItems(state);

  /* heatmap — last 18 weeks ending this week */
  const weekEnd = addDays(today, 6 - ((weekday(today) + 6) % 7) - 6 + 6);
  const weeks = [];
  let cursor = addDays(today, -((weekday(today) + 6) % 7) - 17 * 7);
  for (let w = 0; w < 18; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const k = addDays(cursor, d);
      week.push({ key: k, minutes: k >= start ? dayMinutes(state, k) : 0, out: dayNumber(start, k) < 1 });
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  /* weekly minutes last 12 weeks */
  const weekVals = [], weekLbls = [];
  for (let w = 11; w >= 0; w--) {
    const end = addDays(today, -w * 7);
    let m = 0;
    for (let d = 0; d < 7; d++) {
      const k = addDays(end, -d);
      if (k >= start) m += dayMinutes(state, k);
    }
    weekVals.push(Math.round(m / 60));
    weekLbls.push(w === 0 ? bi('now', 'এখন') : `-${w}w`);
  }

  /* minutes per unit */
  const unitMinutes = {};
  Object.entries(state.actLog || {}).forEach(([key, log]) => {
    const d = state.plan?.days?.[key];
    if (!d) return;
    const sid = (d.s || [])[0];
    if (!sid) return;
    const uid = sid.split('C')[0];
    let m = 0;
    Object.values(log).forEach((r) => { m += r.actualMin || 0; });
    unitMinutes[uid] = (unitMinutes[uid] || 0) + m;
  });
  const unitRows = Object.entries(unitMinutes).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxUnit = unitRows.length ? unitRows[0][1] : 1;

  /* completion curve: one point per week */
  const weeksTotal = Math.min(60, Math.ceil(diffDays(start, today) / 7) + 3);
  const plannedCurve = [], actualCurve = [], curveLabels = [];
  for (let w = 0; w < weeksTotal; w++) {
    const k = addDays(start, w * 7);
    if (k > keyForDay(start, 730)) break;
    plannedCurve.push(Object.values(idx).filter((v) => v.plannedDate <= k).length);
    actualCurve.push(Object.values(state.sessions || {}).filter((s) => s.status === 'done' && (s.doneAt || '9999') <= k).length);
    curveLabels.push(w % 2 === 0 ? `w${w}` : '');
  }
  const plannedSoFar = Object.values(idx).filter((v) => v.plannedDate <= today).length;
  const doneSoFar = Object.entries(state.sessions || {}).filter(([sid, s]) => s.status === 'done' && idx[sid]).length;
  const delta = doneSoFar - plannedSoFar;

  const report = weeklyReport(state, today);
  const monthKeyNow = monthKey(today);
  const evalThisMonth = (state.monthlyEvals || []).find((e) => e.month === monthKeyNow);

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Analytics', 'অ্যানালিটিক্স')}</div>
      <div class="page-sub">${bi('Numbers you can act on', 'যে সংখ্যা দিয়ে কাজ করা যায়')}</div></div>
    <button class="btn btn-sm" data-act="ana.week">${icon('list', 15)} ${bi('Weekly report', 'সাপ্তাহিক রিপোর্ট')}</button>
  </div>

  <div class="grid g4">
    <div class="stat"><div class="stat-v">${overall.pct}%</div><div class="stat-k">${bi('first pass', 'প্রথম পাস')}</div></div>
    <div class="stat"><div class="stat-v">${streak(state)}🔥</div><div class="stat-k">${bi('day streak', 'দিনের স্ট্রিক')}</div></div>
    <div class="stat"><div class="stat-v">${Math.round(weekVals.reduce((a, b) => a + b, 0))}h</div><div class="stat-k">${bi('last 12 weeks', 'শেষ ১২ সপ্তাহ')}</div></div>
    <div class="stat"><div class="stat-v" style="color:${delta >= 0 ? 'var(--ok)' : 'var(--bad)'}">${delta >= 0 ? '+' : ''}${delta}</div><div class="stat-k">${bi('sessions vs plan', 'প্ল্যানের তুলনায়')}</div></div>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Study heatmap', 'স্টাডি হিটম্যাপ')}</span>
      <span class="hint">${bi('last 18 weeks', 'শেষ ১৮ সপ্তাহ')}</span></div>
    ${heatmap({ weeks })}
    <div class="hint mt">${bi('Colour = minutes studied that day (0 → 180+).', 'রং = সেই দিনের পড়ার মিনিট (০ → ১৮০+)।')}</div>
  </div>

  <div class="grid g2 mt">
    <div class="card tight">
      <div class="card-title mb">${bi('Weekly hours', 'সাপ্তাহিক ঘণ্টা')}</div>
      ${barChart({ values: weekVals, labels: weekLbls, height: 120 })}
    </div>
    <div class="card tight">
      <div class="card-title mb">${bi('Completion curve', 'কমপ্লিশন কার্ভ')}</div>
      ${lineChart({
        series: [
          { values: plannedCurve, color: 'var(--gold)', dash: true, area: false, width: 1.8 },
          { values: actualCurve, color: 'var(--brand)' }
        ], labels: curveLabels, height: 120, yLabel: 'sessions'
      })}
      <div class="row between mt tiny"><span class="muted">— — ${bi('planned', 'পরিকল্পিত')}</span><span style="color:var(--brand)">— ${bi('actual', 'বাস্তব')}</span></div>
    </div>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Hours per unit', 'ইউনিট অনুযায়ী ঘণ্টা')}</span>
      <span class="hint">${bi('logged minutes', 'লগ করা মিনিট')}</span></div>
    ${unitRows.length === 0 ? `<div class="hint">${bi('Log your sessions and this fills up.', 'সেশন লগ করলে এটি ভরবে।')}</div>`
      : unitRows.map(([uid, m]) => {
        let u = null, p = null;
        state.syllabus.forEach((pp) => pp.units.forEach((uu) => { if (uu.id === uid) { u = uu; p = pp; } }));
        return `<div class="bar-row"><span>${p?.id === 'P1' ? 'I' : 'II'}·U${u?.n || ''}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(m / maxUnit) * 100}%"></div></div>
          <span class="bar-val">${(m / 60).toFixed(1)}h</span></div>`;
      }).join('')}
  </div>

  <div class="card mt">
    <div class="row between"><span class="card-title">${bi('Backlog health', 'ব্যাকলগ অবস্থা')}</span>
      <span class="pill ${back.length > 7 ? 'bad' : back.length > 3 ? 'warn' : 'ok'}">${back.length} ${bi('pending', 'বাকি')}</span></div>
    <div class="mt">${progressBar(Math.min(100, back.length * 10), back.length > 3 ? 'bad' : 'ok')}</div>
    <div class="hint mt">${bi('Above 3 sessions the plan will warn you; above 7 it suggests a catch-up week.', '৩ সেশনের বেশি হলে সতর্ক করবে; ৭-এর বেশি হলে ক্যাচ-আপ সপ্তাহের পরামর্শ দেবে।')}</div>
    <button class="btn btn-sm mt" data-act="nav.go" data-to="backlog">${bi('Open backlog', 'ব্যাকলগ খোলো')}</button>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('This week', 'এই সপ্তাহ')}</span>
      <button class="btn btn-xs" data-act="ana.week">${bi('Full report', 'পুরো রিপোর্ট')}</button></div>
    <div class="grid g3">
      <div class="stat"><div class="stat-v">${report.sessions}</div><div class="stat-k">${bi('sessions', 'সেশন')}</div></div>
      <div class="stat"><div class="stat-v">${Math.round(report.minutes / 60)}h</div><div class="stat-k">${bi('logged', 'লগ')}</div></div>
      <div class="stat"><div class="stat-v">${report.accuracy}%</div><div class="stat-k">${bi('accuracy', 'অ্যাকুরেসি')}</div></div>
    </div>
    <div class="hint mt">${bi('Top gap this week:', 'এই সপ্তাহের বড় ঘাটতি:')} ${report.gaps.length ? esc(report.gaps[0].clusterId.split('C')[0]) + ' · ' + report.gaps[0].skill + '%' : bi('not enough MCQ data', 'যথেষ্ট MCQ ডেটা নেই')}</div>
  </div>

  <div class="card mt">
    <div class="row between"><span class="card-title">${bi('Monthly self-evaluation', 'মাসিক সেলফ-ইভ্যালুয়েশন')}</span>
      ${isLastSundayOfMonth(today) ? `<span class="pill gold">${bi('due today', 'আজ দিতে হবে')}</span>` : ''}</div>
    ${evalThisMonth ? `<div class="note-band mt">${icon('check', 15)} <span>${bi('You filled this month’s form.', 'এই মাসের ফর্ম তুমি পূরণ করেছ।')}</span></div>`
      : `<p class="small muted mt">${bi('Ten minutes, once a month. It changes the next month more than any new resource.',
        'মাসে একবার দশ মিনিট। নতুন রিসোর্সের চেয়ে এটি পরের মাস বেশি বদলায়।')}</p>
        <button class="btn btn-soft btn-sm mt" data-act="ana.eval">${icon('pen', 14)} ${bi('Fill this month’s form', 'এই মাসের ফর্ম ভরো')}</button>`}
    ${(state.monthlyEvals || []).length ? `<div class="mt">
      ${state.monthlyEvals.slice(0, 6).map((e) => `<div class="kv"><span>${esc(monthLabel(e.month))}</span>
        <b class="tiny">${e.confidenceChange > 0 ? '+' : ''}${e.confidenceChange ?? 0} ${bi('confidence', 'কনফিডেন্স')}</b></div>`).join('')}
    </div>` : ''}
  </div>

  <div class="note-band mt">${icon('info', 15)} <span>${bi('Phase 2 priorities are computed from confidence, accuracy and days since last review.',
    'Phase 2-এর প্রায়োরিটি কনফিডেন্স, অ্যাকুরেসি ও শেষ রিভিশনের দিন থেকে হিসাব হয়।')}</span></div>`;
}

/* ------------------------------------------------------------- actions */
register('ana.week', () => {
  const state = R.state;
  const r = weeklyReport(state, todayKey());
  const names = (arr) => arr.map((x) => {
    let nm = x.clusterId;
    state.syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((c) => { if (c.id === x.clusterId) nm = c.name; })));
    return `<div class="kv"><span>${esc(nm)}</span><b>${x.skill}%</b></div>`;
  }).join('');
  R.openSheet({
    title: bi('Weekly report', 'সাপ্তাহিক রিপোর্ট'),
    sub: `${esc(r.keys[0])} → ${esc(r.keys[6])}`,
    body: `
      <div class="grid g3">
        <div class="stat"><div class="stat-v">${r.sessions}</div><div class="stat-k">${bi('sessions done', 'সেশন শেষ')}</div></div>
        <div class="stat"><div class="stat-v">${Math.round(r.minutes)}</div><div class="stat-k">${bi('minutes', 'মিনিট')}</div></div>
        <div class="stat"><div class="stat-v">${r.tests}</div><div class="stat-k">${bi('tests', 'টেস্ট')}</div></div>
      </div>
      <div class="card tight mt">
        <div class="kv"><span>${bi('MCQs', 'MCQ')}</span><b>${r.attempted}</b></div>
        <div class="kv"><span>${bi('Accuracy', 'অ্যাকুরেসি')}</span><b>${r.accuracy}%</b></div>
        <div class="kv"><span>${bi('Streak', 'স্ট্রিক')}</span><b>${r.streak} ${bi('days', 'দিন')}</b></div>
        <div class="kv"><span>${bi('Backlog', 'ব্যাকলগ')}</span><b>${r.backlog}</b></div>
      </div>
      <div class="card tight mt">
        <div class="label">${bi('Top 3 strengths', 'শীর্ষ ৩ শক্তি')}</div>
        ${r.strengths.length ? names(r.strengths) : `<div class="hint">${bi('Not enough data yet.', 'যথেষ্ট ডেটা নেই।')}</div>`}
      </div>
      <div class="card tight mt">
        <div class="label">${bi('Top 3 to improve', 'উন্নতির ৩ জায়গা')}</div>
        ${r.gaps.length ? names(r.gaps) : `<div class="hint">${bi('Not enough data yet.', 'যথেষ্ট ডেটা নেই।')}</div>`}
      </div>
      <div class="note-band mt">${icon('info', 15)} <span>${bi('Next week focus: finish the current unit’s last cluster, then clear the Saturday backlog before adding new topics.',
        'পরের সপ্তাহের ফোকাস: চলতি ইউনিটের শেষ ক্লাস্টার শেষ করো, নতুন টপিকের আগে শনিবারের ব্যাকলগ ক্লিয়ার করো।')}</span></div>`
  });
});

register('ana.eval', () => {
  const state = R.state;
  const r = weeklyReport(state);
  const m = monthKey(todayKey());
  R.openSheet({
    title: `${bi('Monthly form', 'মাসিক ফর্ম')} · ${monthLabel(m)}`,
    sub: bi('Be specific. Vague answers do not change next month.', 'নির্দিষ্ট লেখো। অস্পষ্ট উত্তর পরের মাস বদলায় না।'),
    body: `<form data-form="ana.evalsave">
      <input type="hidden" name="month" value="${esc(m)}">
      <div class="field"><label>${bi('What went well this month?', 'এই মাসে কী ভালো হলো?')}</label>
        <textarea class="textarea" name="well" required></textarea></div>
      <div class="field mt"><label>${bi('What didn’t go well?', 'কী ভালো হয়নি?')}</label>
        <textarea class="textarea" name="bad" required></textarea></div>
      <div class="field mt"><label>${bi('Weakest units (auto-suggested)', 'দুর্বল ইউনিট (স্বয়ংক্রিয় প্রস্তাব)')}</label>
        <input class="input" name="weak" value="${esc(r.gaps.map((g) => g.clusterId).join(', '))}"></div>
      <div class="field mt"><label>${bi('What will I do differently next month?', 'পরের মাসে কী অন্যভাবে করব?')}</label>
        <textarea class="textarea" name="change" required></textarea></div>
      <button class="btn btn-primary btn-block mt" type="submit">${icon('check', 16)} ${bi('Save evaluation', 'মূল্যায়ন সেভ')}</button>
    </form>`
  });
});

registerForm('ana.evalsave', ({ data }) => {
  const state = R.state;
  state.monthlyEvals = state.monthlyEvals || [];
  const prev = state.monthlyEvals[0];
  const avgConf = (() => {
    const vals = Object.values(state.clusters || {}).map((c) => c.confidence).filter(Boolean);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  })();
  const rec = {
    id: uid('eval'), month: data.month || monthKey(todayKey()),
    well: data.well, bad: data.bad, weak: data.weak, change: data.change,
    confidence: avgConf,
    confidenceChange: prev ? Math.round((avgConf - (prev.confidence || 0)) * 10) / 10 : 0,
    at: new Date().toISOString()
  };
  state.monthlyEvals = state.monthlyEvals.filter((e) => e.month !== rec.month);
  state.monthlyEvals.unshift(rec);
  R.save(); R.closeSheet(); R.refresh();
  R.toast(bi('Monthly evaluation saved.', 'মাসিক মূল্যায়ন সেভ হয়েছে।'), 'ok');
});
