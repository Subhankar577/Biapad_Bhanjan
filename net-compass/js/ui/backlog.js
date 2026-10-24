/* Backlog & re-planning. A missed session is never silently dropped. */
import { R } from '../runtime.js';
import { register } from './actions.js';
import { bi, esc, icon, emptyState, emptyState as empty, L } from './dom.js';
import {
  backlogItems, replanPreview, applyReplan, addDays, todayKey, parseKey, getDay, weekday,
  sessionById, markClusterSessionDone, dayNumber, keyForDay, DAY_TYPE_LABEL, TEMPLATES, dayNet
} from '../engine.js';

export function render(state) {
  const items = backlogItems(state);
  const changelog = (state.changelog || []).filter((c) => c.kind === 'replan').slice(0, 8);
  const saturdays = nextSaturdays(todayKey(), 3);

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Backlog', 'ব্যাকলগ')}</div>
      <div class="page-sub">${bi('Missed sessions are carried forward, never deleted', 'মিস হওয়া সেশন এগিয়ে আসে, কখনো মুছে যায় না')}</div></div>
    <button class="btn btn-primary btn-sm" data-act="bl.replan" ${items.length ? '' : 'disabled'}>${icon('refresh', 15)} ${bi('Re-plan', 'রিপ্ল্যান')}</button>
  </div>

  ${items.length > 7 ? `<div class="note-band mb" style="background:var(--bad-soft);border-color:color-mix(in srgb,var(--bad) 35%, transparent);color:var(--bad)">
      <span>⚠</span><span><b>${bi('Backlog above 7 sessions.', 'ব্যাকলগ ৭ সেশনের বেশি।')}</b>
      ${bi('Consider a catch-up week: turn the next week’s weekdays into backlog recovery, then resume new topics.',
        'ক্যাচ-আপ সপ্তাহ ভাবো: পরের সপ্তাহের কর্মদিবস ব্যাকলগ রিকভারিতে দাও, তারপর নতুন টপিক শুরু করো।')}</span></div>`
    : items.length > 3 ? `<div class="note-band mb" style="background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 35%, transparent);color:var(--warn)">
      <span>⚠</span><span><b>${bi('Backlog growing.', 'ব্যাকলগ বাড়ছে।')}</b> ${bi('Re-plan or use the Saturday block before it compounds.', 'বাড়ার আগেই রিপ্ল্যান করো বা শনিবারের ব্লক ব্যবহার করো।')}</span></div>` : ''}

  <div class="card">
    <div class="card-h"><span class="card-title">${bi('Pending sessions', 'বাকি সেশন')}</span><span class="pill ${items.length ? 'warn' : 'ok'}">${items.length}</span></div>
    ${items.length === 0 ? empty('✅', bi('Backlog is clear.', 'ব্যাকলগ পরিষ্কার।'), bi('Every planned session up to today is logged.', 'আজ পর্যন্ত প্রতিটি পরিকল্পিত সেশন লগ হয়েছে।'))
      : `<div class="col" style="gap:8px">
        ${items.slice(0, 40).map((it) => `<div class="card tight" style="background:var(--surface-2);box-shadow:none">
          <div class="row between" style="align-items:flex-start;gap:8px">
            <div style="min-width:0">
              <div class="row wrap" style="gap:5px;margin-bottom:3px">
                <span class="pill bad">${it.depth}</span>
                <span class="pill line">${esc(it.plannedDate)}</span>
                ${it.partial ? `<span class="pill warn">${bi('partial', 'আংশিক')}</span>` : ''}
                <span class="tiny muted">${bi('priority', 'প্রায়োরিটি')} ${Math.round(it.priority)}</span>
              </div>
              <b style="font-size:.83rem">${esc(it.clusterName)}</b>
              <div class="tiny muted">${it.paper === 'P1' ? 'Paper I' : 'Paper II'} · U${it.unitN} · ${bi('session', 'সেশন')} ${it.n}/${it.of} · ${esc(it.unitName.en)}</div>
            </div>
            <div class="row" style="gap:3px">
              <button class="icon-btn" title="${bi('Mark recovered', 'রিকভার হয়েছে')}" data-act="bl.done" data-sid="${esc(it.sid)}">${icon('check', 15)}</button>
              <button class="icon-btn" title="${bi('Open session', 'সেশন খোলো')}" data-act="bl.open" data-sid="${esc(it.sid)}">${icon('chevron', 15)}</button>
            </div>
          </div>
        </div>`).join('')}
      </div>`}
  </div>

  <div class="card mt">
    <div class="card-title mb">${bi('Recovery slots', 'রিকভারি স্লট')}</div>
    <div class="hint mb">${bi('One full backlog session per Saturday (fast mode), so PYQ time is protected.', 'প্রতি শনিবার একটি পূর্ণ ব্যাকলগ সেশন (ফাস্ট মোড), যাতে PYQ সময় বাঁচে।')}</div>
    ${saturdays.map((k) => {
      const d = getDay(state, k);
      return `<div class="kv"><span>${esc(parseKey(k).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' }))}
        <span class="tiny muted"> · ${d ? L(DAY_TYPE_LABEL[d.t] || { en: d.t, bn: d.t }) : ''}</span></span>
        <b>${d && d.t === 'H' ? bi('rest', 'বিশ্রাম') : (dayNet(state, k) + ' min')}</b></div>`;
    }).join('')}
    <div class="hint mt">${bi('If Saturday is full, the next available flex day is used. The 180-minute cap is never exceeded, even for backlog.',
      'শনিবার ভরে গেলে পরের ফ্লেক্স ডে ব্যবহার হয়। ব্যাকলগেও ১৮০ মিনিটের সীমা কখনো ভাঙে না।')}</div>
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('Re-plan changelog', 'রিপ্ল্যান চেঞ্জলগ')}</span>
      <span class="hint">${(state.changelog || []).length} ${bi('entries', 'এন্ট্রি')}</span></div>
    ${changelog.length === 0 ? `<div class="hint">${bi('No re-plan applied yet.', 'এখনও রিপ্ল্যান হয়নি।')}</div>`
      : changelog.map((c) => `<div class="kv"><span>${esc(new Date(c.at).toLocaleString())}<div class="tiny muted">${esc(c.reason || '')}</div></span>
        <b class="tiny">${c.moved || 0} ${bi('days moved', 'দিন সরেছে')}</b></div>`).join('')}
  </div>

  <div class="note-band mt">${icon('info', 15)} <span>${bi('Re-plan keeps everything you finished and re-flows the rest through buffer and consolidation days. Nothing is skipped.',
    'রিপ্ল্যান তোমার শেষ করা সব রাখে এবং বাকিগুলো বাফার ও কনসোলিডেশন দিনে ভরে দেয়। কিছুই বাদ যায় না।')}</span></div>`;
}

function nextSaturdays(from, n) {
  const out = [];
  let k = from;
  let guard = 0;
  while (out.length < n && guard++ < 60) {
    if (weekday(k) === 6) out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

/* ------------------------------------------------------------- actions */
register('bl.replan', () => {
  const state = R.state;
  const preview = replanPreview(state);
  const items = backlogItems(state);
  R.openSheet({
    title: bi('Re-plan preview', 'রিপ্ল্যান প্রিভিউ'),
    sub: bi('Nothing is applied until you confirm.', 'কনফার্ম না করলে কিছু প্রয়োগ হবে না।'),
    body: `
      <div class="grid g3">
        <div class="stat"><div class="stat-v">${items.length}</div><div class="stat-k">${bi('pending', 'বাকি')}</div></div>
        <div class="stat"><div class="stat-v">${preview.moved.length}</div><div class="stat-k">${bi('days changed', 'দিন বদলাবে')}</div></div>
        <div class="stat"><div class="stat-v">${Object.keys(preview.days).length}</div><div class="stat-k">${bi('days in plan', 'প্ল্যানের দিন')}</div></div>
      </div>
      <div class="card tight mt"><div class="label mb">${bi('First changes', 'প্রথম পরিবর্তন')}</div>
        ${preview.moved.slice(0, 12).map((m) => `<div class="kv"><span>${esc(m.key)}</span><b class="tiny">${esc(String(m.from).slice(0, 18))} → ${esc(String(m.to).slice(0, 18))}</b></div>`).join('')}
        ${preview.moved.length === 0 ? `<div class="hint">${bi('The plan already matches the remaining sessions.', 'প্ল্যান ইতিমধ্যেই বাকি সেশনগুলোর সাথে মিলে আছে।')}</div>` : ''}
      </div>
      <div class="hint mt">${bi('Why: completed sessions are removed from the queue, and the remaining queue is re-flowed from today through the same weekly pattern. Buffer, coaching and rest days are preserved.',
        'কারণ: শেষ হওয়া সেশন কিউ থেকে বাদ যায়, বাকি কিউ আজ থেকে একই সাপ্তাহিক প্যাটার্নে আবার বসানো হয়। বাফার, কোচিং ও বিশ্রামের দিন অপরিবর্তিত থাকে।')}</div>
      <button class="btn btn-primary btn-block mt" data-act="bl.apply">${icon('check', 16)} ${bi('Apply re-plan', 'রিপ্ল্যান প্রয়োগ')}</button>
      <button class="btn btn-ghost btn-block mt" data-act="sheet.close">${bi('Cancel', 'বাতিল')}</button>`
  });
});

register('bl.apply', () => {
  const state = R.state;
  const preview = replanPreview(state);
  applyReplan(state, preview, 'Backlog re-plan from the Backlog screen');
  R.save();
  R.closeSheet();
  R.refresh();
  R.toast(bi('Plan re-flowed. Your finished sessions are untouched.', 'প্ল্যান আবার সাজানো হয়েছে। শেষ করা সেশন অপরিবর্তিত।'), 'ok');
});

register('bl.done', ({ data }) => {
  const state = R.state;
  const sess = sessionById(state, data.sid);
  if (!sess) return;
  markClusterSessionDone(state, sess);
  R.save(); R.refresh();
  R.toast(bi('Marked recovered.', 'রিকভার হয়েছে।'), 'ok');
});

register('bl.open', ({ data }) => {
  const state = R.state;
  const sess = sessionById(state, data.sid);
  if (!sess) return;
  const idx = Object.entries(state.plan?.days || {}).find(([, d]) => (d.s || []).includes(data.sid));
  if (idx) R.go(`today/${idx[0]}`);
  else R.toast(bi('This session is no longer scheduled — re-plan first.', 'এই সেশন আর নির্ধারিত নেই — আগে রিপ্ল্যান করো।'), 'warn');
});
