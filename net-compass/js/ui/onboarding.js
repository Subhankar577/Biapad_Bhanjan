/* Onboarding wizard — 5 steps. Also reused as "Re-run setup" from Settings. */
import { R } from '../runtime.js';
import { register } from './actions.js';
import { bi, esc, icon, ring } from './dom.js';
import { windowsBlock, mountWindows, getActiveDay, setActiveDay, dayNetOf, windowsOf } from './windows.js';
import {
  todayKey, addDays, parseKey, dayNumber, keyForDay, MAX_NET, netOfGross, grossOf
} from '../engine.js';
import { targetExamDate, daysToExam } from '../store.js';
import { PAPER_II_ORDER } from '../data/syllabus.js';

let ob = { step: 1, editing: false, enteredAt: 0 };

/** Called by the router when the setup screen is opened again. */
export function resetWizard() { ob.step = 1; ob.editing = true; }

const MONTHS = [
  { en: 'January', bn: 'জানুয়ারি' }, { en: 'February', bn: 'ফেব্রুয়ারি' }, { en: 'March', bn: 'মার্চ' },
  { en: 'April', bn: 'এপ্রিল' }, { en: 'May', bn: 'মে' }, { en: 'June', bn: 'জুন' },
  { en: 'July', bn: 'জুলাই' }, { en: 'August', bn: 'আগস্ট' }, { en: 'September', bn: 'সেপ্টেম্বর' },
  { en: 'October', bn: 'অক্টোবর' }, { en: 'November', bn: 'নভেম্বর' }, { en: 'December', bn: 'ডিসেম্বর' }
];

function timeOptions(startH, endH, stepMin = 15) {
  const out = [];
  for (let m = startH * 60; m <= endH * 60; m += stepMin) out.push(m);
  return out;
}

function optionList(values, selected, fmt = '12') {
  return values.map((m) => `<option value="${m}" ${Number(selected) === m ? 'selected' : ''}>${fmt === '12' ? minTo(m) : m}</option>`).join('');
}
function minTo(m) {
  const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ap}`;
}

function totalWeeklyNet(state) {
  let t = 0;
  for (let d = 0; d < 7; d++) t += dayNetOf(state, d);
  return t;
}

function coachingSlotRow(state, s, i) {
  const paper = state.syllabus.find((p) => p.id === s.paperId) || state.syllabus[1];
  const unit = paper.units.find((u) => u.id === s.unitId) || paper.units[0];
  const cluster = unit.clusters.find((c) => c.id === s.clusterId) || unit.clusters[0];
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day];
  const dnBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'][s.day];
  return `<div class="row between" style="gap:8px;padding:9px;border:1px solid var(--line);border-radius:11px;background:var(--surface-2)">
    <div style="min-width:0">
      <b style="font-size:.8rem">${bi(dayName, dnBn)} · ${esc(s.start)}–${esc(s.end)}</b>
      <div class="tiny muted">${esc(unit.name.en)} → ${esc(cluster.name)}</div>
    </div>
    <button class="icon-btn" data-act="ob.delslot" data-idx="${i}" aria-label="${bi('Remove class', 'ক্লাস সরাও')}">${icon('trash', 15)}</button>
  </div>`;
}

function clusterOptions(state, paperId, unitId) {
  const paper = state.syllabus.find((p) => p.id === paperId) || state.syllabus[1];
  return paper.units.map((u) => `<optgroup label="${esc(u.name.en)}">${u.clusters.map((c) =>
    `<option value="${c.id}" data-unit="${u.id}" ${u.id === unitId ? '' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
}

export function render(state, App, opts = {}) {
  const editing = !!(opts.editing || ob.editing);
  ob.editing = editing;
  const step = ob.step;
  const p = state.profile;

  const head = `<div class="ob-top">
    <span class="brand-mark">${icon('compass', 22)}</span>
    <div>
      <div style="font-weight:800;font-size:.92rem">${bi('NET Compass', 'নেট কম্পাস')}</div>
      <div class="tiny muted">${bi('Every day one step, goal NET', 'প্রতিদিন এক ধাপ, লক্ষ্য NET')}</div>
    </div>
    <div class="ob-dots">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
    ${editing ? `<button class="btn btn-xs btn-ghost" data-act="nav.go" data-to="today" aria-label="${bi('Close setup', 'সেটআপ বন্ধ')}">${icon('x', 15)}</button>` : ''}
  </div>`;

  let body = '';
  if (step === 1) body = step1(state);
  else if (step === 2) body = step2(state);
  else if (step === 3) body = step3(state);
  else if (step === 4) body = step4(state);
  else body = step5(state);

  const foot = `<div class="ob-foot">
    ${step > 1 ? `<button class="btn" data-act="ob.prev">${icon('chevron', 16)} ${bi('Back', 'পিছনে')}</button>` : ''}
    <div class="spacer"></div>
    ${step < 5
      ? `<button class="btn btn-primary" data-act="ob.next">${bi('Continue', 'পরবর্তী')} ${icon('chevron', 16)}</button>`
      : `<button class="btn btn-primary" data-act="ob.finish">${icon('sparkle', 17)} ${editing ? bi('Save & regenerate plan', 'সেভ করে প্ল্যান আবার তৈরি') : bi('Generate my plan', 'আমার প্ল্যান তৈরি করো')}</button>`}
  </div>`;

  return `<div class="onboard">${head}<div class="ob-body">${body}</div>${foot}
    <div class="tiny muted center" style="margin-top:12px">${bi('Everything stays on this device. No account, no cloud.', 'সবকিছু এই ডিভাইসেই থাকে। অ্যাকাউন্ট নেই, ক্লাউড নেই।')}</div>
  </div>`;
}

/* ---------------------------------------------------------------- step 1 */
function step1(state) {
  const p = state.profile;
  return `<div>
    <div class="ob-title">${bi('Welcome aboard.', 'স্বাগতম।')}</div>
    <p class="ob-sub mt">${bi('This app creates a personalised daily study plan for UGC NET. It tells you exactly what to study, when, and for how long — every single day for 2 years.',
      'এই অ্যাপটি UGC NET-এর জন্য তোমার নিজের ডেইলি স্টাডি প্ল্যান বানায়। কী পড়বে, কখন পড়বে, কতক্ষণ পড়বে — ২ বছরের প্রতিটি দিনের জন্য।')}</p>
  </div>
  <div class="card">
    <div class="label mb">${bi('Language / ভাষা', 'ভাষা / Language')}</div>
    <div class="seg full">
      <button class="${p.lang === 'bn' ? 'active' : ''}" data-act="ob.lang" data-lang="bn">বাংলা</button>
      <button class="${p.lang === 'en' ? 'active' : ''}" data-act="ob.lang" data-lang="en">English</button>
    </div>
    <div class="hr"></div>
    <div class="field">
      <label for="ob-name">${bi('Your name', 'তোমার নাম')}</label>
      <input class="input" id="ob-name" data-input="ob.name" value="${esc(p.name)}" placeholder="${bi('e.g. Riya', 'যেমন রিয়া')}" autocomplete="name" maxlength="40" />
      <span class="hint">${bi('Only used for the greeting on your home screen.', 'শুধু হোম স্ক্রিনের অভিবাদনে ব্যবহার হবে।')}</span>
    </div>
  </div>
  <div class="card">
    <div class="ob-feat"><span class="ic">🧭</span><div><b>${bi('A plan, not another to-do list', 'প্ল্যান, আরেকটা টু-ডু লিস্ট নয়')}</b>
      <p>${bi('209 sessions across Paper I and Paper II, spread over 730 days.', 'পত্র I ও II মিলিয়ে ২০৯টি সেশন, ৭৩০ দিনে ভাগ করা।')}</p></div></div>
    <div class="ob-feat"><span class="ic">⏱️</span><div><b>${bi('Minute-accurate, max 180 minutes a day', 'মিনিট ধরে সাজানো, দিনে সর্বোচ্চ ১৮০ মিনিট')}</b>
      <p>${bi('Breaks are inserted automatically and never counted as study time.', 'বিরতি স্বয়ংক্রিয়ভাবে বসে এবং পড়ার সময়ে গোনা হয় না।')}</p></div></div>
    <div class="ob-feat"><span class="ic">🔁</span><div><b>${bi('Revision is built in', 'রিভিশন আগেই বসানো')}</b>
      <p>${bi('Spaced recall at D+1, D+7, D+30 and D+90 for every cluster.', 'প্রতিটি ক্লাস্টারের জন্য D+1, D+7, D+30, D+90-এ রিকল।')}</p></div></div>
    <div class="ob-feat"><span class="ic">📴</span><div><b>${bi('Free resources only, works offline', 'শুধু ফ্রি রিসোর্স, অফলাইনেও চলে')}</b>
      <p>${bi('Search links and free official portals. Nothing is locked behind a payment.', 'সার্চ লিংক ও ফ্রি অফিসিয়াল পোর্টাল। কোনো পেমেন্ট নেই।')}</p></div></div>
  </div>`;
}

/* ---------------------------------------------------------------- step 2 */
function step2(state) {
  const p = state.profile;
  const d = daysToExam(state);
  const startD = parseKey(p.startDate);
  const year = new Date().getFullYear();
  return `<div>
    <div class="ob-title">${bi('Dates & countdown', 'তারিখ ও কাউন্টডাউন')}</div>
    <p class="ob-sub mt">${bi('Your plan starts on the date you choose. Nothing is hard-coded — every date in the app is relative to Day 1.',
      'তোমার বেছে নেওয়া তারিখ থেকে প্ল্যান শুরু। কোনো তারিখ আগে থেকে বসানো নেই — অ্যাপের সব তারিখ Day 1 থেকে হিসাব হয়।')}</p>
  </div>
  <div class="card">
    <div class="field">
      <label for="ob-start">${bi('Start date (Day 1)', 'শুরুর তারিখ (Day 1)')}</label>
      <input class="input" type="date" id="ob-start" data-change="ob.start" value="${esc(p.startDate)}" />
      <span class="hint">${bi('Defaults to today on this device.', 'এই ডিভাইসের আজকের তারিখ আগে থেকে বসানো।')}</span>
    </div>
    <div class="hr"></div>
    <div class="row wrap" style="gap:10px">
      <div class="field" style="flex:1;min-width:130px">
        <label for="ob-month">${bi('Target exam month', 'টার্গেট পরীক্ষার মাস')}</label>
        <select class="select" id="ob-month" data-change="ob.targetMonth">
          ${MONTHS.map((m, i) => `<option value="${i + 1}" ${Number(p.targetExam.month) === i + 1 ? 'selected' : ''}>${bi(m.en, m.bn)}</option>`).join('')}
        </select>
      </div>
      <div class="field" style="flex:1;min-width:100px">
        <label for="ob-year">${bi('Year', 'বছর')}</label>
        <select class="select" id="ob-year" data-change="ob.targetYear">
          ${[year, year + 1, year + 2, year + 3].map((y) => `<option value="${y}" ${Number(p.targetExam.year) === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="note-band mt">${icon('info', 15)} <span>${bi('UGC NET is usually held in June and December cycles. Confirm the exact date from the latest NTA Information Bulletin — this app only stores your target, it does not predict the exam date.',
      'UGC NET সাধারণত জুন ও ডিসেম্বর সাইকেলে হয়। সঠিক তারিখ সর্বশেষ NTA Information Bulletin থেকে যাচাই করুন — অ্যাপটি শুধু তোমার টার্গেট রাখে।')}</span></div>
  </div>
  <div class="grid g2">
    <div class="stat"><div class="stat-v">Day 1</div><div class="stat-k">${bi('of 730', '৭৩০-এর মধ্যে')}</div></div>
    <div class="stat"><div class="stat-v">${Math.max(0, d)}</div><div class="stat-k">${bi('days to target exam', 'টার্গেট পরীক্ষা পর্যন্ত দিন')}</div></div>
  </div>
  <div class="card tight">
    <div class="card-h" style="margin-bottom:8px"><span class="card-title">${bi('The two-year shape', 'দুই বছরের ছবি')}</span></div>
    <div class="timeline-phases">
      <div class="phase"><b>${bi('Phase 1 · Year 1', 'Phase 1 · ১ম বছর')}</b><span>${bi('Learn the whole syllabus once', 'পুরো সিলেবাস একবার শেখা')}</span></div>
      <div class="phase p2"><b>${bi('Phase 2 · Year 2', 'Phase 2 · ২য় বছর')}</b><span>${bi('Revise, PYQs, mocks, speed', 'রিভিশন, PYQ, মক, গতি')}</span></div>
    </div>
    <div class="hint mt">${bi('Start date:', 'শুরুর তারিখ:')} ${esc(startD.toDateString())} · ${bi('Day 730:', 'Day 730:')} ${esc(keyForDay(p.startDate, 730))}</div>
  </div>`;
}

/* ---------------------------------------------------------------- step 3 */
function step3(state) {
  const p = state.profile;
  const wakeOpts = timeOptions(4, 9, 15);
  const sleepOpts = timeOptions(20, 25, 15).map((m) => m % 1440);
  return `<div>
    <div class="ob-title">${bi('Your daily routine', 'তোমার দৈনন্দিন রুটিন')}</div>
    <p class="ob-sub mt">${bi('The morning ritual is shown in grey on your timeline and is NOT counted as study time.',
      'সকালের রুটিন টাইমলাইনে ধূসরে দেখাবে এবং পড়ার সময়ে গোনা হবে না।')}</p>
  </div>
  <div class="card">
    <div class="field">
      <label for="ob-wake">${bi('Wake-up time', 'ঘুম থেকে ওঠার সময়')}</label>
      <select class="select" id="ob-wake" data-change="ob.wake">${optionList(wakeOpts, Number(p.wake.split(':')[0]) * 60 + Number(p.wake.split(':')[1]))}</select>
    </div>
    <div class="hr"></div>
    <label class="row between"><span><b style="font-size:.85rem">${bi('Morning ritual block', 'সকালের রুটিন ব্লক')}</b>
      <div class="hint">${bi('Water, wash, light exercise — not study.', 'জল, ফ্রেশ হওয়া, হালকা ব্যায়াম — পড়া নয়।')}</div></span>
      <span class="switch"><input type="checkbox" data-change="ob.ritual" ${p.ritual.enabled ? 'checked' : ''}><i></i></span></label>
    ${p.ritual.enabled ? `<div class="row mt" style="gap:8px">
      <div class="field" style="flex:1"><label>${bi('From', 'শুরু')}</label>
        <select class="select" data-change="ob.ritualStart">${optionList(timeOptions(4, 9, 15), Number(p.ritual.start.split(':')[0]) * 60 + Number(p.ritual.start.split(':')[1]))}</select></div>
      <div class="field" style="flex:1"><label>${bi('To', 'শেষ')}</label>
        <select class="select" data-change="ob.ritualEnd">${optionList(timeOptions(4, 10, 15), Number(p.ritual.end.split(':')[0]) * 60 + Number(p.ritual.end.split(':')[1]))}</select></div>
    </div>` : ''}
    <div class="hr"></div>
    <div class="field">
      <label for="ob-sleep">${bi('Usual sleep time', 'সাধারণ ঘুমের সময়')}</label>
      <select class="select" id="ob-sleep" data-change="ob.sleep">${optionList(sleepOpts, Number(p.sleep.split(':')[0]) * 60 + Number(p.sleep.split(':')[1]))}</select>
      <span class="hint">${bi('For context only — the planner will not enforce it.', 'শুধু ধারণার জন্য — প্ল্যানার এটি বাধ্য করে না।')}</span>
    </div>
  </div>
  <div class="note-band">${icon('info', 15)} <span>${bi('At 05:00 wake-up, the first window at 05:30 leaves you 30 minutes for the ritual. Keep it that way: the earliest window should hold your hardest topic.',
    '০৫:০০-এ উঠলে ০৫:৩০-এর প্রথম উইন্ডোতে রুটিনের জন্য ৩০ মিনিট থাকে। এটাই ভালো: প্রথম উইন্ডোতে সবচেয়ে কঠিন টপিক রাখো।')}</span></div>`;
}

/* ---------------------------------------------------------------- step 4 */
function step4(state) {
  const day = getActiveDay();
  const total = totalWeeklyNet(state);
  const lowTime = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((d) => dayNetOf(state, d))) < MAX_NET;
  return `<div>
    <div class="ob-title">${bi('When will you study?', 'কখন পড়বে?')}</div>
    <p class="ob-sub mt">${bi('Pick 1–3 windows per day. Drag on the strip or type exact times. Gross time minus a 5-minute break per completed hour = net study time.',
      'প্রতিদিন ১–৩টি সময়সীমা বেছে নাও। স্ট্রিপে ড্র্যাগ করো বা সময় লেখো। মোট সময় থেকে প্রতি ঘণ্টায় ৫ মিনিট বিরতি বাদ দিলে নেট পড়ার সময়।')}</p>
  </div>
  <div class="card">
    ${windowsBlock(state, day, { showDayTabs: true })}
  </div>
  <div class="grid g2">
    <div class="stat"><div class="stat-v">${dayNetOf(state, day)}</div><div class="stat-k">${bi('net min · selected day', 'নেট মিনিট · নির্বাচিত দিন')}</div></div>
    <div class="stat"><div class="stat-v">${total}</div><div class="stat-k">${bi('net min · whole week', 'নেট মিনিট · সপ্তাহ')}</div></div>
  </div>
  ${lowTime ? `<div class="note-band">${icon('info', 15)} <span>${bi('Low-time mode is on: any day under 180 minutes will be compressed proportionally (Learn → Practice → Recall → Notes → Review → Log), and the missing minutes go to the Saturday backlog block.',
    'লো-টাইম মোড চালু: ১৮০ মিনিটের কম হলে দিনটি আনুপাতিকভাবে সংকুচিত হবে (Learn → Practice → Recall → Notes → Review → Log), বাকি মিনিট শনিবারের ব্যাকলগে যাবে।')}</span></div>` : ''}
  <div class="note-band">${icon('clock', 15)} <span>${bi('Hard cap: 180 net minutes per day. The app will not let you save more.',
    'কঠোর সীমা: দিনে ১৮০ নেট মিনিট। এর বেশি সেভ করতে দেবে না।')}</span></div>`;
}

/* ---------------------------------------------------------------- step 5 */
function step5(state) {
  const p = state.profile;
  const coaching = p.coaching;
  const total = totalWeeklyNet(state);
  return `<div>
    <div class="ob-title">${bi('Coaching & plan mode', 'কোচিং ও প্ল্যান মোড')}</div>
    <p class="ob-sub mt">${bi('If you attend a batch, tell the app what is being taught so self-study stays in sync.',
      'কোচিং করলে অ্যাপকে বলো কী পড়ানো হচ্ছে, যাতে সেলফ-স্টাডি মিলে থাকে।')}</p>
  </div>

  <div class="card">
    <label class="row between"><span><b style="font-size:.85rem">${bi('My coaching has started', 'আমার কোচিং শুরু হয়েছে')}</b>
      <div class="hint">${bi('Turn off to run the plan independently.', 'বন্ধ রাখলে প্ল্যান স্বাধীনভাবে চলবে।')}</div></span>
      <span class="switch"><input type="checkbox" data-change="ob.coaching" ${coaching.started ? 'checked' : ''}><i></i></span></label>

    ${coaching.started ? `<div class="hr"></div>
      <div class="col" style="gap:7px">
        ${coaching.slots.length ? coaching.slots.map((s, i) => coachingSlotRow(state, s, i)).join('') : `<div class="hint">${bi('No classes added yet.', 'এখনও কোনো ক্লাস যোগ করা হয়নি।')}</div>`}
      </div>
      <form class="col mt" data-form="ob.addslot" style="gap:8px">
        <div class="row wrap" style="gap:8px">
          <div class="field" style="flex:1;min-width:110px"><label>${bi('Day', 'দিন')}</label>
            <select class="select" name="day">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
          <div class="field" style="flex:1;min-width:100px"><label>${bi('Start', 'শুরু')}</label><input class="input" type="time" name="start" value="18:00"></div>
          <div class="field" style="flex:1;min-width:100px"><label>${bi('End', 'শেষ')}</label><input class="input" type="time" name="end" value="20:00"></div>
        </div>
        <div class="field"><label>${bi('Paper, unit and cluster being covered', 'যে পত্র, ইউনিট ও ক্লাস্টার চলছে')}</label>
          <select class="select" name="cluster">${state.syllabus.map((pp) => pp.units.map((u) =>
            `<optgroup label="${esc(pp.short.en)} · U${u.n} ${esc(u.name.en)}">${u.clusters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('')).join('')}</select>
          <span class="hint">${bi('You can change this later in Settings.', 'পরে Settings-এ বদলাতে পারবে।')}</span></div>
        <button class="btn btn-sm btn-soft" type="submit">${icon('plus', 15)} ${bi('Add class', 'ক্লাস যোগ করো')}</button>
      </form>` : `<div class="hint mt">${bi('No coaching yet — the plan will run fully on self-study. You can add classes any time in Settings.', 'এখনও কোচিং নেই — প্ল্যান পুরোপুরি সেলফ-স্টাডিতে চলবে। Settings থেকে যখন খুশি ক্লাস যোগ করতে পারবে।')}</div>`}
  </div>

  <div class="card">
    <div class="label mb">${bi('Plan mode', 'প্ল্যান মোড')}</div>
    <div class="col" style="gap:8px">
      ${[
        { id: 'parallel', en: 'Parallel (recommended)', bn: 'প্যারালেল (প্রস্তাবিত)', d: bi('Paper II 4 days/week + Paper I 1 day/week', 'পত্র II সপ্তাহে ৪ দিন + পত্র I ১ দিন') },
        { id: 'p1first', en: 'Paper I first', bn: 'আগে পত্র I', d: bi('Finish all of Paper I, then Paper II', 'আগে পুরো পত্র I, তারপর পত্র II') },
        { id: 'custom', en: 'Custom split', bn: 'কাস্টম স্প্লিট', d: bi('Choose which weekdays belong to which paper', 'কোন দিন কোন পত্র, নিজে বেছে নাও') }
      ].map((m) => `<label class="row top" style="gap:10px;padding:10px;border:1px solid ${p.planMode === m.id ? 'var(--brand)' : 'var(--line)'};border-radius:12px;background:${p.planMode === m.id ? 'var(--brand-soft)' : 'var(--surface-2)'};cursor:pointer">
        <input type="radio" name="planmode" value="${m.id}" data-change="ob.planmode" ${p.planMode === m.id ? 'checked' : ''} style="margin-top:3px;accent-color:var(--brand)">
        <span><b style="font-size:.83rem">${bi(m.en, m.bn)}</b><div class="hint">${m.d}</div></span>
      </label>`).join('')}
    </div>
    ${p.planMode === 'custom' ? `<div class="row wrap mt" style="gap:5px">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
        const on = (p.customSplit.p1 || []).includes(i);
        return `<button class="chip ${on ? 'on' : ''}" data-act="ob.custday" data-day="${i}">${d} · ${on ? 'P1' : 'P2'}</button>`;
      }).join('')}
    </div>` : ''}
  </div>

  <div class="card">
    <div class="card-h"><span class="card-title">${bi('Rest tokens', 'বিশ্রাম টোকেন')}</span><span class="pill gold">2 / ${bi('month', 'মাস')}</span></div>
    <p class="small muted">${bi('Use a rest token to skip a day guilt-free. The plan shifts forward by one day. Unused tokens do not carry over.',
      'একদিন গিল্ট ছাড়াই বাদ দিতে বিশ্রাম টোকেন ব্যবহার করো। প্ল্যান একদিন এগিয়ে যাবে। অব্যবহৃত টোকেন পরের মাসে যায় না।')}</p>
  </div>

  <div class="card">
    <div class="card-h"><span class="card-title">${bi('Your plan at a glance', 'এক নজরে প্ল্যান')}</span></div>
    <div class="kv"><span>${bi('New-topic sessions', 'নতুন টপিক সেশন')}</span><b>${state.syllabus[0].units.reduce((s, u) => s + u.clusters.reduce((a, c) => a + c.sessions, 0), 0)} + ${state.syllabus[1].units.reduce((s, u) => s + u.clusters.reduce((a, c) => a + c.sessions, 0), 0)} = 209</b></div>
    <div class="kv"><span>${bi('Daily net study time', 'দৈনিক নেট পড়ার সময়')}</span><b>${Math.round(total / 7)} min</b></div>
    <div class="kv"><span>${bi('Weekly pattern', 'সাপ্তাহিক প্যাটার্ন')}</span><b>${bi('Mon/Tue/Thu/Fri P-II · Wed P-I · Sat PYQ · Sun test', 'সোম/মঙ্গল/বৃহঃ/শুক্র P-II · বুধ P-I · শনি PYQ · রবি টেস্ট')}</b></div>
    <div class="kv"><span>${bi('Expected first pass', 'প্রথম পাস প্রত্যাশিত')}</span><b>${bi('around week 42–44', 'প্রায় সপ্তাহ ৪২–৪৪')}</b></div>
    <div class="note-band mt">${icon('info', 15)} <span>${bi('First pass = studied once. Mastery comes in Phase 2.', 'প্রথম পাস = একবার পড়া। দক্ষতা আসে Phase 2-এ।')}</span></div>
  </div>`;
}

/* --------------------------------------------------------------- helpers */
function addSlot(state, data) {
  const cid = data.cluster;
  const f = (() => {
    for (const p of state.syllabus) for (const u of p.units) {
      const c = u.clusters.find((x) => x.id === cid);
      if (c) return { paper: p, unit: u, cluster: c };
    }
    return null;
  })();
  if (!f) return;
  state.profile.coaching.slots.push({
    day: Number(data.day), start: data.start || '18:00', end: data.end || '20:00',
    paperId: f.paper.id, unitId: f.unit.id, clusterId: f.cluster.id
  });
}

register('ob.lang', ({ data }) => {
  R.state.profile.lang = data.lang;
  R.save(true); R.refresh(); R.refreshSheet && R.refreshSheet();
});
register('ob.next', () => {
  const err = validateStep(R.state, ob.step);
  if (err) { R.toast(err, 'bad'); return; }
  ob.step = Math.min(5, ob.step + 1);
  R.refresh();
});
register('ob.prev', () => { ob.step = Math.max(1, ob.step - 1); R.refresh(); });
register('ob.delslot', ({ data }) => {
  R.state.profile.coaching.slots.splice(Number(data.idx), 1);
  R.save(); R.refresh();
});
register('ob.custday', ({ data }) => {
  const day = Number(data.day);
  const split = R.state.profile.customSplit;
  split.p1 = split.p1 || [];
  split.p2 = split.p2 || [];
  if (split.p1.includes(day)) { split.p1 = split.p1.filter((d) => d !== day); if (!split.p2.includes(day)) split.p2.push(day); }
  else { split.p2 = split.p2.filter((d) => d !== day); split.p1.push(day); }
  R.save(); R.refresh();
});
register('ob.finish', () => {
  const err = validateStep(R.state, 4) || validateStep(R.state, 2);
  if (err) { R.toast(err, 'bad'); return; }
  R.state.onboardingComplete = true;
  R.state.profile.lang = R.state.profile.lang || 'en';
  R.save(true);
  R.ensurePlan({ force: true });
  R.go('today');
  R.refresh();
  R.toast(bi('Your 730-day plan is ready. Day 1 is orientation.', 'তোমার ৭৩০ দিনের প্ল্যান তৈরি। Day 1 ওরিয়েন্টেশন।'), 'ok');
});

import { registerForm } from './actions.js';
registerForm('ob.addslot', ({ data }) => {
  if (!data.cluster) return;
  addSlot(R.state, data);
  // reset the month/year selects for paper (unit list is static P2 default)
  R.save(); R.refresh();
});

function validateStep(state, step) {
  if (step === 1) {
    if (!state.profile.lang) return bi('Please choose a language.', 'একটি ভাষা বেছে নাও।');
    return null;
  }
  if (step === 2) {
    if (!state.profile.startDate) return bi('Please choose a start date.', 'শুরুর তারিখ বেছে নাও।');
    return null;
  }
  if (step === 3) {
    if (!state.profile.wake) return bi('Please choose a wake-up time.', 'ঘুম থেকে ওঠার সময় বেছে নাও।');
    return null;
  }
  if (step === 4) {
    for (let d = 0; d < 7; d++) {
      const list = windowsOf(state, d);
      if (!list.length) {
        const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return bi(`No study window on ${names[d]}. Add one or copy another day.`, `${names[d]}-এ কোনো স্টাডি উইন্ডো নেই। একটি যোগ করো বা অন্য দিন কপি করো।`);
      }
      if (netOfGross(grossOf(list)) > MAX_NET) {
        const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return bi(`${names[d]} is over 180 net minutes. Please reduce.`, `${names[d]}-এ ১৮০ নেট মিনিটের বেশি হয়েছে। কমাও।`);
      }
    }
    return null;
  }
  return null;
}

export function after(state, App, opts = {}) {
  mountWindows(document.getElementById('app'));
  const lang = state.profile.lang;
  if (ob.step === 1 && !state.profile.name) {
    // no autofocus on mobile keyboards — keeps the layout calm
  }
}

/* live inputs */
import { onInput } from './actions.js';
onInput('ob.name', ({ value }) => {
  R.state.profile.name = value;
  R.save();
});

/* change handlers */
import { register as reg2 } from './actions.js';
function onChange(name, fn) { reg2(name, (ctx) => { fn(ctx); R.save(); R.refresh(); }); }
onChange('ob.start', ({ value }) => { R.state.profile.startDate = value || todayKey(); });
onChange('ob.targetMonth', ({ value }) => { R.state.profile.targetExam.month = Number(value); });
onChange('ob.targetYear', ({ value }) => { R.state.profile.targetExam.year = Number(value); });
onChange('ob.wake', ({ value }) => { R.state.profile.wake = hhmm(value); });
onChange('ob.ritual', ({ el }) => { R.state.profile.ritual.enabled = el.checked; });
onChange('ob.ritualStart', ({ value }) => { R.state.profile.ritual.start = hhmm(value); });
onChange('ob.ritualEnd', ({ value }) => { R.state.profile.ritual.end = hhmm(value); });
onChange('ob.sleep', ({ value }) => { R.state.profile.sleep = hhmm(value); });
onChange('ob.coaching', ({ el }) => { R.state.profile.coaching.started = el.checked; });
onChange('ob.planmode', ({ el, value }) => { if (el.checked) R.state.profile.planMode = value; });

function hhmm(mins) {
  const m = ((Number(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
