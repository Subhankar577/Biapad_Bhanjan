/* Calendar, week view and the 2-year roadmap (Gantt). */
import { R } from '../runtime.js';
import { register, onInput } from './actions.js';
import { bi, L, esc, icon, progressBar, emptyState, monthGrid } from './dom.js';
import {
  todayKey, addDays, dayNumber, keyForDay, getDay, dayProgress, dayNet, buildTimeline,
  weekday, parseKey, toKey, monthKey, monthLabel, isLastSundayOfMonth, sessionById,
  DAY_TYPE_LABEL, TEMPLATES, diffDays, sessionDone, dayMinutes, TOTAL_DAYS, PHASE1_DAYS,
  overallProgress, planRange
} from '../engine.js';

let calView = 'month';
let calMonth = null; // 'YYYY-MM'

function monthOf(key) { return String(key).slice(0, 7); }

function cellFor(state, key, today) {
  const start = state.profile.startDate;
  const day = getDay(state, key);
  const dow = parseKey(key).getDate();
  if (dayNumber(start, key) < 1) return { cls: 'blankf', label: '' };
  if (!day) return { cls: 'up', label: '' };
  const isRest = state.restDays.includes(key);
  const testTypes = ['monthly', 'mock', 'sectional'];
  if (testTypes.includes(day.t)) return { cls: 'test', label: key === today ? 'today' : '' };
  if (isRest) return { cls: 'rest', label: '' };
  if (key > today) return { cls: 'up', label: '' };
  const p = dayProgress(state, key);
  if (p.complete) return { cls: 'full', label: '' };
  if (p.touched) return { cls: 'part', label: '' };
  return { cls: 'miss', label: '' };
}

function daySheet(state, key, R) {
  const day = getDay(state, key);
  const today = todayKey();
  const past = key < today;
  const prog = dayProgress(state, key);
  const tl = buildTimeline(state, key);
  const isRest = day && day.t === 'H';
  const sid = (day && day.s && day.s[0]) || null;
  const sess = sid ? sessionById(state, sid) : null;
  R.openSheet({
    title: `${esc(parseKey(key).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))}`,
    sub: `${bi('Day', 'দিন')} ${dayNumber(state.profile.startDate, key)} · ${day ? L(DAY_TYPE_LABEL[day.t] || { en: day.t, bn: day.t }) : ''}`,
    body: () => {
      if (!day) return emptyState('🗓️', bi('Nothing planned.', 'কিছু পরিকল্পিত নেই।'), '');
      return `
      <div class="row wrap" style="gap:6px">
        <span class="pill brand">${L(DAY_TYPE_LABEL[day.t] || { en: day.t, bn: day.t })}</span>
        ${isRest ? `<span class="pill rest">${bi('Rest token used', 'বিশ্রাম টোকেন ব্যবহৃত')}</span>` : `<span class="pill line">${dayNet(state, key)} min net</span>`}
        ${past ? `<span class="pill ${prog.complete ? 'ok' : prog.touched ? 'warn' : 'bad'}">${prog.done}/${prog.total} min</span>` : `<span class="pill line">${bi('planned', 'পরিকল্পিত')}</span>`}
      </div>
      ${sess ? `<div class="sess-hero mt">
        <div class="eyebrow">P${sess.paper === 'P1' ? '1' : '2'} · U${sess.unitN}</div>
        <div style="font-weight:800;margin-top:2px">${esc(sess.clusterName)}</div>
        <div class="tiny muted mt">${bi('Session', 'সেশন')} ${sess.n}/${sess.of} · ${sess.depth} · ${esc(sess.unitName.en)}</div>
      </div>` : ''}
      ${isRest ? `<div class="note-band mt">🌙 ${bi('Rest day. The whole plan shifted forward by one day.', 'বিশ্রামের দিন। পুরো প্ল্যান একদিন এগিয়েছে।')}</div>` : ''}
      ${!isRest ? `<div class="card tight mt">
        <div class="card-title">${bi('Plan for the day', 'দিনের প্ল্যান')}</div>
        ${tl.rows.filter((r) => r.kind === 'act').map((r) => `<div class="kv"><span>${r.startStr} · ${L(r.act.title)}${r.part > 1 ? ' (2)' : ''}</span><b>${r.minutes} min</b></div>`).join('')}
      </div>` : ''}
      <div class="card tight mt">
        <div class="card-title">${bi('My note for this day', 'এই দিনের আমার নোট')}</div>
        <textarea class="textarea mt" data-input="day.note" data-key="${esc(key)}" placeholder="${bi('What happened? What to remember?', 'কী হলো? কী মনে রাখতে হবে?')}">${esc((state.dayNotes || {})[key] || '')}</textarea>
      </div>
      <div class="row mt" style="gap:8px">
        ${!past ? `<button class="btn btn-primary btn-sm" data-act="cal.viewday" data-key="${esc(key)}">${bi('Open this day', 'এই দিন খোলো')}</button>` : ''}
        ${past && !prog.touched ? `<span class="hint">${bi('This day was missed — it is in the backlog list.', 'এই দিনটি মিস হয়েছে — ব্যাকলগে আছে।')}</span>` : ''}
      </div>`;
    }
  });
}

export function render(state, param, R) {
  const today = todayKey();
  const start = state.profile.startDate;
  const wantMonth = /^\d{4}-\d{2}$/.test(param || '') ? param : (calMonth || monthOf(today));
  calMonth = wantMonth;
  const [y, m] = wantMonth.split('-').map(Number);
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const cells = monthGrid(y, m, (d) => {
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = getDay(state, key);
    const before = dayNumber(start, key) < 1;
    const c = cellFor(state, key, today);
    const isToday = key === today;
    const testTypes = ['monthly', 'mock', 'sectional'];
    const cls = before ? 'up' : c.cls;
    return `<button class="cal-cell ${cls} ${isToday ? 'today' : ''}" data-act="cal.open" data-key="${key}"
      ${before ? 'disabled' : ''} aria-label="${esc(key)}">
      <span class="cd">${d}</span>
      ${day && !before ? `<span class="cdot"></span>` : ''}
    </button>`;
  });

  const leftover = (state.onboardingComplete && Object.keys(state.plan?.days || {}).length === 0)
    ? emptyState('🗓️', bi('No plan yet', 'এখনও প্ল্যান নেই'), '', `<button class="btn btn-primary" data-act="nav.go" data-to="setup">${bi('Run setup', 'সেটআপ চালাও')}</button>`)
    : '';

  const months = [];
  const startM = monthOf(start);
  const endM = monthOf(keyForDay(start, TOTAL_DAYS));
  let cur = startM;
  let guard = 0;
  while (cur <= endM && guard++ < 30) {
    months.push(cur);
    const [yy, mm] = cur.split('-').map(Number);
    cur = mm === 12 ? `${yy + 1}-01` : `${yy}-${String(mm + 1).padStart(2, '0')}`;
  }
  const monthAt = Math.max(1, months.indexOf(wantMonth) + 1);
  const atFirstMonth = monthAt <= 1;
  const atLastMonth = monthAt >= months.length;

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Calendar', 'ক্যালেন্ডার')}</div>
      <div class="page-sub">${bi('Every day of the two-year plan', 'দুই বছরের প্ল্যানের প্রতিটি দিন')}</div></div>
    <div class="seg">
      <button class="${calView === 'month' ? 'active' : ''}" data-act="cal.view" data-v="month">${bi('Month', 'মাস')}</button>
      <button class="${calView === 'week' ? 'active' : ''}" data-act="cal.view" data-v="week">${bi('Week', 'সপ্তাহ')}</button>
      <button class="${calView === 'road' ? 'active' : ''}" data-act="cal.view" data-v="road">${bi('Roadmap', 'রোডম্যাপ')}</button>
    </div>
  </div>

  ${leftover}

  ${calView === 'month' ? `
  <div class="card">
    <div class="row between" style="margin-bottom:10px">
      <button class="icon-btn" data-act="cal.month" data-dir="-1" data-month="${esc(wantMonth)}" aria-label="${bi('Previous month', 'আগের মাস')}" ${atFirstMonth ? 'disabled' : ''}>${icon('chevron', 16, 'rot180')}</button>
      <div style="text-align:center">
        <b style="font-size:.95rem">${esc(monthLabel(wantMonth, state.profile.lang))}</b>
        <div class="tiny muted">${bi('Month', 'মাস')} ${monthAt} ${bi('of', '/')} ${months.length}${(() => {
          const a = Math.max(1, dayNumber(start, first));
          const b = Math.min(TOTAL_DAYS, dayNumber(start, last));
          return b >= 1 && a <= TOTAL_DAYS ? ` · ${bi('Days', 'দিন')} ${a}–${b}` : '';
        })()}</div>
      </div>
      <button class="icon-btn" data-act="cal.month" data-dir="1" data-month="${esc(wantMonth)}" aria-label="${bi('Next month', 'পরের মাস')}" ${atLastMonth ? 'disabled' : ''}>${icon('chevron', 16)}</button>
    </div>
    ${cells}
    <div class="cal-legend mt">
      <span><i style="background:var(--ok-soft);border:1px solid var(--ok)"></i>${bi('full', 'সম্পূর্ণ')}</span>
      <span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>${bi('partial', 'আংশিক')}</span>
      <span><i style="background:var(--bad-soft);border:1px solid var(--bad)"></i>${bi('missed', 'মিস')}</span>
      <span><i style="background:var(--rest-soft);border:1px solid var(--rest)"></i>${bi('rest', 'বিশ্রাম')}</span>
      <span><i style="background:var(--brand-soft);border:1px solid var(--brand)"></i>${bi('test', 'টেস্ট')}</span>
      <span><i style="background:var(--surface-3)"></i>${bi('upcoming', 'আসছে')}</span>
    </div>
    <div class="row between mt">
      <button class="btn btn-xs btn-ghost" data-act="cal.month" data-dir="0" data-month="${esc(wantMonth)}">${bi('Jump to today', 'আজকে যাও')}</button>
      <div class="hint">${bi('Tap a day to open it', 'দিনে ট্যাপ করে খোলো')}</div>
    </div>
  </div>
  <div class="card tight mt">
    <div class="row between"><span class="card-title">${bi('This month', 'এই মাস')}</span>
    <span class="tiny muted">${monthSummary(state, first, last)}</span></div>
    <div class="hint mt">${bi('Green = all planned minutes done · Yellow = partial · Red = missed', 'সবুজ = সব মিনিট শেষ · হলুদ = আংশিক · লাল = মিস')}</div>
  </div>`
  : calView === 'week' ? weekView(state, today)
  : roadmap(state)}

  <div class="note-band mt">${icon('info', 15)} <span>${bi('First pass = studied once. Phase 2 (Day 366 onward) is revision, PYQ drills, mocks and speed work.',
    'প্রথম পাস = একবার পড়া। Phase 2 (Day 366 থেকে) রিভিশন, PYQ, মক ও গতির কাজ।')}</span></div>
  `;
}

function monthSummary(state, first, last) {
  let planned = 0, done = 0, tests = 0;
  let k = first;
  let guard = 0;
  while (k <= last && guard++ < 40) {
    const d = getDay(state, k);
    if (d) {
      planned++;
      if (d.t === 'monthly' || d.t === 'mock' || d.t === 'sectional') tests++;
      if (keyIsComplete(state, k)) done++;
    }
    k = addDays(k, 1);
  }
  return `${done}/${planned} ${bi('days complete', 'দিন সম্পূর্ণ')}${tests ? ` · ${tests} ${bi('test days', 'টেস্টের দিন')}` : ''}`;
}

function keyIsComplete(state, key) {
  const d = getDay(state, key);
  if (!d) return false;
  if (d.t === 'H') return false;
  return dayProgress(state, key).complete;
}

function weekView(state, today) {
  const wd = weekday(today);
  const monday = addDays(today, -((wd + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return `<div class="card">
    <div class="card-h"><span class="card-title">${bi('This week', 'এই সপ্তাহ')}</span>
      <span class="hint">${esc(parseKey(days[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))} – ${esc(parseKey(days[6]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</span></div>
    <div class="col" style="gap:8px">
      ${days.map((k) => {
        const d = getDay(state, k);
        if (!d) return '';
        const sid = (d.s || [])[0];
        const s = sid ? sessionById(state, sid) : null;
        const prog = dayProgress(state, k);
        const isToday = k === today;
        return `<button class="row" data-act="cal.open" data-key="${k}" style="gap:10px;padding:10px;border-radius:12px;text-align:left;width:100%;
          border:1px solid ${isToday ? 'var(--brand)' : 'var(--line)'};background:${isToday ? 'var(--brand-soft)' : 'var(--surface-2)'};align-items:flex-start">
          <div style="width:40px;text-align:center;flex:0 0 auto">
            <div class="eyebrow" style="font-size:.6rem">${esc(parseKey(k).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'short' }))}</div>
            <div style="font-weight:800;font-size:1rem">${parseKey(k).getDate()}</div>
          </div>
          <div style="flex:1;min-width:0">
            <div class="row wrap" style="gap:5px"><span class="pill ${d.t === 'H' ? 'rest' : 'line'}">${L(DAY_TYPE_LABEL[d.t] || { en: d.t, bn: d.t })}</span>
              ${k < today ? `<span class="pill ${prog.complete ? 'ok' : prog.touched ? 'warn' : 'bad'}">${prog.done}/${prog.total} min</span>` : `<span class="tiny muted">${dayNet(state, k)} min</span>`}</div>
            <div class="small" style="margin-top:3px;font-weight:600">${s ? esc(s.clusterName) : (d.t === 'H' ? bi('Rest day', 'বিশ্রাম') : L(TEMPLATES[d.t]?.name || { en: '', bn: '' }))}</div>
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function roadmap(state) {
  const start = state.profile.startDate;
  const today = todayKey();
  const idx = {};
  Object.keys(state.plan?.days || {}).sort().forEach((k) => {
    (state.plan.days[k].s || []).forEach((sid) => { if (!idx[sid]) idx[sid] = k; });
  });
  // per-unit span
  const units = [];
  state.syllabus.forEach((p) => {
    p.units.forEach((u) => {
      const keys = [];
      Object.entries(idx).forEach(([sid, k]) => { if (sid.startsWith(u.id + 'C')) keys.push(k); });
      if (!keys.length) return;
      keys.sort();
      let done = 0;
      u.clusters.forEach((c) => {
        const st = (state.clusters || {})[c.id];
        if (st && ['done', 'done-revisit', 'needs-help'].includes(st.status)) done++;
      });
      units.push({
        id: u.id, paper: p.id, n: u.n, name: u.name,
        from: keys[0], to: keys[keys.length - 1],
        pct: Math.round((done / u.clusters.length) * 100)
      });
    });
  });
  const total = TOTAL_DAYS;
  const pos = (key) => Math.max(0, Math.min(100, (diffDays(start, key) / total) * 100));
  const todayPos = pos(today);

  const plannedSoFar = Object.values(idx).filter((k) => k <= today).length;
  const doneSoFar = Object.keys(idx).filter((sid) => sessionDone(state, sid)).length;
  const delta = doneSoFar - plannedSoFar;

  const milestones = [];
  let k = start;
  let guard = 0;
  while (guard++ < 800 && k <= keyForDay(start, TOTAL_DAYS)) {
    if (isLastSundayOfMonth(k)) milestones.push({ key: k, label: bi('Monthly check', 'মাসিক চেক') });
    k = addDays(k, 1);
  }

  return `<div class="card">
    <div class="card-h"><span class="card-title">${bi('Two-year roadmap', 'দুই বছরের রোডম্যাপ')}</span>
      <span class="pill ${delta >= 0 ? 'ok' : 'bad'}">${delta >= 0 ? bi(`Ahead by ${delta} sessions`, `${delta} সেশন এগিয়ে`) : bi(`Behind by ${-delta} sessions`, `${-delta} সেশন পিছিয়ে`)}</span></div>
    <div class="gantt">
      <div class="gantt-inner">
        <div style="display:flex;justify-content:space-between;font-size:.62rem;color:var(--muted);margin-bottom:6px">
          <span>${esc(parseKey(start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }))}</span>
          <span>${esc(parseKey(keyForDay(start, PHASE1_DAYS)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }))} · ${bi('Phase 1 ends', 'Phase 1 শেষ')}</span>
          <span>${esc(parseKey(keyForDay(start, TOTAL_DAYS)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }))}</span>
        </div>
        <div style="position:relative;height:22px;margin-bottom:8px">
          <div style="position:absolute;inset:0;background:var(--surface-3);border-radius:99px;overflow:hidden">
            <div style="position:absolute;left:0;top:0;bottom:0;width:${(PHASE1_DAYS / total) * 100}%;background:color-mix(in srgb,var(--brand) 18%, transparent)"></div>
          </div>
          <div class="gantt-marker" style="left:${todayPos}%"></div>
          <span style="position:absolute;left:6px;top:3px;font-size:.6rem;font-weight:700">${bi('Phase 1 · Learn', 'Phase 1 · শেখা')}</span>
          <span style="position:absolute;left:${(PHASE1_DAYS / total) * 100 + 1}%;top:3px;font-size:.6rem;font-weight:700">${bi('Phase 2 · Master', 'Phase 2 · দক্ষতা')}</span>
        </div>
        ${units.map((u) => `
          <div class="gantt-row">
            <div class="gantt-label" title="${esc(u.name.en)}">${u.paper === 'P1' ? 'I' : 'II'}·U${u.n} ${esc(u.name.en)}</div>
            <div class="gantt-track">
              <div class="gantt-bar ${u.pct === 100 ? 'done' : ''}" style="left:${pos(u.from)}%;width:${Math.max(1.2, pos(u.to) - pos(u.from))}%"
                title="${esc(u.name.en)} · ${esc(u.from)} → ${esc(u.to)} · ${u.pct}%"></div>
            </div>
          </div>`).join('')}
        <div style="position:relative;height:16px;margin-top:6px">
          <div class="gantt-marker" style="left:${todayPos}%"></div>
          <span style="position:absolute;left:${todayPos}%;transform:translateX(-50%);top:2px;font-size:.58rem;color:var(--gold);font-weight:700">${bi('today', 'আজ')}</span>
        </div>
      </div>
    </div>
    <div class="row wrap mt" style="gap:10px;font-size:.68rem;color:var(--muted)">
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--brand);margin-right:4px"></i>${bi('in progress', 'চলছে')}</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--ok);margin-right:4px"></i>${bi('unit complete', 'ইউনিট শেষ')}</span>
      <span><i style="display:inline-block;width:2px;height:12px;background:var(--gold);margin-right:4px"></i>${bi('today', 'আজ')}</span>
    </div>
  </div>
  <div class="grid g2 mt">
    <div class="stat"><div class="stat-v">${doneSoFar}</div><div class="stat-k">${bi('sessions done', 'সেশন শেষ')}</div></div>
    <div class="stat"><div class="stat-v">${plannedSoFar}</div><div class="stat-k">${bi('sessions planned so far', 'এখন পর্যন্ত পরিকল্পিত')}</div></div>
  </div>
  <div class="card tight mt">
    <div class="card-title">${bi('Milestones', 'মাইলস্টোন')}</div>
    <div class="col mt" style="gap:6px">
      ${milestones.slice(0, 8).map((m) => `<div class="kv"><span>${esc(parseKey(m.key).toDateString())}</span><b>${m.label}</b></div>`).join('')}
      <div class="kv"><span>${esc(parseKey(keyForDay(start, PHASE1_DAYS)).toDateString())}</span><b>${bi('Phase 2 begins', 'Phase 2 শুরু')}</b></div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- actions */
register('cal.view', ({ data }) => { calView = data.v; R.refresh(); });
register('cal.month', ({ data }) => {
  const dir = Number(data.dir);
  if (dir === 0) { calMonth = monthOf(todayKey()); R.go(`calendar/${calMonth}`); return; }
  const [y, m] = data.month.split('-').map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  calMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  R.go(`calendar/${calMonth}`);
});
register('cal.open', ({ data }) => { daySheet(R.state, data.key, R); });
register('cal.viewday', ({ data }) => { R.closeSheet(); R.go(`today/${data.key}`); });
register('cal.selectday', ({ data }) => { daySheet(R.state, data.key, R); });

onInput('day.note', ({ data, value }) => {
  const state = R.state;
  state.dayNotes = state.dayNotes || {};
  state.dayNotes[data.key] = value;
  R.save();
});
