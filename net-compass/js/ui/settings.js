/* Settings — everything is editable, nothing is hidden. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, esc, icon, progressBar, fmtBytes, EXAM_PATTERN_WARNING, L } from './dom.js';
import { windowsBlock, mountWindows, getActiveDay, setActiveDay, dayNetOf } from './windows.js';
import {
  todayKey, addDays, weekday, parseKey, monthKey, monthLabel, dayNumber, dayNet,
  buildTimeline, getDay, TEMPLATES, DAY_TYPE_LABEL, sessionById, markClusterSessionDone,
  rebuildPlan, logMcq, scheduleRevisions
} from '../engine.js';
import {
  exportJSON, exportFilename, downloadFile, validateImport, storageBytes, storagePct,
  restTokensLeft, restTokensUsedThisMonth, STORAGE_LIMIT, targetExamDate, daysToExam
} from '../store.js';
import { OFFICIAL_LINKS, badgeHTML } from './links.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function section(title, body, sub = '') {
  return `<div class="card mt">
    <div class="card-h"><span class="card-title">${title}</span>${sub ? `<span class="hint">${sub}</span>` : ''}</div>
    ${body}</div>`;
}

export function render(state) {
  const p = state.profile;
  const bytes = storageBytes(state);
  const pct = storagePct(state);
  const tokens = restTokensLeft(state);
  const month = monthKey(todayKey());
  const restThisMonth = (state.restDays || []).filter((k) => monthKey(k) === month);
  const pat = p.examPattern;
  const day = getActiveDay();

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Settings', 'সেটিংস')}</div>
      <div class="page-sub">${bi('Changes save instantly', 'পরিবর্তন সঙ্গে সঙ্গে সেভ হয়')}</div></div>
  </div>

  ${section(bi('Profile', 'প্রোফাইল'), `
    <div class="field"><label>${bi('Name', 'নাম')}</label>
      <input class="input" data-input="set.name" value="${esc(p.name)}" maxlength="40" placeholder="${bi('Your name', 'তোমার নাম')}"></div>
    <div class="grid g2 mt">
      <div class="field"><label>${bi('Language', 'ভাষা')}</label>
        <select class="select" data-change="set.lang">
          <option value="en" ${p.lang === 'en' ? 'selected' : ''}>English</option>
          <option value="bn" ${p.lang === 'bn' ? 'selected' : ''}>বাংলা</option>
        </select></div>
      <div class="field"><label>${bi('Time format', 'সময়ের ফরম্যাট')}</label>
        <select class="select" data-change="set.fmt">
          <option value="12" ${p.timeFormat === '12' ? 'selected' : ''}>12-hour (5:30 AM)</option>
          <option value="24" ${p.timeFormat === '24' ? 'selected' : ''}>24-hour (05:30)</option>
        </select></div>
      <div class="field"><label>${bi('Theme', 'থিম')}</label>
        <select class="select" data-change="set.theme">
          <option value="auto" ${p.theme === 'auto' ? 'selected' : ''}>${bi('Auto (system)', 'অটো (সিস্টেম)')}</option>
          <option value="light" ${p.theme === 'light' ? 'selected' : ''}>${bi('Light', 'লাইট')}</option>
          <option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>${bi('Dark', 'ডার্ক')}</option>
        </select></div>
      <div class="field"><label>${bi('Font size', 'ফন্ট সাইজ')}</label>
        <select class="select" data-change="set.size">
          <option value="small" ${p.fontSize === 'small' ? 'selected' : ''}>${bi('Small', 'ছোট')}</option>
          <option value="medium" ${p.fontSize === 'medium' ? 'selected' : ''}>${bi('Medium', 'মাঝারি')}</option>
          <option value="large" ${p.fontSize === 'large' ? 'selected' : ''}>${bi('Large', 'বড়')}</option>
        </select></div>
    </div>`)}

  ${section(bi('Study windows', 'স্টাডি উইন্ডো'), `
    ${windowsBlock(state, day, { showDayTabs: true })}
    <div class="hint mt">${bi('Net = gross − 5 min break per completed hour. Maximum 180 net minutes.', 'নেট = মোট − প্রতি পূর্ণ ঘণ্টায় ৫ মিনিট বিরতি। সর্বোচ্চ ১৮০ নেট মিনিট।')}</div>
    <button class="btn btn-sm mt" data-act="set.regen">${icon('refresh', 15)} ${bi('Re-generate plan with these windows', 'এই উইন্ডো দিয়ে প্ল্যান আবার তৈরি')}</button>`)}

  ${section(bi('Dates', 'তারিখ'), `
    <div class="grid g2">
      <div class="field"><label>${bi('Start date (Day 1)', 'শুরুর তারিখ (Day 1)')}</label>
        <input class="input" type="date" data-change="set.start" value="${esc(p.startDate)}"></div>
      <div class="field"><label>${bi('Target exam', 'টার্গেট পরীক্ষা')}</label>
        <div class="row" style="gap:6px">
          <select class="select" data-change="set.exmonth">${MONTHS.map((m, i) => `<option value="${i + 1}" ${Number(p.targetExam.month) === i + 1 ? 'selected' : ''}>${bi(m, MONTHS_BN[i])}</option>`).join('')}</select>
          <select class="select" data-change="set.exyear">${[0, 1, 2, 3].map((i) => new Date().getFullYear() + i).map((y) => `<option value="${y}" ${Number(p.targetExam.year) === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div></div>
    </div>
    <div class="kv mt"><span>${bi('Today is Day', 'আজ Day')}</span><b>${dayNumber(p.startDate, todayKey())} / 730</b></div>
    <div class="kv"><span>${bi('Days to target exam', 'টার্গেট পরীক্ষা পর্যন্ত')}</span><b>${Math.max(0, daysToExam(state))} (${esc(targetExamDate(state))})</b></div>
    <div class="hint mt">${bi('Changing the start date re-flows the whole plan. Completed sessions stay in your record.', 'শুরুর তারিখ বদলালে পুরো প্ল্যান আবার সাজবে। শেষ করা সেশন রেকর্ডে থাকবে।')}</div>`)}

  ${section(bi('Plan mode', 'প্ল্যান মোড'), `
    <div class="col" style="gap:7px">
      ${[
        { id: 'parallel', en: 'Parallel (recommended)', bn: 'প্যারালেল (প্রস্তাবিত)', d: bi('Paper II 4 days/week, Paper I 1 day/week', 'পত্র II সপ্তাহে ৪ দিন, পত্র I ১ দিন') },
        { id: 'p1first', en: 'Paper I first', bn: 'আগে পত্র I', d: bi('All of Paper I, then Paper II', 'আগে পুরো পত্র I, তারপর পত্র II') },
        { id: 'custom', en: 'Custom split', bn: 'কাস্টম স্প্লিট', d: bi('Pick weekdays per paper', 'কোন দিন কোন পত্র') }
      ].map((m) => `<label class="row top" style="gap:9px;padding:9px;border:1px solid ${p.planMode === m.id ? 'var(--brand)' : 'var(--line)'};border-radius:11px;background:${p.planMode === m.id ? 'var(--brand-soft)' : 'var(--surface-2)'}">
        <input type="radio" name="pm" data-change="set.planmode" value="${m.id}" ${p.planMode === m.id ? 'checked' : ''} style="margin-top:3px;accent-color:var(--brand)">
        <span><b style="font-size:.82rem">${bi(m.en, m.bn)}</b><div class="hint">${m.d}</div></span></label>`).join('')}
    </div>
    ${p.planMode === 'custom' ? `<div class="row wrap mt" style="gap:5px">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
        const on = (p.customSplit.p1 || []).includes(i);
        return `<button class="chip ${on ? 'on' : ''}" data-act="set.custday" data-day="${i}">${d} · ${on ? 'P1' : 'P2'}</button>`;
      }).join('')}
    </div>` : ''}
    <div class="row mt" style="gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm" data-act="set.regen">${icon('refresh', 15)} ${bi('Re-generate plan', 'প্ল্যান আবার তৈরি')}</button>
      <button class="btn btn-sm btn-ghost" data-act="nav.go" data-to="setup">${icon('settings', 15)} ${bi('Re-run setup wizard', 'সেটআপ উইজার্ড আবার')}</button>
    </div>`)}

  ${section(bi('Coaching schedule', 'কোচিং শিডিউল'), coachingEditor(state))}

  ${section(bi('Rest tokens', 'বিশ্রাম টোকেন'), `
    <div class="row between"><span class="small">${bi('Remaining this month', 'এই মাসে বাকি')}</span><b>${tokens} / 2</b></div>
    <div class="mt">${progressBar((tokens / 2) * 100, tokens ? 'ok' : 'bad')}</div>
    <div class="hint mt">${bi('Skip a day guilt-free; the plan shifts forward by one day. Unused tokens do not carry over.', 'একদিন গিল্ট ছাড়াই বাদ; প্ল্যান একদিন এগোবে। অব্যবহৃত টোকেন পরের মাসে যায় না।')}</div>
    ${restThisMonth.length ? `<div class="mt">${restThisMonth.map((k) => `<div class="kv"><span>${esc(k)}</span><button class="btn btn-xs btn-ghost" data-act="set.restundo" data-key="${esc(k)}">${bi('Undo', 'বাতিল')}</button></div>`).join('')}</div>` : ''}
    <button class="btn btn-sm mt" data-act="set.restuse" ${tokens <= 0 || state.restDays.includes(todayKey()) ? 'disabled' : ''}>${bi('Use a token today', 'আজ একটি টোকেন ব্যবহার')}</button>
    <button class="btn btn-sm btn-ghost mt" data-act="set.regen">${bi('Recalculate plan', 'প্ল্যান হিসাব করো')}</button>`)}

  ${section(bi('Exam pattern', 'পরীক্ষার প্যাটার্ন'), `
    <div class="note-band" style="background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 35%, transparent);color:var(--warn)">${icon('alert', 15)} <span>${EXAM_PATTERN_WARNING()}</span></div>
    <form class="mt" data-form="set.exam">
      <div class="label">${bi('Paper I', 'পত্র I')}</div>
      <div class="mini-grid mt">
        <div class="field"><label>${bi('Questions', 'প্রশ্ন')}</label><input class="input" type="number" name="p1q" value="${pat.p1.questions}"></div>
        <div class="field"><label>${bi('Marks', 'নম্বর')}</label><input class="input" type="number" name="p1m" value="${pat.p1.marks}"></div>
        <div class="field"><label>${bi('Minutes', 'মিনিট')}</label><input class="input" type="number" name="p1t" value="${pat.p1.minutes}"></div>
      </div>
      <div class="label mt">${bi('Paper II', 'পত্র II')}</div>
      <div class="mini-grid mt">
        <div class="field"><label>${bi('Questions', 'প্রশ্ন')}</label><input class="input" type="number" name="p2q" value="${pat.p2.questions}"></div>
        <div class="field"><label>${bi('Marks', 'নম্বর')}</label><input class="input" type="number" name="p2m" value="${pat.p2.marks}"></div>
        <div class="field"><label>${bi('Minutes', 'মিনিট')}</label><input class="input" type="number" name="p2t" value="${pat.p2.minutes}"></div>
      </div>
      <div class="grid g2 mt">
        <div class="field"><label>${bi('Negative marking', 'নেগেটিভ মার্কিং')}</label>
          <select class="select" name="negative">
            <option value="none" ${pat.negative === 'none' ? 'selected' : ''}>${bi('None', 'নেই')}</option>
            <option value="0.5" ${pat.negative === '0.5' ? 'selected' : ''}>-0.5</option>
            <option value="custom" ${pat.negative === 'custom' ? 'selected' : ''}>${bi('Custom', 'কাস্টম')}</option>
          </select></div>
        <div class="field"><label>${bi('Custom penalty', 'কাস্টম পেনাল্টি')}</label><input class="input" type="number" step="0.25" name="custom" value="${pat.customNegative || 0}"></div>
      </div>
      <div class="row between mt"><span class="hint">${bi('Total', 'মোট')}: ${pat.total.questions} Q · ${pat.total.marks} ${bi('marks', 'নম্বর')} · ${pat.total.minutes} min</span>
        <button class="btn btn-sm btn-primary" type="submit">${bi('Save pattern', 'প্যাটার্ন সেভ')}</button></div>
    </form>
    <div class="hint mt">${bi('Defaults come from the syllabus note (Paper I: 5 questions × 2 marks per unit) and general NTA guidelines. They are unverified.',
      'ডিফল্ট সিলেবাস নোট (পত্র I: প্রতি ইউনিটে ৫ প্রশ্ন × ২ নম্বর) ও সাধারণ NTA নির্দেশিকা থেকে। এগুলো অযাচাইকৃত।')}</div>`)}

  ${section(bi('Notifications & extras', 'নোটিফিকেশন ও অন্যান্য'), `
    ${switchRow('Study reminders', 'set.notify', p.notifications, bi('At each study-window start, while the app is open', 'অ্যাপ খোলা থাকলে প্রতিটি উইন্ডোর শুরুতে'))}
    ${switchRow('Timer sound', 'set.sounds', p.sounds, bi('Gentle chime when a block ends', 'ব্লক শেষে হালকা শব্দ'))}
    ${switchRow('Confetti on full completion', 'set.confetti', p.confetti, bi('A small celebration when the day is done', 'দিন শেষ হলে ছোট উদযাপন'))}
    ${switchRow('Daily quote', 'set.quotes', p.showQuotes, bi('One line on the Today screen', 'Today স্ক্রিনে একটি লাইন'))}
    <div class="hint mt">${bi('Notifications require browser permission and may not work on all devices.', 'নোটিফিকেশনে ব্রাউজার অনুমতি লাগে এবং সব ডিভাইসে কাজ নাও করতে পারে।')}</div>
    <button class="btn btn-sm mt" data-act="set.editquotes">${icon('pen', 14)} ${bi('Edit motivational lines', 'মোটিভেশনাল লাইন এডিট')}</button>`)}

  ${section(bi('Data', 'ডেটা'), `
    <div class="row between"><span class="small">${bi('Storage used', 'স্টোরেজ ব্যবহার')}</span><b>${fmtBytes(bytes)} / 5 MB</b></div>
    <div class="mt">${progressBar(pct, pct > 80 ? 'bad' : pct > 60 ? 'warn' : 'ok')}</div>
    <div class="hint mt">${bi(`Local data only. At 80% you will get a warning.`, 'শুধু লোকাল ডেটা। ৮০% হলে সতর্ক করা হবে।')}</div>
    <div class="row wrap mt" style="gap:8px">
      <button class="btn btn-sm btn-primary" data-act="set.export">${icon('download', 15)} ${bi('Export backup', 'ব্যাকআপ এক্সপোর্ট')}</button>
      <button class="btn btn-sm" data-act="set.import">${icon('upload', 15)} ${bi('Import backup', 'ব্যাকআপ ইমপোর্ট')}</button>
      <input type="file" accept=".json,application/json" data-change="set.file" id="backup-file" class="hide">
      <button class="btn btn-sm btn-ghost" data-act="set.printweek">${bi('Print this week', 'এই সপ্তাহ প্রিন্ট')}</button>
      <button class="btn btn-sm btn-danger" data-act="set.reset">${icon('trash', 15)} ${bi('Reset all data', 'সব ডেটা মুছো')}</button>
    </div>
    <div class="hr"></div>
    <div class="row between"><span class="small">${bi('Demo data', 'ডেমো ডেটা')}</span>
      <span class="pill ${state.demo ? 'warn' : 'line'}">${state.demo ? bi('on', 'চালু') : bi('off', 'বন্ধ')}</span></div>
    <div class="hint">${bi('Load sample progress to preview charts. Clear it before your real Day 1.', 'চার্ট দেখতে নমুনা অগ্রগতি লোড করো। আসল Day 1-এর আগে মুছে ফেলো।')}</div>
    <div class="row mt" style="gap:8px">
      <button class="btn btn-sm" data-act="set.demo" ${state.demo ? 'disabled' : ''}>${bi('Load demo progress', 'ডেমো অগ্রগতি লোড')}</button>
      <button class="btn btn-sm btn-ghost" data-act="set.demclear" ${state.demo ? '' : 'disabled'}>${bi('Clear demo data', 'ডেমো ডেটা মুছো')}</button>
    </div>`)}

  ${section(bi('About', 'সম্পর্কে'), `
    <div class="kv"><span>${bi('Version', 'সংস্করণ')}</span><b>${R.APP_VERSION || '1.0.0'}</b></div>
    <div class="kv"><span>${bi('Storage', 'স্টোরেজ')}</span><b>localStorage (this browser only)</b></div>
    <div class="kv"><span>${bi('Backend', 'ব্যাকএন্ড')}</span><b>${bi('none', 'নেই')}</b></div>
    <div class="mt">
      <div class="link-list">
        ${OFFICIAL_LINKS.slice(0, 2).map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
          <span class="ic">🌐</span><span class="lt"><b>${esc(l.title)}</b></span>${badgeHTML(l.badge)}${icon('external', 13)}</a>`).join('')}
      </div>
    </div>
    <p class="hint mt">${bi('Built for one student. Syllabus data is transcribed from the official UGC NET syllabus for Paper I (Code 00) and Paper II Computer Science & Applications (Code 87). Ambiguous lines are flagged ⚠. This app is not affiliated with NTA or UGC.',
      'একজন শিক্ষার্থীর জন্য তৈরি। সিলেবাস ডেটা অফিসিয়াল UGC NET সিলেবাস থেকে (পত্র I কোড 00, পত্র II কম্পিউটার সায়েন্স কোড 87)। অস্পষ্ট লাইন ⚠ দিয়ে চিহ্নিত। অ্যাপটি NTA বা UGC-এর সাথে যুক্ত নয়।')}</p>`)}

  <div class="tiny muted center mt-2">${bi('Made for the long game.', 'দীর্ঘ খেলার জন্য তৈরি।')}</div>`;
}

function switchRow(label, name, checked, hint = '') {
  return `<label class="row between" style="gap:14px;padding:7px 0">
    <span><b style="font-size:.82rem">${esc(label)}</b>${hint ? `<div class="hint">${esc(hint)}</div>` : ''}</span>
    <span class="switch"><input type="checkbox" data-change="${name}" ${checked ? 'checked' : ''}><i></i></span>
  </label>`;
}

function coachingEditor(state) {
  const c = state.profile.coaching;
  return `
    <label class="row between"><span><b style="font-size:.83rem">${bi('Coaching has started', 'কোচিং শুরু হয়েছে')}</b>
      <div class="hint">${bi('When on, class days use the coaching-overlap template and the plan follows the class topics.', 'চালু থাকলে ক্লাসের দিনে কোচিং টেমপ্লেট ও ক্লাসের টপিক অনুসরণ করে।')}</div></span>
      <span class="switch"><input type="checkbox" data-change="set.coaching" ${c.started ? 'checked' : ''}><i></i></span></label>
    ${c.started ? `${c.slots.length ? `<div class="col mt" style="gap:6px">${c.slots.map((s, i) => {
      let nm = '';
      state.syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((cl) => { if (cl.id === s.clusterId) nm = `${u.name.en} → ${cl.name}`; })));
      return `<div class="row between" style="gap:8px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)">
        <div style="min-width:0"><b style="font-size:.78rem">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day]} · ${esc(s.start)}–${esc(s.end)}</b>
          <div class="tiny muted">${esc(nm)}</div></div>
        <button class="icon-btn" data-act="set.delslot" data-idx="${i}" aria-label="${bi('Remove', 'সরাও')}">${icon('trash', 14)}</button>
      </div>`;
    }).join('')}</div>` : `<div class="hint mt">${bi('No classes yet.', 'এখনও ক্লাস নেই।')}</div>`}
    <form class="mt" data-form="set.addslot">
      <div class="row wrap" style="gap:6px">
        <select class="select" name="day" style="width:auto;padding:8px;font-size:.76rem">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select>
        <input class="input" type="time" name="start" value="18:00" style="width:auto;padding:8px;font-size:.76rem">
        <input class="input" type="time" name="end" value="20:00" style="width:auto;padding:8px;font-size:.76rem">
      </div>
      <select class="select mt" name="cluster">
        ${state.syllabus.map((p) => p.units.map((u) => `<optgroup label="${esc(p.short.en)} · U${u.n} ${esc(u.name.en)}">${u.clusters.map((cl) => `<option value="${cl.id}">${esc(cl.name)}</option>`).join('')}</optgroup>`).join('')).join('')}
      </select>
      <button class="btn btn-sm btn-soft mt" type="submit">${icon('plus', 14)} ${bi('Add class', 'ক্লাস যোগ')}</button>
    </form>` : ''}`;
}

/* -------------------------------------------------------------- actions */
onInput('set.name', ({ value }) => { R.state.profile.name = value; R.save(); });
register('set.lang', ({ value }) => { R.state.profile.lang = value; R.save(true); R.refresh(); });
register('set.theme', ({ value }) => { R.state.profile.theme = value; R.save(true); R.refresh(); });
register('set.size', ({ value }) => { R.state.profile.fontSize = value; R.save(true); R.refresh(); });
register('set.fmt', ({ value }) => { R.state.profile.timeFormat = value; R.save(true); R.refresh(); });
register('set.start', ({ value }) => {
  if (!value) return;
  R.state.profile.startDate = value;
  R.save();
  R.ensurePlan({ force: true });
  R.refresh();
  R.toast(bi('Start date updated. The plan was re-generated.', 'শুরুর তারিখ আপডেট। প্ল্যান আবার তৈরি হয়েছে।'), 'ok');
});
register('set.exmonth', ({ value }) => { R.state.profile.targetExam.month = Number(value); R.save(); R.refresh(); });
register('set.exyear', ({ value }) => { R.state.profile.targetExam.year = Number(value); R.save(); R.refresh(); });
register('set.planmode', ({ value, el }) => {
  if (el && el.type === 'radio' && !el.checked) return;
  R.state.profile.planMode = value;
  R.save();
  R.ensurePlan({ force: true });
  R.refresh();
});
register('set.custday', ({ data }) => {
  const p = R.state.profile;
  const d = Number(data.day);
  p.customSplit.p1 = p.customSplit.p1 || [];
  p.customSplit.p2 = p.customSplit.p2 || [];
  if (p.customSplit.p1.includes(d)) p.customSplit.p1 = p.customSplit.p1.filter((x) => x !== d);
  else { p.customSplit.p2 = p.customSplit.p2.filter((x) => x !== d); p.customSplit.p1.push(d); }
  R.save(); R.ensurePlan({ force: true }); R.refresh();
});
register('set.regen', () => {
  R.ensurePlan({ force: true });
  R.refresh();
  R.toast(bi('Plan re-generated from today. Finished days are preserved.', 'আজ থেকে প্ল্যান আবার তৈরি। শেষ হওয়া দিন অপরিবর্তিত।'), 'ok');
});
register('set.notify', ({ el }) => {
  const state = R.state;
  if (el.checked) {
    if (typeof Notification === 'undefined') {
      el.checked = false;
      R.toast(bi('This browser does not support notifications.', 'এই ব্রাউজার নোটিফিকেশন সমর্থন করে না।'), 'bad');
      return;
    }
    Notification.requestPermission().then((perm) => {
      state.profile.notifications = perm === 'granted';
      R.save(); R.refresh();
      if (perm !== 'granted') R.toast(bi('Permission denied — reminders are off.', 'অনুমতি দেওয়া হয়নি — রিমাইন্ডার বন্ধ।'), 'warn');
    });
  } else { state.profile.notifications = false; R.save(); R.refresh(); }
});
register('set.sounds', ({ el }) => { R.state.profile.sounds = el.checked; R.save(); });
register('set.confetti', ({ el }) => { R.state.profile.confetti = el.checked; R.save(); });
register('set.quotes', ({ el }) => { R.state.profile.showQuotes = el.checked; R.save(); R.refresh(); });
register('set.coaching', ({ el }) => { R.state.profile.coaching.started = el.checked; R.save(); R.refresh(); });
register('set.delslot', ({ data }) => { R.state.profile.coaching.slots.splice(Number(data.idx), 1); R.save(); R.refresh(); });
registerForm('set.addslot', ({ data }) => {
  if (!data.cluster) return;
  let found = null;
  R.state.syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((c) => { if (c.id === data.cluster) found = { p, u, c }; })));
  if (!found) return;
  R.state.profile.coaching.slots.push({
    day: Number(data.day), start: data.start || '18:00', end: data.end || '20:00',
    paperId: found.p.id, unitId: found.u.id, clusterId: found.c.id
  });
  R.save(); R.refresh();
  R.toast(bi('Class added. Overlapping days will use the coaching template.', 'ক্লাস যোগ হয়েছে। মিলে যাওয়া দিনে কোচিং টেমপ্লেট ব্যবহার হবে।'), 'ok');
});
register('set.restuse', () => {
  const state = R.state;
  const k = todayKey();
  if (restTokensLeft(state, k) <= 0 || state.restDays.includes(k)) return;
  state.restDays.push(k);
  R.save(); R.ensurePlan({ force: true }); R.refresh();
  R.toast(bi('Rest token used. The plan shifted one day.', 'বিশ্রাম টোকেন ব্যবহৃত। প্ল্যান একদিন এগিয়েছে।'), 'ok');
});
register('set.restundo', ({ data }) => {
  R.state.restDays = R.state.restDays.filter((k) => k !== data.key);
  R.save(); R.ensurePlan({ force: true }); R.refresh();
});
registerForm('set.exam', ({ data }) => {
  const state = R.state;
  const pat = state.profile.examPattern;
  pat.p1 = { questions: +data.p1q || 50, marks: +data.p1m || 100, minutes: +data.p1t || 60, marksPerQ: (+data.p1m || 100) / (+data.p1q || 50) };
  pat.p2 = { questions: +data.p2q || 100, marks: +data.p2m || 200, minutes: +data.p2t || 120, marksPerQ: (+data.p2m || 200) / (+data.p2q || 100) };
  pat.total = { questions: pat.p1.questions + pat.p2.questions, marks: pat.p1.marks + pat.p2.marks, minutes: pat.p1.minutes + pat.p2.minutes };
  pat.negative = data.negative || 'none';
  pat.customNegative = Number(data.custom) || 0;
  pat.verified = false;
  R.save(); R.refresh();
  R.toast(bi('Exam pattern saved (still unverified).', 'পরীক্ষার প্যাটার্ন সেভ হয়েছে (এখনও অযাচাইকৃত)।'), 'ok');
});
register('set.export', () => {
  downloadFile(exportFilename(), exportJSON(R.state));
  R.toast(bi('Backup downloaded. Keep it somewhere safe.', 'ব্যাকআপ ডাউনলোড হয়েছে। নিরাপদে রাখো।'), 'ok');
});
register('set.import', () => { document.getElementById('backup-file')?.click(); });
register('set.file', ({ el }) => {
  const f = el.files && el.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const res = validateImport(String(rd.result || ''));
    if (!res.ok) { R.toast(res.error, 'bad'); return; }
    R.openSheet({
      title: bi('Import backup', 'ব্যাকআপ ইমপোর্ট'),
      sub: bi('This replaces everything stored in this browser.', 'এটি এই ব্রাউজারের সব ডেটা বদলে দেবে।'),
      body: `<div class="note-band" style="background:var(--bad-soft);border-color:color-mix(in srgb,var(--bad) 30%, transparent);color:var(--bad)">
        ${icon('alert', 15)} <span>${bi('Export your current data first if you are not sure.', 'নিশ্চিত না হলে আগে বর্তমান ডেটা এক্সপোর্ট করো।')}</span></div>
        <div class="kv mt"><span>${bi('Backup exported at', 'ব্যাকআপ সময়')}</span><b>${esc(res.meta?.exportedAt || '—')}</b></div>
        <div class="kv"><span>${bi('Sessions in backup', 'ব্যাকআপে সেশন')}</span><b>${Object.keys(res.state.sessions || {}).length}</b></div>
        <div class="kv"><span>${bi('Schema', 'স্কিমা')}</span><b>${esc(res.meta?.schema || '—')}</b></div>
        ${res.warnings.length ? `<div class="hint mt">${res.warnings.map(esc).join('<br>')}</div>` : ''}
        <button class="btn btn-primary btn-block mt" data-act="set.importgo">${icon('check', 16)} ${bi('Replace my data with this backup', 'এই ব্যাকআপ দিয়ে ডেটা বদলাও')}</button>`,
      after: () => { R._pendingImport = res.state; }
    });
  };
  rd.readAsText(f);
});
register('set.importgo', () => {
  const st = R._pendingImport;
  if (!st) return;
  try {
    localStorage.setItem('netcompass.v1', JSON.stringify(st));
    location.reload();
  } catch (e) {
    R.toast(bi('Could not write the backup. Storage may be full.', 'ব্যাকআপ লেখা যায়নি। স্টোরেজ ভরে থাকতে পারে।'), 'bad');
  }
});
register('set.reset', () => {
  R.openSheet({
    title: bi('Delete all data', 'সব ডেটা মুছো'),
    sub: bi('This cannot be undone. Export a backup first.', 'এটি ফেরানো যাবে না। আগে ব্যাকআপ নাও।'),
    body: `<form data-form="set.resetgo">
      <div class="note-band" style="background:var(--bad-soft);border-color:color-mix(in srgb,var(--bad) 30%, transparent);color:var(--bad)">
        ${icon('alert', 15)} <span>${bi('All sessions, notes, flashcards, tests and settings will be deleted from this browser.', 'সব সেশন, নোট, ফ্ল্যাশকার্ড, টেস্ট ও সেটিংস এই ব্রাউজার থেকে মুছে যাবে।')}</span></div>
      <div class="field mt"><label>${bi('Type RESET to confirm', 'নিশ্চিত করতে RESET লেখো')}</label>
        <input class="input" name="confirm" autocomplete="off" placeholder="RESET"></div>
      <button class="btn btn-danger btn-block mt" type="submit">${icon('trash', 16)} ${bi('Delete everything', 'সব মুছে ফেলো')}</button>
      <button class="btn btn-ghost btn-block mt" type="button" data-act="sheet.close">${bi('Cancel', 'বাতিল')}</button>
    </form>`
  });
});
registerForm('set.resetgo', ({ data }) => {
  if (String(data.confirm || '').trim().toUpperCase() !== 'RESET') {
    R.toast(bi('Type RESET exactly to confirm.', 'নিশ্চিত করতে হুবহু RESET লেখো।'), 'bad');
    return;
  }
  try { localStorage.removeItem('netcompass.v1'); } catch (e) { /* noop */ }
  location.hash = '#/today';
  location.reload();
});
register('set.printweek', () => {
  const state = R.state;
  const today = todayKey();
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  R.openSheet({
    title: bi('This week’s plan', 'এই সপ্তাহের প্ল্যান'),
    sub: `${esc(days[0])} → ${esc(days[6])}`,
    body: `<div id="print-week">
      ${days.map((k) => {
        const d = getDay(state, k);
        if (!d) return '';
        const tl = buildTimeline(state, k);
        return `<div class="card tight mt" style="break-inside:avoid">
          <b>${esc(parseKey(k).toLocaleDateString(state.profile.lang === 'bn' ? 'bn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' }))}</b>
          <span class="pill line">${L(DAY_TYPE_LABEL[d.t] || { en: d.t, bn: d.t })}</span>
          <div class="tiny muted">${d.s?.length ? esc(sessionById(state, d.s[0])?.clusterName || '') : ''}</div>
          ${tl.rows.filter((r) => r.kind === 'act').map((r) => `<div class="kv"><span>${r.startStr} · ${L(r.act.title)}</span><b>${r.minutes}m</b></div>`).join('')}
        </div>`;
      }).join('')}
    </div>
    <button class="btn btn-primary btn-block mt" data-act="set.doprint">${icon('download', 16)} ${bi('Print / save as PDF', 'প্রিন্ট / PDF সেভ')}</button>`
  });
});
register('set.doprint', () => { setTimeout(() => window.print(), 120); });
register('set.demo', () => {
  loadDemo(R.state);
  R.save(); R.refresh();
  R.toast(bi('Demo progress loaded. Charts now have data.', 'ডেমো অগ্রগতি লোড হয়েছে। চার্টে ডেটা এসেছে।'), 'ok');
});
register('set.demclear', () => {
  clearDemo(R.state);
  R.save(); R.refresh();
  R.toast(bi('Demo data removed.', 'ডেমো ডেটা মুছে গেছে।'), 'ok');
});
register('set.editquotes', () => {
  const state = R.state;
  R.openSheet({
    title: bi('Motivational lines', 'মোটিভেশনাল লাইন'),
    sub: bi('Shown one per day on Today', 'প্রতিদিন Today-তে একটি দেখাবে'),
    body: `
      <form data-form="set.addquote" class="row" style="gap:6px">
        <input class="input" name="en" placeholder="${bi('English line', 'ইংরেজি লাইন')}" required>
        <input class="input" name="bn" placeholder="${bi('Bengali line', 'বাংলা লাইন')}" required>
        <button class="btn btn-sm btn-soft" type="submit">${icon('plus', 14)}</button>
      </form>
      ${(state.quotes || []).slice(0, 40).map((q, i) => `<div class="row between" style="gap:8px;padding:7px 0;border-bottom:1px solid var(--line-2)">
        <div style="min-width:0"><div class="small">${esc(q.en)}</div><div class="tiny muted">${esc(q.bn)}</div></div>
        <button class="icon-btn" data-act="set.delquote" data-idx="${i}" aria-label="${bi('Delete', 'মুছো')}">${icon('trash', 14)}</button>
      </div>`).join('')}`
  });
});
registerForm('set.addquote', ({ data }) => {
  if (!data.en || !data.bn) return;
  R.state.quotes.unshift({ en: data.en, bn: data.bn });
  R.save(); R.refreshSheet(); R.refresh();
});
register('set.delquote', ({ data }) => {
  R.state.quotes.splice(Number(data.idx), 1);
  R.save(); R.refreshSheet(); R.refresh();
});

/* ---------------------------------------------------------------- demo */
function loadDemo(state) {
  const today = todayKey();
  // keep a snapshot so "clear demo" restores real progress untouched
  state.demo = {
    snapshot: JSON.parse(JSON.stringify({
      sessions: state.sessions || {}, clusters: state.clusters || {},
      mcqTotals: state.mcqTotals || {}, revisions: state.revisions || []
    }))
  };
  const keys = [];
  for (let i = 14; i >= 0; i--) keys.push(addDays(today, -i));
  const demoSessions = [];
  const demoCards = [];
  const demoErrors = [];
  const demoTests = [];

  keys.forEach((k, i) => {
    if (i % 6 === 5) return; // a couple of missed days
    const d = getDay(state, k);
    if (!d) return;
    const tl = buildTimeline(state, k);
    state.actLog = state.actLog || {};
    state.actLog[k] = {};
    let count = 0;
    tl.rows.forEach((r) => {
      if (r.kind !== 'act') return;
      if (i % 4 === 3 && count > 2) return;
      state.actLog[k][r.actIndex] = { status: 'done', actualMin: r.minutes };
      count++;
    });
    (d.s || []).forEach((sid) => {
      const sess = sessionById(state, sid);
      if (!sess) return;
      state.sessions = state.sessions || {};
      state.sessions[sid] = { status: 'done', doneAt: k, checklist: { material: true, notes: true, cards: true, mcq: true, logged: true, selftest: true, confidence: true } };
      state.clusters = state.clusters || {};
      state.clusters[sess.clusterId] = {
        ...(state.clusters[sess.clusterId] || {}),
        status: 'done', confidence: 2 + ((i * 3) % 4), firstPassAt: k, lastReviewAt: k
      };
      demoSessions.push(sid);
      if (i % 2 === 0) {
        logMcq(state, sess.clusterId, 15, 6 + ((i * 5) % 9));
      }
      if (i % 3 === 0) {
        demoCards.push({
          id: `demo-fc-${sid}`, front: `${sess.clusterName} — key term ${i % 5 + 1}`,
          back: 'Sample demo flashcard. Clear demo data when you start for real.',
          clusterId: sess.clusterId, box: 1 + (i % 4), createdAt: k, dueKey: addDays(k, 1), reviews: i % 3, demo: true
        });
      }
    });
  });
  demoTests.push({ id: 'demo-t1', date: addDays(today, -7), type: 'topic', paper: 'P2', name: 'Demo topic PYQ', units: ['P2U1'], attempted: 20, correct: 12, wrong: 8, unanswered: 0, time: 24, notes: 'Demo data.', demo: true });
  demoTests.push({ id: 'demo-t2', date: addDays(today, -3), type: 'sectional', paper: 'P2', name: 'Demo sectional', units: ['P2U3'], attempted: 40, correct: 27, wrong: 11, unanswered: 2, time: 55, notes: 'Demo data.', demo: true });
  demoTests.push({ id: 'demo-t3', date: addDays(today, -1), type: 'topic', paper: 'P1', name: 'Demo Paper I quiz', units: ['P1U1'], attempted: 10, correct: 7, wrong: 3, unanswered: 0, time: 9, notes: 'Demo data.', demo: true });
  demoErrors.push({
    id: 'demo-e1', date: addDays(today, -5), question: 'Sample: number of spanning trees in K4?', source: 'Demo',
    myAnswer: '8', correctAnswer: '16', errorType: 'concept', clusterId: 'P2U1C5',
    concept: 'Cayley’s formula n^(n−2)', status: 'new', demo: true
  });
  demoErrors.push({
    id: 'demo-e2', date: addDays(today, -2), question: 'Sample: complexity of binary search?', source: 'Demo',
    myAnswer: 'O(n)', correctAnswer: 'O(log n)', errorType: 'silly', clusterId: 'P2U7C2',
    concept: 'Binary search recurrence', status: 'reviewed', demo: true
  });

  state.tests = (state.tests || []).filter((t) => !t.demo).concat(demoTests);
  state.errors = (state.errors || []).filter((e) => !e.demo).concat(demoErrors);
  state.flashcards = (state.flashcards || []).filter((c) => !c.demo).concat(demoCards);
  state.demo = {
    ...state.demo,
    keys, tests: demoTests.map((t) => t.id), errors: demoErrors.map((e) => e.id),
    cards: demoCards.map((c) => c.id), on: true
  };
}

function clearDemo(state) {
  const d = state.demo;
  if (!d) return;
  (d.keys || []).forEach((k) => { delete (state.actLog || {})[k]; });
  if (d.snapshot) {
    state.sessions = d.snapshot.sessions || {};
    state.clusters = d.snapshot.clusters || {};
    state.mcqTotals = d.snapshot.mcqTotals || {};
    state.revisions = d.snapshot.revisions || [];
  }
  state.tests = (state.tests || []).filter((t) => !t.demo);
  state.errors = (state.errors || []).filter((e) => !e.demo);
  state.flashcards = (state.flashcards || []).filter((c) => !c.demo);
  state.demo = false;
}


/* mount the draggable window strip after this screen renders */
export function after() {
  mountWindows(document.getElementById('app'));
}
