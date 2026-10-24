/* Study-window picker — used in onboarding (step 4) and Settings.
   24-hour strip + drag to draw + exact time inputs + net-time maths. */
import { R } from '../runtime.js';
import { register } from './actions.js';
import { bi, esc, icon } from './dom.js';
import {
  validateWindows, netOfGross, grossOf, PRESETS, MAX_NET, tMin, tStr
} from '../engine.js';

const DAY_NAMES = [
  { en: 'Sun', bn: 'রবি' }, { en: 'Mon', bn: 'সোম' }, { en: 'Tue', bn: 'মঙ্গল' },
  { en: 'Wed', bn: 'বুধ' }, { en: 'Thu', bn: 'বৃহঃ' }, { en: 'Fri', bn: 'শুক্র' }, { en: 'Sat', bn: 'শনি' }
];

export function windowsOf(state, day) {
  return (state.profile.studyWindows || {})[day] || [];
}
export function setWindows(state, day, list) {
  state.profile.studyWindows = state.profile.studyWindows || {};
  state.profile.studyWindows[day] = list;
}

/** Saves only when the day stays within the hard cap and has no overlaps. */
export function trySetWindows(state, day, list) {
  const sorted = list.slice().sort((a, b) => tMin(a.start) - tMin(b.start));
  const chk = validateWindows(sorted);
  if (chk.error === 'too-much') {
    R.toast(bi('Maximum 180 minutes per day. Please reduce your study windows.', 'দিনে সর্বোচ্চ ১৮০ মিনিট। স্টাডি উইন্ডো কমাও।'), 'bad');
    return false;
  }
  if (chk.error === 'overlap' || chk.error === 'end-before-start') {
    R.toast(bi('Check the times: windows overlap or end before they start.', 'সময় দেখো: উইন্ডো ওভারল্যাপ করছে বা শেষ আগে।'), 'bad');
    return false;
  }
  setWindows(state, day, sorted);
  return true;
}
export function dayNetOf(state, day) {
  return windowsOf(state, day).reduce((s, w) => s + netOfGross(grossOf(w)), 0);
}

/** Draw the 24h strip + editors for one day. */
export function windowsBlock(state, day, opts = {}) {
  const list = windowsOf(state, day);
  const net = dayNetOf(state, day);
  const check = validateWindows(list);
  const tone = net > MAX_NET ? 'bad' : net >= 175 ? 'warn' : net > 0 ? 'ok' : '';
  const label = `${net} / ${MAX_NET} ${bi('min net', 'মিনিট নেট')}`;
  return `<div class="col" data-winblock>
    ${opts.showDayTabs !== false ? `<div class="row wrap" style="gap:5px">
      ${DAY_NAMES.map((d, i) => `<button class="chip ${i === day ? 'on' : ''}" data-act="win.day" data-day="${i}" style="padding:5px 9px;font-size:.7rem">${bi(d.en, d.bn)}</button>`).join('')}
    </div>` : ''}

    <div class="wstrip" data-wstrip data-day="${day}" title="${bi('Drag on the strip to add a study window', 'স্ট্রিপে ড্র্যাগ করে স্টাডি উইন্ডো যোগ করো')}">
      ${Array.from({ length: 24 }, (_, h) => `<span class="hour ${h % 3 === 0 ? 'lbl' : ''}" style="left:${(h / 24) * 100}%" data-h="${h}:00"></span>`).join('')}
      ${list.map((w, i) => {
        const l = (tMin(w.start) / 1440) * 100;
        const width = Math.max(1.2, ((tMin(w.end) - tMin(w.start)) / 1440) * 100);
        return `<div class="wblock" style="left:${l}%;width:${width}%" data-act="win.focus" data-day="${day}" data-idx="${i}" title="${esc(w.start)}–${esc(w.end)}">
          ${tStr(tMin(w.start), state.profile.timeFormat)}<span style="opacity:.55;margin-left:4px">– ${tStr(tMin(w.end), state.profile.timeFormat)}</span></div>`;
      }).join('')}
    </div>

    <div class="netbar ${tone}">
      <div><b>${bi('Net study time:', 'নেট পড়ার সময়:')} ${net} / ${MAX_NET}</b>
        <div class="tiny muted">${bi('5-minute break after every 55 minutes is not counted as study.', 'প্রতি ৫৫ মিনিট পড়ার পর ৫ মিনিট বিরতি পড়ার সময়ে গোনা হয় না।')}</div>
      </div>
      <span class="pill ${tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'ok'}">${label}</span>
    </div>
    ${net > MAX_NET ? `<div class="error-txt">${bi('Maximum 180 minutes per day. Please reduce your study windows.', 'দিনে সর্বোচ্চ ১৮০ মিনিট। স্টাডি উইন্ডো কমাও।')}</div>` : ''}
    ${check.error === 'overlap' ? `<div class="error-txt">${bi('Two windows overlap. Please fix the times.', 'দুটি উইন্ডো ওভারল্যাপ করছে। সময় ঠিক করো।')}</div>` : ''}
    ${net > 0 && net < 60 ? `<div class="hint">${bi('⚡ Under 60 minutes: the plan will compress heavily. Consider a rest token instead.', '⚡ ৬০ মিনিটের কম: প্ল্যান অনেক সংকুচিত হবে। বিশ্রাম টোকেন ভাবার কথা।')}</div>` : ''}

    ${!list.length ? `<div class="hint">${bi('No study window on this day. Drag on the strip above or press “Add window”.', 'এই দিনে কোনো স্টাডি উইন্ডো নেই। উপরের স্ট্রিপে ড্র্যাগ করো বা “উইন্ডো যোগ” চাপো।')}</div>` : ''}
    <div class="col" style="gap:7px">
      ${list.map((w, i) => `<div class="wedit">
        <input class="input" type="time" value="${esc(w.start)}" data-change="win.set" data-day="${day}" data-idx="${i}" data-field="start" aria-label="${bi('Start', 'শুরু')}">
        <span class="muted tiny">→</span>
        <input class="input" type="time" value="${esc(w.end)}" data-change="win.set" data-day="${day}" data-idx="${i}" data-field="end" aria-label="${bi('End', 'শেষ')}">
        <button class="icon-btn" data-act="win.del" data-day="${day}" data-idx="${i}" aria-label="${bi('Remove window', 'উইন্ডো সরাও')}">${icon('trash', 15)}</button>
      </div>`).join('')}
    </div>

    <div class="row wrap" style="gap:6px">
      <button class="btn btn-sm btn-soft" data-act="win.add" data-day="${day}">${icon('plus', 14)} ${bi('Add window', 'উইন্ডো যোগ')}</button>
      <button class="btn btn-sm" data-act="win.preset" data-day="${day}" data-preset="early">${bi('Early Bird', 'আর্লি বার্ড')} ~180</button>
      <button class="btn btn-sm" data-act="win.preset" data-day="${day}" data-preset="split">${bi('Split Day', 'স্প্লিট ডে')} ~180</button>
    </div>
    <div class="row wrap" style="gap:6px">
      <button class="btn btn-xs btn-ghost" data-act="win.apply" data-day="${day}" data-target="weekdays">${bi('Apply to Mon–Sat', 'সোম–শনি সব দিনে')}</button>
      <button class="btn btn-xs btn-ghost" data-act="win.apply" data-day="${day}" data-target="all">${bi('Apply to all 7 days', 'সাত দিনেই')}</button>
      <span class="hint">${bi('Tip: keep the earliest window for the hardest topic.', 'টিপ: সবচেয়ে কঠিন টপিকের জন্য প্রথম উইন্ডো রাখো।')}</span>
    </div>
  </div>`;
}

let activeDay = 1;
export function setActiveDay(d) { activeDay = Number(d) || 0; }
export function getActiveDay() { return activeDay; }

export function mountWindows(root) {
  const strip = root.querySelector('[data-wstrip]');
  if (!strip) return;
  let ghost = null;
  let startMin = null;
  const day = Number(strip.dataset.day);

  const pos = (ev) => {
    const r = strip.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left));
    return Math.round(((x / r.width) * 1440) / 5) * 5;
  };
  const down = (ev) => {
    if (ev.target.closest('.wblock')) return;
    startMin = pos(ev);
    ghost = document.createElement('div');
    ghost.className = 'wblock';
    ghost.style.background = 'color-mix(in srgb, var(--brand) 45%, transparent)';
    ghost.style.pointerEvents = 'none';
    strip.appendChild(ghost);
    ev.preventDefault();
  };
  const move = (ev) => {
    if (startMin == null || !ghost) return;
    const cur = pos(ev);
    const a = Math.min(startMin, cur), b = Math.max(startMin, cur);
    ghost.style.left = `${(a / 1440) * 100}%`;
    ghost.style.width = `${Math.max(0.6, ((b - a) / 1440) * 100)}%`;
  };
  const up = (ev) => {
    if (startMin == null) return;
    const cur = pos(ev);
    let a = Math.min(startMin, cur), b = Math.max(startMin, cur);
    if (b - a < 20) { a = startMin; b = startMin + 60; }
    ghost && ghost.remove();
    ghost = null; startMin = null;
    const list = windowsOf(R.state, day).slice();
    list.push({ start: tStr(a, '24'), end: tStr(b, '24') });
    if (trySetWindows(R.state, day, list)) { R.save(); R.refresh(); }
  };
  strip.addEventListener('pointerdown', down);
  strip.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up, { once: true });
}

/* ------------------------------------------------------------- actions */
register('win.day', ({ data }) => {
  const day = Number(data.day);
  const state = R.state;
  // carry the edited day over when switching to an empty day
  setActiveDay(day);
  R.refresh();
});

register('win.add', ({ data }) => {
  const state = R.state;
  const day = Number(data.day);
  const list = windowsOf(state, day).slice();
  const last = list[list.length - 1];
  let start = '06:00', end = '07:00';
  if (last) {
    const e = tMin(last.end) + 15;
    start = tStr(Math.min(e, 23 * 60), '24');
    end = tStr(Math.min(e + 60, 23 * 60 + 59), '24');
  }
  list.push({ start, end });
  if (trySetWindows(state, day, list)) { R.save(); R.refresh(); }
});

register('win.del', ({ data }) => {
  const state = R.state;
  const day = Number(data.day);
  const list = windowsOf(state, day).slice();
  list.splice(Number(data.idx), 1);
  setWindows(state, day, list);
  R.save(); R.refresh();
});

register('win.set', ({ data, value, el }) => {
  const state = R.state;
  const day = Number(data.day);
  const list = windowsOf(state, day).slice();
  const i = Number(data.idx);
  if (!list[i] || !value) return;
  const w = { ...list[i], [data.field]: value };
  // auto-fix: keep at least 30 minutes
  if (tMin(w.end) - tMin(w.start) < 30) {
    if (data.field === 'start') w.end = tStr(Math.min(tMin(w.start) + 30, 1439), '24');
    else w.start = tStr(Math.max(tMin(w.end) - 30, 0), '24');
  }
  list[i] = w;
  if (trySetWindows(state, day, list)) { R.save(); R.refresh(); } else { R.refresh(); }
});

register('win.preset', ({ data }) => {
  const state = R.state;
  const day = Number(data.day);
  const preset = PRESETS[data.preset];
  if (!preset) return;
  if (trySetWindows(state, day, preset.windows.map((w) => ({ ...w })))) { R.save(); R.refresh(); }
});

register('win.apply', ({ data }) => {
  const state = R.state;
  const day = Number(data.day);
  const list = windowsOf(state, day).map((w) => ({ ...w }));
  const target = data.target;
  const days = target === 'all' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
  if (!list.length) {
    R.toast(bi('This day has no study window yet — add one before copying it.', 'এই দিনে এখনও স্টাডি উইন্ডো নেই — কপি করার আগে একটি যোগ করো।'), 'warn');
    return;
  }
  const check = validateWindows(list);
  if (check.error) {
    R.toast(bi('Fix this day’s windows before copying them to other days.', 'অন্য দিনে কপি করার আগে এই দিনের উইন্ডো ঠিক করো।'), 'bad');
    return;
  }
  days.forEach((d) => setWindows(state, d, list.map((w) => ({ ...w }))));
  R.save(); R.refresh();
  R.toast(bi('Study windows applied.', 'স্টাডি উইন্ডো প্রয়োগ হয়েছে।'), 'ok');
});

register('win.focus', ({ data }) => {
  setActiveDay(Number(data.day));
});
