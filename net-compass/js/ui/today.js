/* Today — the home screen. Greeting, ring, stats, vertical timeline. */
import { R } from '../runtime.js';
import { register, registerForm } from './actions.js';
import { bi, L, esc, icon, ring, progressBar, emptyState } from './dom.js';
import {
  todayKey, addDays, dayNumber, getDay, buildTimeline, dayNet, dayProgress,
  streak, backlogItems, dueRevisions, dueFlashcards, overallProgress, sessionById,
  DAY_TYPE_LABEL, TEMPLATES, parseKey, tStr, coachingSlotFor, dayMinutes
} from '../engine.js';
import { daysToExam, restTokensLeft } from '../store.js';
import { openSessionSheet, checkDayComplete } from './session.js';
import { findCluster } from '../data/syllabus.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { en: 'Good morning', bn: 'শুভ সকাল' };
  if (h < 17) return { en: 'Good afternoon', bn: 'শুভ অপরাহ্ন' };
  if (h < 21) return { en: 'Good evening', bn: 'শুভ সন্ধ্যা' };
  return { en: 'Good night', bn: 'শুভ রাত্রি' };
}

function dayTypeBadge(type) {
  const label = DAY_TYPE_LABEL[type] || { en: type, bn: type };
  const tone = type === 'rest' ? 'rest' : ['mock', 'sectional', 'monthly', 'mock'].includes(type) ? 'brand' : type === 'buffer' ? 'warn' : type === 'learn' ? 'info' : 'line';
  return `<span class="pill ${tone}">${L(label)}</span>`;
}

function topicOf(state, sid) {
  const s = sessionById(state, sid);
  if (!s) return '';
  return `P${s.paper === 'P1' ? '1' : '2'} · U${s.unitN} · ${s.clusterName}`;
}

function nextDays(state, key, n = 3) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const k = addDays(key, i);
    const d = getDay(state, k);
    if (!d) continue;
    const sid = (d.s || [])[0];
    out.push({ key: k, d, sid });
  }
  return out;
}

export function render(state, param, App) {
  const today = todayKey();
  const start = state.profile.startDate;
  const key = /^\d{4}-\d{2}-\d{2}$/.test(param || '') ? param : today;
  const isPast = key < today;
  const isFuture = key > today;
  const dayNo = dayNumber(start, key);
  const net = dayNet(state, key);
  const day = getDay(state, key);
  const p = state.profile;
  const name = p.name ? esc(p.name) : bi('there', 'বন্ধু');
  const back = backlogItems(state);
  const rev = dueRevisions(state, key).length;
  const cardsDue = dueFlashcards(state, key).length;
  const prog = dayProgress(state, key);
  const overall = overallProgress(state);
  const tokens = restTokensLeft(state, key);

  /* ---------- before the plan starts ---------- */
  if (dayNo < 1) {
    const dLeft = -dayNo + 1;
    return `<div class="page-head"><div><div class="page-title">${bi('Almost time', 'শুরু হতে বাকি')}</div>
      <div class="page-sub">${esc(parseKey(start).toDateString())}</div></div></div>
      <div class="card center" style="padding:34px 18px">
        <div style="font-size:2rem">🧭</div>
        <div style="font-weight:800;font-size:1.1rem;margin-top:6px">${dLeft} ${bi('days to Day 1', 'দিন বাকি Day 1 পর্যন্ত')}</div>
        <p class="small muted mt">${bi('Everything is planned. Relax, set your folders up, and start on Day 1.', 'সব পরিকল্পনা তৈরি। নিশ্চিন্তে ফোল্ডার গুছিয়ে রাখো, Day 1-এ শুরু করো।')}</p>
        <button class="btn btn-soft mt-2" data-act="nav.go" data-to="calendar">${icon('calendar', 16)} ${bi('See the roadmap', 'রোডম্যাপ দেখো')}</button>
      </div>`;
  }

  /* ---------- after the plan ends ---------- */
  if (dayNo > 730) {
    return `<div class="page-head"><div><div class="page-title">${bi('The 730 days are done', '৭৩০ দিন শেষ')}</div>
      <div class="page-sub">${bi('Whatever the result, you finished what most people only plan.', 'ফল যা-ই হোক, বেশিরভাগ মানুষ যা শুধু পরিকল্পনা করে, তুমি তা শেষ করেছ।')}</div></div></div>
      <div class="card center" style="padding:34px 18px"><div style="font-size:2rem">🎓</div>
      <div style="font-weight:800;margin-top:6px">${bi('Keep the notebook.', 'নোটবুকটা রেখে দাও।')}</div></div>`;
  }

  if (!day) {
    return `<div class="page-head"><div><div class="page-title">${bi('No plan for this day', 'এই দিনের প্ল্যান নেই')}</div></div></div>
      ${emptyState('🗓️', bi('This date is outside your plan.', 'এই তারিখ তোমার প্ল্যানের বাইরে।'), '', `<button class="btn" data-act="nav.go" data-to="today">${bi('Back to today', 'আজকে ফিরে যাও')}</button>`)}`;
  }

  const tl = buildTimeline(state, key);
  const isRest = day.t === 'H';
  const quote = (state.quotes && state.quotes.length) ? state.quotes[(dayNo - 1) % state.quotes.length] : null;
  const quoteText = quote ? String(L(quote)).replace('{day}', dayNo) : '';
  const targetMin = Math.min(net, tl.tpl.total || net);
  const tip = tomorrowNote(state, key);

  /* activity status map */
  const log = (state.actLog || {})[key] || {};
  const seenActs = new Set();
  const actStatus = {};
  tl.rows.forEach((r) => {
    if (r.kind !== 'act') return;
    seenActs.add(r.actIndex);
    const rec = log[r.actIndex] || {};
    if (rec.status === 'done') actStatus[r.actIndex] = 'done';
    else if (rec.status === 'skipped') actStatus[r.actIndex] = 'skipped';
    else if (!actStatus[r.actIndex]) actStatus[r.actIndex] = 'todo';
    if (rec.status === 'partial') actStatus[r.actIndex] = 'partial';
  });
  const firstTodo = [...seenActs].sort((a, b) => a - b).find((i) => actStatus[i] !== 'done' && actStatus[i] !== 'skipped');
  const nowAct = firstTodo == null ? null : firstTodo;
  const coach = coachingSlotFor(state, key);

  const mainSid = (day.s || [])[0] || null;
  const mainSess = mainSid ? sessionById(state, mainSid) : null;

  return `
  <div class="page-head" style="margin-bottom:10px">
    <div style="min-width:0">
      <div class="eyebrow">${esc(parseKey(key).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))}${isPast ? ' · ' + bi('past day', 'আগের দিন') : ''}${isFuture ? ' · ' + bi('upcoming', 'আসছে') : ''}</div>
      <div class="page-title" style="margin-top:2px">${bi('Today', 'আজ')} · ${bi('Day', 'দিন')} ${dayNo}<span class="muted" style="font-size:.9rem;font-weight:600"> / 730</span></div>
    </div>
    <div class="row" style="gap:6px">${dayTypeBadge(day.t)}
      ${isFuture ? `<span class="pill line">${bi('planned', 'পরিকল্পিত')}</span>` : ''}
    </div>
  </div>

  <div class="card">
    <div class="day-hero">
      ${ring(isRest ? 0 : Math.min(100, Math.round((prog.done / (targetMin || 1)) * 100)), prog.done, bi(`/ ${targetMin} min`, `/ ${targetMin} মিনিট`), 144)}
      <div class="hero-txt">
        <div class="hero-greet">${L(greeting())}, ${name}!</div>
        <div class="hero-sub">${isRest
          ? bi('Rest day. Your plan has been shifted forward by one day.', 'বিশ্রামের দিন। প্ল্যান একদিন এগিয়ে গেছে।')
          : bi(`${tl.acts.length} blocks · ${targetMin} min planned today`, `আজ ${tl.acts.length}টি ব্লক · ${targetMin} মিনিট পরিকল্পিত`)}</div>
        <div class="hero-stats">
          <span class="hero-stat">🔥 <b>${streak(state)}</b> ${bi('day streak', 'দিনের স্ট্রিক')}</span>
          <span class="hero-stat">📚 <b>${rev + cardsDue}</b> ${bi('due', 'ডিউ')}</span>
          <span class="hero-stat">🎯 <b>${overall.pct}%</b> ${bi('first pass', 'প্রথম পাস')}</span>
        </div>
        ${!isRest ? `<div class="mt">
          <button class="btn btn-primary btn-sm" data-act="today.start" data-key="${esc(key)}">
            ${icon('play', 15)} ${prog.done > 0 ? bi('Continue session', 'সেশন চালিয়ে যাও') : bi('Start session', 'সেশন শুরু')}
          </button>
          ${!isPast && tokens > 0 && !state.restDays.includes(key) ? `<button class="btn btn-sm btn-ghost" data-act="today.rest" data-key="${esc(key)}">${bi('Rest today', 'আজ বিশ্রাম')}</button>` : ''}
        </div>` : ''}
      </div>
    </div>
    ${!isRest ? `<div class="mt">${progressBar(Math.min(100, Math.round((prog.done / (targetMin || 1)) * 100)), prog.complete ? 'ok' : '')}</div>` : ''}
  </div>

  <div class="stat-grid mt">
    <div class="stat"><div class="stat-v">${streak(state)}<span class="tiny muted"> d</span></div><div class="stat-k">${bi('streak', 'স্ট্রিক')}</div></div>
    <div class="stat"><div class="stat-v">${rev + cardsDue}</div><div class="stat-k">${bi('revision due', 'রিভিশন বাকি')}</div></div>
    <div class="stat"><div class="stat-v" style="${back.length > 3 ? 'color:var(--bad)' : ''}">${back.length}</div><div class="stat-k">${bi('backlog', 'ব্যাকলগ')}</div></div>
    <div class="stat"><div class="stat-v">${overall.pct}<span class="tiny muted">%</span></div><div class="stat-k">${bi('overall done', 'সামগ্রিক')}</div></div>
  </div>

  ${tl.compressed && !isRest ? `<div class="note-band mt" style="border-color:color-mix(in srgb,var(--warn) 35%, transparent);background:var(--warn-soft);color:var(--warn)">
    <span>⚡</span><span><b>${bi('Compressed day', 'সংকুচিত দিন')}:</b> ${net} ${bi('min available,', 'মিনিট পাওয়া যাচ্ছে,')}
    ${tl.deficit} ${bi('min short. The missing minutes are added to the Saturday backlog block.', 'মিনিট কম। বাকি মিনিট শনিবারের ব্যাকলগে যোগ হবে।')}</span></div>` : ''}

  ${back.length > 3 ? `<div class="note-band mt" style="border-color:color-mix(in srgb,var(--bad) 35%, transparent);background:var(--bad-soft);color:var(--bad)">
    <span>⚠</span><span><b>${bi('Backlog growing:', 'ব্যাকলগ বাড়ছে:')}</b> ${back.length} ${bi('sessions pending.', 'সেশন বাকি।')}
    <a href="#/backlog" style="font-weight:700">${bi('Review & re-plan →', 'দেখো ও রিপ্ল্যান →')}</a></span></div>` : ''}

  ${coach ? `<div class="note-band mt"><span>🎓</span><span>${bi('Coaching today', 'আজ কোচিং')} ${esc(coach.start)}–${esc(coach.end)} · ${esc((findCluster(state.syllabus, coach.clusterId)?.cluster.name) || '')}
    ${mainSess && coach.clusterId === mainSess.clusterId ? `<b> · ${bi('overlap → today uses the coaching template', 'ওভারল্যাপ → আজ কোচিং টেমপ্লেট')}</b>` : `<button class="btn btn-xs btn-soft" data-act="coach.sync" data-key="${esc(key)}" data-cid="${esc(coach.clusterId)}">${bi('Sync to plan', 'প্ল্যানে মেলাও')}</button>`}</span></div>` : ''}

  ${state.profile.showQuotes && quoteText ? `<div class="quote mt"><span class="q-ic">✶</span><span>${esc(quoteText)}</span></div>` : ''}

  <div class="row between mt-2" style="margin-bottom:8px">
    <div class="card-title">${bi('Timeline', 'টাইমলাইন')}</div>
    <div class="hint">${bi('Tap any block for its session card', 'যেকোনো ব্লকে ট্যাপ করে সেশন কার্ড দেখো')}</div>
  </div>

  ${isRest ? `<div class="card center" style="padding:28px 18px">
      <div style="font-size:1.8rem">🌙</div>
      <div style="font-weight:800;margin-top:6px">${bi('Rest day!', 'বিশ্রামের দিন!')}</div>
      <p class="small muted mt">${bi('You used a rest token. Your plan has been adjusted.', 'তুমি একটি বিশ্রাম টোকেন ব্যবহার করেছ। প্ল্যান সমন্বয় হয়েছে।')}</p>
      <div class="pill gold mt">${bi('Remaining tokens this month:', 'এই মাসে বাকি টোকেন:')} ${restTokensLeft(state, key)}</div>
      ${key === todayKey() ? `<div class="mt"><button class="btn btn-sm" data-act="today.unrest" data-key="${esc(key)}">${bi('Undo rest day', 'বিশ্রাম বাতিল করো')}</button></div>` : ''}
    </div>`
    : `<div class="timeline">
      ${p.ritual.enabled && p.ritual.start ? ritualRow(state, key) : ''}
      ${tl.rows.map((r) => rowHTML(state, key, r, actStatus, nowAct, mainSess, isPast)).join('')}
      ${tl.rows.length === 0 ? emptyState('🌙', bi('Nothing scheduled.', 'কিছু নির্ধারিত নেই।'), '') : ''}
    </div>`}

  <div class="card tight mt-2">
    <div class="card-h"><span class="card-title">${bi('Next 3 days', 'পরের ৩ দিন')}</span>
      <button class="btn btn-xs btn-ghost" data-act="nav.go" data-to="calendar">${bi('Calendar', 'ক্যালেন্ডার')}</button></div>
    ${nextDays(state, key).map((n) => `<div class="kv" style="align-items:center">
      <div style="min-width:0">
        <b style="font-size:.78rem">${esc(parseKey(n.key).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))}</b>
        <span class="pill ${n.d.t === 'H' ? 'rest' : 'line'}" style="margin-left:6px">${L(DAY_TYPE_LABEL[n.d.t] || { en: n.d.t, bn: n.d.t })}</span>
        <div class="tiny muted">${n.sid ? esc(topicOf(state, n.sid)) : L(TEMPLATES[n.d.t]?.name || { en: '', bn: '' })}</div>
      </div>
      <span class="tiny muted">${n.d.t === 'H' ? '' : (dayNet(state, n.key) + ' min')}</span>
    </div>`).join('')}
  </div>

  ${tip ? `<div class="note-band mt">${icon('info', 15)} <span>${tip}</span></div>` : ''}

  <div class="note-band mt">${icon('info', 15)} <span>${bi('First pass = you have studied everything once. Mastery comes from revision, testing and error correction in Phase 2. Completing Phase 1 does not guarantee exam readiness.',
    'প্রথম পাস = সবকিছু একবার পড়া হয়ে গেছে। দক্ষতা আসে Phase 2-এর রিভিশন, টেস্ট ও ভুল সংশোধন থেকে। Phase 1 শেষ হলেই পরীক্ষার প্রস্তুতি হয় না।')}</span></div>

  <div class="tiny muted center mt-2">${bi('Net today:', 'আজ নেট:')} ${dayMinutes(state, key)} / ${net} min · ${bi('Days to exam:', 'পরীক্ষা পর্যন্ত:')} ${Math.max(0, daysToExam(state))}</div>
  `;
}

function ritualRow(state, key) {
  const fmt = state.profile.timeFormat;
  const toMin = (s) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
  return `<div class="tl-row ritual">
    <div class="tl-rail"><div class="tl-time">${tStr(toMin(state.profile.ritual.start), fmt)}<span>${tStr(toMin(state.profile.ritual.end), fmt)}</span></div></div>
    <div class="tl-track"></div><div class="tl-dot"></div>
    <div class="tl-body">
      <div class="tl-head"><span class="tl-ic">🌅</span><div style="flex:1">
        <div class="tl-title">${bi('Morning ritual', 'সকালের রুটিন')}</div>
        <div class="tl-sub">${bi('Water, wash, light exercise', 'জল, ফ্রেশ হওয়া, হালকা ব্যায়াম')}</div>
      </div><span class="tl-min">${bi('not study', 'পড়া নয়')}</span></div>
    </div></div>`;
}

function rowHTML(state, key, r, actStatus, nowAct, mainSess, isPast) {
  if (r.kind === 'break') {
    return `<div class="tl-break"><span class="dash"></span><span>☕ ${bi('Break', 'বিরতি')} · ${r.minutes} min · ${r.startStr}</span></div>`;
  }
  if (r.kind === 'free') {
    return `<div class="tl-row free">
      <div class="tl-rail"><div class="tl-time">${r.startStr}<span>${r.endStr}</span></div></div>
      <div class="tl-track"></div><div class="tl-dot"></div>
      <div class="tl-body"><div class="tl-head"><span class="tl-ic">🫧</span><div><div class="tl-title">${bi('Free / buffer', 'ফ্রি / বাফার')}</div>
      <div class="tl-sub">${bi('Nothing scheduled — rest or clear a doubt.', 'কিছু নির্ধারিত নেই — বিশ্রাম বা ডাউট ক্লিয়ার করো।')}</div></div>
      <span class="tl-min">${r.minutes} min</span></div></div></div>`;
  }
  const st = actStatus[r.actIndex] || 'todo';
  const isNow = nowAct === r.actIndex;
  const cls = st === 'done' ? 'done' : st === 'skipped' ? 'skipped' : isNow ? 'now' : '';
  const partLabel = r.part > 1 || (r.minutes < r.act.mins) ? ` · ${bi('Part', 'অংশ')} ${r.part}` : '';
  const topic = mainSess ? `P${mainSess.paper === 'P1' ? '1' : '2'}-U${mainSess.unitN} · ${mainSess.clusterName}` : '';
  return `<div class="tl-row ${cls}">
    <div class="tl-rail"><div class="tl-time">${r.startStr}<span>${r.endStr}</span></div></div>
    <div class="tl-track"></div><div class="tl-dot"></div>
    <div class="tl-body" data-act="today.open" data-key="${esc(key)}" data-idx="${r.actIndex}" role="button" tabindex="0">
      <div class="tl-head">
        <span class="tl-ic">${r.act.icon || '•'}</span>
        <div style="flex:1;min-width:0">
          <div class="tl-title">${L(r.act.title)}${partLabel}</div>
          <div class="tl-sub">${L(r.act.sub || { en: '', bn: '' })}</div>
        </div>
        <span class="tl-min">${r.minutes} min</span>
      </div>
      <div class="tl-meta">
        ${topic ? `<span class="tl-topic">${esc(topic)}</span>` : ''}
        ${st === 'done' ? `<span class="pill ok">✓ ${bi('Done', 'সম্পন্ন')}</span>` : st === 'skipped' ? `<span class="pill line">${bi('Skipped', 'বাদ')}</span>` : isNow ? `<span class="pill brand">${bi('Next up', 'পরবর্তী')}</span>` : ''}
        ${r.minutes < r.act.mins ? `<span class="pill line">${bi('split', 'ভাগ')}</span>` : ''}
      </div>
      ${!isPast ? `<div class="tl-actions">
        ${st !== 'done' && r.part === 1 ? `<button class="btn btn-xs btn-ghost" data-act="today.quickdone" data-key="${esc(key)}" data-idx="${r.actIndex}">${icon('check', 13)} ${bi('Mark done', 'সম্পন্ন')}</button>` : ''}
        <span class="tl-expand">${bi('Open session card →', 'সেশন কার্ড খোলো →')}</span>
      </div>` : `<div class="tl-actions"><span class="tl-expand">${bi('See what was done →', 'কী হয়েছিল দেখো →')}</span></div>`}
    </div></div>`;
}

function tomorrowNote(state, key) {
  const tomorrow = addDays(key, 1);
  const d = getDay(state, tomorrow);
  if (!d) return '';
  const sid = (d.s || [])[0];
  if (d.t === 'H') return bi('Tomorrow is a rest day — the plan shifts by one day.', 'কাল বিশ্রামের দিন — প্ল্যান একদিন এগোবে।');
  if (!sid) return '';
  const s = sessionById(state, sid);
  return `${bi('Tomorrow:', 'কাল:')} <b>${esc(s.clusterName)}</b> — ${bi('session', 'সেশন')} ${s.n}/${s.of} · ${s.depth} · ${DAY_TYPE_LABEL[d.t] ? L(DAY_TYPE_LABEL[d.t]) : d.t}`;
}

/* ------------------------------------------------------------- actions */
register('today.open', ({ data }) => {
  openSessionSheet(R.state, R, data.key, Number(data.idx));
});
register('today.start', ({ data }) => {
  const state = R.state;
  const key = data.key || todayKey();
  const tl = buildTimeline(state, key);
  const log = (state.actLog || {})[key] || {};
  const doneIdx = new Set(tl.rows.filter((r) => r.kind === 'act' && log[r.actIndex] && log[r.actIndex].status === 'done').map((r) => r.actIndex));
  const skipIdx = new Set(tl.rows.filter((r) => r.kind === 'act' && log[r.actIndex] && log[r.actIndex].status === 'skipped').map((r) => r.actIndex));
  const first = [...new Set(tl.rows.filter((r) => r.kind === 'act').map((r) => r.actIndex))]
    .sort((a, b) => a - b).find((i) => !doneIdx.has(i) && !skipIdx.has(i));
  if (first == null) { R.toast(bi('Everything on today’s plan is done.', 'আজকের সব কাজ শেষ।'), 'ok'); return; }
  openSessionSheet(state, R, key, first);
});
register('today.quickdone', ({ data }) => {
  const state = R.state;
  const key = data.key;
  state.actLog = state.actLog || {};
  state.actLog[key] = state.actLog[key] || {};
  const idx = Number(data.idx);
  state.actLog[key][idx] = { ...(state.actLog[key][idx] || {}), status: 'done' };
  R.save();
  R.refresh();
  checkDayComplete(state, key);
});
register('today.rest', ({ data }) => {
  const state = R.state;
  const key = data.key || todayKey();
  const left = restTokensLeft(state, key);
  if (left <= 0) { R.toast(bi('No rest tokens left this month.', 'এই মাসে আর বিশ্রাম টোকেন নেই।'), 'bad'); return; }
  state.restDays = state.restDays || [];
  if (!state.restDays.includes(key)) state.restDays.push(key);
  R.save();
  R.ensurePlan({ force: true });
  R.refresh();
  R.toast(bi('Rest day saved. Your plan shifted forward by one day.', 'বিশ্রামের দিন সেভ হয়েছে। প্ল্যান একদিন এগিয়েছে।'), 'ok');
});
register('today.unrest', ({ data }) => {
  const state = R.state;
  state.restDays = (state.restDays || []).filter((k) => k !== data.key);
  R.save();
  R.ensurePlan({ force: true });
  R.refresh();
  R.toast(bi('Rest day removed. Your plan is back on its old dates.', 'বিশ্রাম বাতিল। প্ল্যান আগের তারিখে ফিরেছে।'), 'ok');
});
register('coach.sync', ({ data }) => {
  const state = R.state;
  const key = data.key;
  const cid = data.cid;
  const clusterDone = (state.clusters || {})[cid] && ['done', 'done-revisit', 'needs-help'].includes(state.clusters[cid].status);
  if (clusterDone) {
    state.revisions = state.revisions || [];
    state.revisions.push({ id: `${cid}-coach-${key}`, clusterId: cid, due: addDays(key, 1), offset: 1, done: false, kind: 'coached' });
    state.clusters[cid].coachedRevision = true;
    state.changelog = state.changelog || [];
    state.changelog.unshift({ at: new Date().toISOString(), kind: 'coaching', reason: `Coached revision queued → ${cid}` });
    R.save();
    R.toast(bi('Cluster already done — added to the coached-revision queue.', 'ক্লাস্টার আগেই শেষ — কোচড রিভিশন কিউতে যোগ হয়েছে।'), 'ok');
    R.refresh();
    return;
  }
  // move this cluster to the front of the remaining queue by regenerating from today
  // strategy: mark the day template as B via a manual coaching override
  state.coachingOverrides = state.coachingOverrides || {};
  state.coachingOverrides[key] = cid;
  const day = getDay(state, key);
  if (day && (day.s || [])[0] && String((day.s || [])[0]).startsWith(cid)) {
    day.t = 'B';
    state.changelog = state.changelog || [];
    state.changelog.unshift({ at: new Date().toISOString(), kind: 'coaching', reason: `Coaching sync → ${cid} on ${key}` });
    R.save();
    R.toast(bi('Today now uses the coaching template (Template B).', 'আজ কোচিং টেমপ্লেট (Template B) ব্যবহার হবে।'), 'ok');
    R.refresh();
  } else {
    R.toast(bi('That cluster is not in today’s plan yet. Adjust the coaching slot in Settings so the plan can follow it.', 'ওই ক্লাস্টার আজকের প্ল্যানে নেই। Settings-এ কোচিং স্লট ঠিক করো, প্ল্যান সেটি অনুসরণ করবে।'), 'warn');
  }
});
