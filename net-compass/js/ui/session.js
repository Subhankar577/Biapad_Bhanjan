/* Session card — the detailed sheet behind every timeline activity. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, L, esc, icon, progressBar, depthPill, verifyMark, statusPill } from './dom.js';
import {
  buildTimeline, sessionById, gateResults, applyGateDecision, markClusterSessionDone,
  dueRevisions, dueFlashcards, logMcq, todayKey, DEPTH_GUIDE, SKIP_LIST, getDay,
  addDays, scheduleRevisions, nextFlashDueDate, dayProgress
} from '../engine.js';
import { searchLinks, badgeHTML } from './links.js';
import { findCluster } from '../data/syllabus.js';

function noteOf(state, sid) {
  state.notes = state.notes || {};
  if (!state.notes[sid]) state.notes[sid] = { cue: '', body: '', summary: '', formula: '', updatedAt: null };
  return state.notes[sid];
}
function sessRec(state, sid) {
  state.sessions = state.sessions || {};
  if (!state.sessions[sid]) state.sessions[sid] = { status: 'planned', checklist: {}, mcq: {}, selftest: {} };
  const s = state.sessions[sid];
  s.checklist = s.checklist || {};
  s.mcq = s.mcq || {};
  s.selftest = s.selftest || {};
  return s;
}

const CHECK_ITEMS = [
  { id: 'material', en: 'Watched / read the learning material', bn: 'মেটেরিয়াল দেখা / পড়া হয়েছে' },
  { id: 'notes', en: 'Wrote one-page notes', bn: 'এক পাতার নোট লিখেছি' },
  { id: 'cards', en: 'Added 5 flashcards', bn: '৫টি ফ্ল্যাশকার্ড যোগ করেছি' },
  { id: 'mcq', en: 'Completed the MCQ target', bn: 'MCQ টার্গেট শেষ করেছি' },
  { id: 'logged', en: 'Logged MCQ results (attempted / correct / time)', bn: 'MCQ ফল লগ করেছি (attempted / correct / সময়)' },
  { id: 'selftest', en: 'Completed the self-test', bn: 'সেলফ-টেস্ট শেষ করেছি' },
  { id: 'confidence', en: 'Rated confidence (1–5)', bn: 'কনফিডেন্স রেট করেছি (১–৫)' }
];

export function openSessionSheet(state, R, key, actIndex) {
  const day = getDay(state, key);
  if (!day) { R.toast(bi('No plan for this day.', 'এই দিনের কোনো প্ল্যান নেই।'), 'bad'); return; }
  const tl = buildTimeline(state, key);
  const rows = tl.rows.filter((r) => r.kind === 'act' && r.actIndex === actIndex);
  if (!rows.length) return;
  const act = rows[0].act;
  const plannedMin = rows.reduce((s, r) => s + r.minutes, 0);
  const sid = (day.s || [])[0] || null;
  const sess = sid ? sessionById(state, sid) : null;
  const startStr = rows[0].startStr;
  const endStr = rows[rows.length - 1].endStr;

  R.openSheet({
    title: `${act.icon} ${L(act.title)}`,
    sub: `${startStr} – ${endStr} · ${plannedMin} ${bi('min', 'মিনিট')}${sess ? ` · ${esc(sess.clusterName)}` : ''}`,
    body: () => sessionBody(state, key, actIndex, act, sess, sid, plannedMin, day),
    after: () => {}
  });
}

function sessionBody(state, key, actIndex, act, sess, sid, plannedMin, day) {
  const log = ((state.actLog || {})[key] || {})[actIndex] || {};
  const status = log.status || 'planned';
  const rec = sess ? sessRec(state, sid) : null;
  const note = sess ? noteOf(state, sid) : null;
  const depth = sess ? DEPTH_GUIDE[sess.depth] || DEPTH_GUIDE.D2 : null;
  const mcqTarget = depth ? depth.mcq : 15;
  const isLast = sess && sess.n === sess.of;
  const gate = sess && isLast ? gateResults(state, sess) : null;
  const clusterPin = sess ? (state.pins || []).filter((p) => p.clusterId === sess.clusterId && !p.broken) : [];
  const cluster = sess ? findCluster(state.syllabus, sess.clusterId) : null;
  const links = sess ? searchLinks(cluster.cluster, cluster.paper, cluster.unit) : [];

  // checklist progress
  const checks = rec ? CHECK_ITEMS.filter((c) => rec.checklist[c.id]).length : 0;
  const checkPct = rec ? Math.round((checks / CHECK_ITEMS.length) * 100) : 0;

  return `
  ${sess ? `<div class="sess-hero">
    <div class="row between" style="align-items:flex-start">
      <div style="min-width:0">
        <div class="eyebrow">${esc(sess.paper === 'P1' ? 'Paper I · Code 00' : 'Paper II · Code 87')} · ${esc(sess.unitName.en)}</div>
        <div style="font-weight:800;font-size:1rem;margin-top:2px;line-height:1.3">${esc(sess.clusterName)}</div>
        <div class="small muted mt">${bi('Session', 'সেশন')} ${sess.n} ${bi('of', '/')} ${sess.of} · ${depthPill(sess.depth)} ${verifyMark(sess.verify)}</div>
      </div>
    </div>
    <div class="mt" style="font-size:.78rem;line-height:1.5"><b>${bi('Key terms:', 'কী টার্ম:')}</b> ${esc(sess.clusterTerms)}</div>
    ${sess.of > 1 ? `<div class="mt"><div class="hint">${bi('Progress inside this cluster', 'এই ক্লাস্টারের ভেতরের অগ্রগতি')} · ${sess.n}/${sess.of}</div>${progressBar(Math.round((sess.n / sess.of) * 100))}</div>` : ''}
  </div>` : `<div class="sess-hero"><b>${L(act.title)}</b><div class="small muted mt">${L(act.sub || { en: '', bn: '' })}</div></div>`}

  ${sess ? `<div class="card tight mt">
    <div class="label mb">${bi('What to study', 'কী পড়বে')}</div>
    <div class="kv"><span>${bi('Paper', 'পত্র')}</span><b>${esc(sess.paper === 'P1' ? 'Paper I · Code 00' : 'Paper II · Code 87')}</b></div>
    <div class="kv"><span>${bi('Unit', 'ইউনিট')}</span><b>U${sess.unitN} · ${esc(sess.unitName.en)}</b></div>
    <div class="kv"><span>${bi('Topic', 'টপিক')}</span><b>${esc(sess.clusterName)}</b></div>
    <div class="kv"><span>${bi('Session', 'সেশন')}</span><b>${sess.n} / ${sess.of}${sess.of > 1 && sess.n < sess.of ? ` · ${bi('next session continues this topic', 'পরের সেশনে এই টপিক চলবে')}` : ` · ${bi('this finishes the topic', 'এই টপিক এখানেই শেষ')}`}</b></div>
  </div>` : ''}

  ${act.steps ? `<div class="card tight mt"><div class="label mb">${bi('This block, step by step', 'এই ব্লক, ধাপে ধাপে')}</div>
    ${act.steps.map((st) => `<div class="kv"><span>${L(st.label)}</span><b>${st.mins} ${bi('min', 'মিনিট')}</b></div>`).join('')}</div>` : ''}

  <div class="card tight mt">
    <div class="label">${bi('How to do it', 'কীভাবে করবে')}</div>
    <p class="small" style="margin-top:4px;line-height:1.55">${L(act.detail || { en: '', bn: '' })}</p>
  </div>

  ${depth ? `<div class="card tight mt">
    <div class="row between"><span class="card-title">${L(depth.label)}</span><span class="pill brand">${mcqTarget} MCQs</span></div>
    <p class="small mt" style="line-height:1.55">${L(depth.guide)}</p>
    <div class="note-band mt"><span>⛔</span><span>${L(SKIP_LIST)}</span></div>
  </div>` : ''}

  ${sess ? `<div class="card tight mt">
    <div class="card-h"><span class="card-title">${bi('Where to learn', 'কোথায় শিখবে')}</span><span class="hint">${bi('free only', 'শুধু ফ্রি')}</span></div>
    <div class="link-list">
      ${links.map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
        <span class="ic">${l.ic}</span>
        <span class="lt"><b>${esc(l.title)}</b><span>${esc(l.note)}</span></span>
        ${badgeHTML(l.badge)}${icon('external', 14)}
      </a>`).join('')}
      ${clusterPin.map((p) => `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">
        <span class="ic">📌</span>
        <span class="lt"><b>${esc(p.title || p.url)}</b><span>${esc(p.type || 'link')}${p.note ? ' · ' + esc(p.note) : ''}</span></span>
        ${badgeHTML('pin', p.verified && p.verifiedAt)}${icon('external', 14)}
      </a>`).join('')}
    </div>
    <form class="mt" data-form="pin.add">
      <input type="hidden" name="clusterId" value="${esc(sess.clusterId)}">
      <div class="row" style="gap:6px">
        <input class="input" name="url" placeholder="${bi('Paste a free resource URL', 'ফ্রি রিসোর্সের লিংক পেস্ট করো')}" required>
        <button class="btn btn-sm btn-soft" type="submit">${icon('pin', 14)} ${bi('Pin', 'পিন')}</button>
      </div>
      <label class="chk mt tiny"><input type="checkbox" name="verified"> <span>${bi('I verified this link', 'আমি এই লিংক যাচাই করেছি')}</span></label>
    </form>
  </div>` : ''}

  ${sess ? `<div class="card tight mt">
    <div class="card-h"><span class="card-title">${bi('Cornell notes', 'কর্নেল নোট')}</span><span class="hint" data-note-saved>${note.updatedAt ? bi('saved', 'সেভ হয়েছে') : bi('auto-saves', 'অটো-সেভ')}</span></div>
    <div class="note-cornell">
      <textarea class="textarea" data-input="note.field" data-sid="${esc(sid)}" data-field="cue" placeholder="${bi('Cue words / questions', 'কিউ ওয়ার্ড / প্রশ্ন')}" style="min-height:110px">${esc(note.cue)}</textarea>
      <textarea class="textarea" data-input="note.field" data-sid="${esc(sid)}" data-field="body" placeholder="${bi('Detailed notes here\u2026', 'বিস্তারিত নোট এখানে…')}" style="min-height:150px">${esc(note.body)}</textarea>
      <textarea class="textarea wide" data-input="note.field" data-sid="${esc(sid)}" data-field="summary" placeholder="${bi('3-line summary', '৩ লাইনের সারসংক্ষেপ')}" style="min-height:64px">${esc(note.summary)}</textarea>
      <textarea class="textarea full2 formula-box" data-input="note.field" data-sid="${esc(sid)}" data-field="formula" placeholder="${bi('Formula / definition box', 'ফর্মুলা / ডেফিনিশন বক্স')}" style="min-height:60px">${esc(note.formula)}</textarea>
    </div>
    <form class="row mt" data-form="flash.add" style="gap:6px">
      <input type="hidden" name="clusterId" value="${esc(sess.clusterId)}">
      <input type="hidden" name="sid" value="${esc(sid)}">
      <input class="input" name="front" placeholder="${bi('Flashcard front', 'ফ্ল্যাশকার্ড সামনে')}" required>
      <input class="input" name="back" placeholder="${bi('Back', 'পেছনে')}" required>
      <button class="btn btn-sm btn-soft" type="submit" title="${bi('Add flashcard', 'ফ্ল্যাশকার্ড যোগ')}">${icon('plus', 15)}</button>
    </form>
  </div>` : ''}

  ${sess ? `<div class="card tight mt">
    <div class="card-h"><span class="card-title">${bi('Practice log', 'প্র্যাকটিস লগ')}</span><span class="pill ${rec.mcq.attempted ? 'ok' : 'line'}">${rec.mcq.attempted || 0} / ${mcqTarget}</span></div>
    <form data-form="mcq.log" class="mini-grid">
      <input type="hidden" name="clusterId" value="${esc(sess.clusterId)}">
      <input type="hidden" name="sid" value="${esc(sid)}">
      <div class="field"><label>${bi('Attempted', 'করেছি')}</label><input class="input" type="number" min="0" max="200" name="attempted" value="${rec.mcq.attempted || ''}" inputmode="numeric"></div>
      <div class="field"><label>${bi('Correct', 'সঠিক')}</label><input class="input" type="number" min="0" max="200" name="correct" value="${rec.mcq.correct || ''}" inputmode="numeric"></div>
      <div class="field"><label>${bi('Minutes', 'মিনিট')}</label><input class="input" type="number" min="0" max="600" name="time" value="${rec.mcq.time || ''}" inputmode="numeric"></div>
      <button class="btn btn-sm btn-primary" type="submit" style="grid-column:1/-1">${bi('Save practice result', 'প্র্যাকটিস ফল সেভ করো')}</button>
    </form>
    <div class="row between mt"><span class="small muted">${bi('Accuracy', 'অ্যাকুরেসি')}</span>
      <b>${rec.mcq.attempted ? Math.round((rec.mcq.correct / rec.mcq.attempted) * 100) : 0}%</b></div>
  </div>` : ''}

  ${sess ? `<div class="card tight mt">
    <div class="card-title">${bi('Self-test (no AI needed)', 'সেলফ-টেস্ট (AI ছাড়া)')}</div>
    <div class="col mt" style="gap:7px">
      <label class="chk"><input type="checkbox" data-change="selftest.toggle" data-sid="${esc(sid)}" data-k="explain" ${rec.selftest.explain ? 'checked' : ''}> <span>${bi('Explained it aloud for 3 minutes without notes.', 'নোট ছাড়া ৩ মিনিট জোরে ব্যাখ্যা করেছি।')}</span></label>
      <label class="chk"><input type="checkbox" data-change="selftest.toggle" data-sid="${esc(sid)}" data-k="terms" ${rec.selftest.terms ? 'checked' : ''}> <span>${bi('Listed 5 key terms and defined each in one sentence.', '৫টি কী টার্ম লিখে এক বাক্যে সংজ্ঞা দিয়েছি।')}</span></label>
      <label class="chk"><input type="checkbox" data-change="selftest.toggle" data-sid="${esc(sid)}" data-k="diagram" ${rec.selftest.diagram ? 'checked' : ''}> <span>${bi('Drew the main diagram / flowchart.', 'মূল ডায়াগ্রাম / ফ্লোচার্ট এঁকেছি।')}</span></label>
      <label class="chk"><input type="checkbox" data-change="selftest.toggle" data-sid="${esc(sid)}" data-k="trap" ${rec.selftest.trap ? 'checked' : ''}> <span>${bi('Wrote 1 likely exam trap or commonly confused concept.', '১টি সম্ভাব্য পরীক্ষার ফাঁদ লিখেছি।')}</span></label>
      <input class="input" data-input="selftest.missed" data-sid="${esc(sid)}" value="${esc(rec.selftest.missed || '')}" placeholder="${bi('What did you miss? (one line)', 'কী মিস করেছ? (এক লাইন)')}">
    </div>
  </div>` : ''}

  ${sess ? `<div class="card tight mt">
    <div class="card-h"><span class="card-title">${bi('Completion checklist', 'সম্পন্নতার চেকলিস্ট')}</span><b>${checkPct}%</b></div>
    ${progressBar(checkPct, checkPct === 100 ? 'ok' : '')}
    <div class="col mt" style="gap:6px">
      ${CHECK_ITEMS.map((c) => `<label class="chk ${rec.checklist[c.id] ? 'done' : ''}"><input type="checkbox" data-change="sess.chk" data-sid="${esc(sid)}" data-k="${c.id}" ${rec.checklist[c.id] ? 'checked' : ''}> <span>${bi(c.en, c.bn)}</span></label>`).join('')}
    </div>
    <div class="hr"></div>
    <div class="row between">
      <span class="label">${bi('Confidence', 'কনফিডেন্স')}</span>
      <div class="row" style="gap:4px">
        ${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${((state.clusters[sess.clusterId] || {}).confidence || 0) === n ? 'on' : ''}" data-act="sess.conf" data-cid="${esc(sess.clusterId)}" data-n="${n}" style="padding:4px 9px">${n}</button>`).join('')}
      </div>
    </div>
    <div class="hint mt">${bi('1 = lost, 3 = exam-ok, 5 = can teach it', '১ = কিছু মনে নেই, ৩ = পরীক্ষার জন্য ঠিক, ৫ = পড়াতে পারব')}</div>
  </div>` : ''}

  ${gate ? `<div class="card tight mt">
    <div class="card-title">${bi('Move-on gate', 'মুভ-অন গেট')}</div>
    <div class="hint mb">${bi('Decided automatically from your logged data.', 'তোমার লগ করা ডেটা থেকে স্বয়ংক্রিয়ভাবে নির্ধারিত।')}</div>
    <div class="gate">
      <span class="gate-ic ${gate.explain ? 'pass' : 'fail'}">${gate.explain ? '✓' : '✕'}</span>
      <div style="flex:1"><b style="font-size:.82rem">${bi('Self-explanation', 'নিজে ব্যাখ্যা')}</b>
        <div class="tiny muted">${bi('Explain it aloud for 3 minutes without notes.', 'নোট ছাড়া ৩ মিনিট জোরে ব্যাখ্যা করো।')}</div></div>
      <button class="btn btn-xs ${gate.explain ? 'btn-ok' : ''}" data-act="gate.explain" data-cid="${esc(sess.clusterId)}" data-v="${gate.explain ? '0' : '1'}">${gate.explain ? bi('Yes ✓', 'হ্যাঁ ✓') : bi('Not yet', 'এখনও না')}</button>
    </div>
    <div class="gate">
      <span class="gate-ic ${gate.mcqPass ? 'pass' : 'fail'}">${gate.mcqPass ? '✓' : '✕'}</span>
      <div style="flex:1"><b style="font-size:.82rem">${bi('MCQ accuracy ≥ 60%', 'MCQ অ্যাকুরেসি ≥ ৬০%')}</b>
        <div class="tiny muted">${bi('With at least 10 questions attempted.', 'অন্তত ১০টি প্রশ্ন করতে হবে।')} · ${gate.accuracy}% / ${gate.attempted} Q</div></div>
    </div>
    <div class="gate">
      <span class="gate-ic ${gate.confPass ? 'pass' : 'fail'}">${gate.confPass ? '✓' : '✕'}</span>
      <div style="flex:1"><b style="font-size:.82rem">${bi('Confidence ≥ 3', 'কনফিডেন্স ≥ ৩')}</b>
        <div class="tiny muted">${bi('Current:', 'এখন:')} ${gate.confidence}/5</div></div>
    </div>
    <button class="btn btn-primary btn-block mt" data-act="gate.apply" data-cid="${esc(sess.clusterId)}" data-sid="${esc(sid)}">${bi('Apply gate decision', 'গেটের সিদ্ধান্ত প্রয়োগ করো')} (${gate.passed}/3)</button>
  </div>` : ''}

  <div class="sess-timer">
    ${R.timerRunning() && state.timer && state.timer.key === key && state.timer.actIndex === actIndex
      ? `<span class="timer-big" data-timer-display>${R.timerLabel()}</span>
         <button class="btn btn-sm" data-act="sess.timer.pause">${icon('pause', 15)} ${bi('Pause', 'বিরতি')}</button>
         <button class="btn btn-sm btn-primary" data-act="sess.timer.stop" data-key="${esc(key)}" data-idx="${actIndex}">${icon('check', 15)} ${bi('Done', 'শেষ')}</button>`
      : state.timer && state.timer.key === key && state.timer.actIndex === actIndex
      ? `<span class="timer-big">${R.timerLabel()}</span>
         <button class="btn btn-sm btn-primary" data-act="sess.timer.start" data-key="${esc(key)}" data-idx="${actIndex}">${icon('play', 15)} ${bi('Resume', 'আবার শুরু')}</button>
         <button class="btn btn-sm" data-act="sess.timer.stop" data-key="${esc(key)}" data-idx="${actIndex}">${icon('check', 15)} ${bi('Done', 'শেষ')}</button>`
      : `<span class="timer-big">${plannedMin}:00</span>
         <button class="btn btn-sm btn-primary" data-act="sess.timer.start" data-key="${esc(key)}" data-idx="${actIndex}">${icon('play', 15)} ${bi('Start timer', 'টাইমার শুরু')}</button>`}
    <div class="spacer"></div>
    <button class="btn btn-sm ${status === 'done' ? 'btn-ok' : ''}" data-act="sess.act.done" data-key="${esc(key)}" data-idx="${actIndex}">${status === 'done' ? '✓ ' + bi('Done', 'সম্পন্ন') : bi('Mark done', 'সম্পন্ন মার্ক')}</button>
    <button class="btn btn-sm btn-ghost" data-act="sess.act.skip" data-key="${esc(key)}" data-idx="${actIndex}">${bi('Skip', 'বাদ')}</button>
  </div>
  ${sess && !isLast ? `<button class="btn btn-block mt" data-act="sess.complete" data-sid="${esc(sid)}" data-key="${esc(key)}" data-idx="${actIndex}">${bi('Finish this session and continue', 'সেশন শেষ করে এগিয়ে যাও')}</button>` : ''}
  ${gate ? `<button class="btn btn-block btn-soft mt" data-act="sess.complete" data-sid="${esc(sid)}" data-key="${esc(key)}" data-idx="${actIndex}">${bi('Log the day', 'দিনটি লগ করো')}</button>` : ''}
  <div class="tiny muted center mt">${bi('Planned for this block:', 'এই ব্লকের পরিকল্পনা:')} ${plannedMin} ${bi('min', 'মিনিট')} · ${esc(status)}</div>
  `;
}

/* ------------------------------------------------------------- actions */
register('sess.timer.start', ({ data }) => { R.timerStart(data.key, Number(data.idx)); R.refreshSheet(); });
register('sess.timer.pause', () => { R.timerPause(); R.refreshSheet(); });
register('sess.timer.stop', ({ data }) => {
  finishActivity(R.state, data.key, Number(data.idx));
});
register('sess.act.done', ({ data }) => {
  finishActivity(R.state, data.key, Number(data.idx));
});

/** Marks one block done: stops its timer, logs the minutes, then opens the next block. */
function finishActivity(state, key, idx) {
  const t = state.timer;
  let mins = 0;
  if (t && t.key === key && Number(t.actIndex) === idx) mins = R.timerStop(true) || 0;
  state.actLog = state.actLog || {};
  state.actLog[key] = state.actLog[key] || {};
  state.actLog[key][idx] = { ...(state.actLog[key][idx] || {}), status: 'done' };
  R.save();
  R.closeSheet();
  R.refresh();
  if (mins >= 1) R.toast(bi(`Logged ${mins} min.`, `${mins} মিনিট লগ হয়েছে।`), 'ok');
  checkDayComplete(state, key);

  // auto-advance to the next unfinished block on the same day
  const tl = buildTimeline(state, key);
  const log = (state.actLog || {})[key] || {};
  const next = tl.rows.find((r) => r.kind === 'act' && r.actIndex !== idx && r.part === 1
    && !['done', 'skipped'].includes((log[r.actIndex] || {}).status));
  if (next) setTimeout(() => openSessionSheet(state, R, key, next.actIndex), 260);
}
register('sess.act.skip', ({ data }) => {
  const state = R.state;
  state.actLog = state.actLog || {};
  state.actLog[data.key] = state.actLog[data.key] || {};
  state.actLog[data.key][Number(data.idx)] = { ...(state.actLog[data.key][Number(data.idx)] || {}), status: 'skipped' };
  R.save();
  R.closeSheet();
  R.refresh();
});
register('sess.chk', ({ data, el }) => {
  const state = R.state;
  const rec = sessRec(state, data.sid);
  rec.checklist[data.k] = el.checked;
  R.save();
  if (el.checked && data.k === 'confidence') {
    // no-op: confidence handled by chips
  }
  R.refreshSheet();
});
register('sess.conf', ({ data }) => {
  const state = R.state;
  state.clusters = state.clusters || {};
  const cl = state.clusters[data.cid] || { status: 'learning' };
  cl.confidence = Number(data.n);
  if (!cl.status || cl.status === 'not-started') cl.status = 'learning';
  state.clusters[data.cid] = cl;
  const sid = (getDay(state, todayKey())?.s || [])[0];
  if (sid) sessRec(state, sid).checklist.confidence = true;
  R.save();
  R.refreshSheet();
});
register('selftest.toggle', ({ data, el }) => {
  const state = R.state;
  const rec = sessRec(state, data.sid);
  rec.selftest[data.k] = el.checked;
  if (Object.keys(rec.selftest).filter((k) => rec.selftest[k] === true).length) rec.checklist.selftest = true;
  R.save();
});
register('selftest.missed', ({}) => {});
onInput('selftest.missed', ({ data, value }) => {
  const rec = sessRec(R.state, data.sid);
  rec.selftest.missed = value;
  R.save();
});
register('gate.explain', ({ data }) => {
  const state = R.state;
  state.clusters = state.clusters || {};
  const cl = state.clusters[data.cid] || { status: 'learning' };
  cl.gate = { ...(cl.gate || {}), explain: data.v === '1' };
  state.clusters[data.cid] = cl;
  // reflect in checklist
  const sid = (getDay(state, todayKey())?.s || [])[0];
  if (sid) {
    const rec = sessRec(state, sid);
    rec.selftest.explain = data.v === '1';
    if (data.v === '1') rec.checklist.selftest = true;
  }
  R.save();
  R.refreshSheet();
});
register('gate.apply', ({ data }) => {
  const state = R.state;
  const sess = sessionById(state, data.sid);
  const gate = gateResults(state, sess);
  const cl = applyGateDecision(state, sess, gate);
  R.save();
  R.refresh();
  const msg = gate.passed === 3
    ? bi('All three gates passed. Move on — revision is scheduled.', 'তিনটি গেটই পাস। এগিয়ে যাও — রিভিশন শিডিউল হয়েছে।')
    : gate.passed === 2
      ? bi('Okay to move on. Added to your Sunday revisit list.', 'এগোতে পারো। রবিবারের রিভিজিট লিস্টে যোগ হয়েছে।')
      : cl.status === 'needs-help'
        ? bi('This topic needs more attention. Added to your coaching doubt list.', 'এই টপিকটিতে আরও মন দিতে হবে। কোচিং ডাউট লিস্টে যোগ হয়েছে।')
        : bi('One buffer day scheduled for this cluster. You get one extra attempt.', 'এই ক্লাস্টারের জন্য একটি বাফার ডে বসানো হয়েছে। আরেকবার সুযোগ।');
  R.toast(msg, gate.passed >= 2 ? 'ok' : 'warn');
});
register('sess.complete', ({ data }) => {
  const state = R.state;
  const sess = sessionById(state, data.sid);
  if (!sess) return;
  markClusterSessionDone(state, sess);
  const rec = sessRec(state, data.sid);
  rec.checklist.material = true;
  if (data.key != null && data.idx != null) {
    state.actLog = state.actLog || {};
    state.actLog[data.key] = state.actLog[data.key] || {};
    const i = Number(data.idx);
    state.actLog[data.key][i] = { ...(state.actLog[data.key][i] || {}), status: 'done' };
  }
  R.save();
  R.closeSheet();
  R.refresh();
  R.toast(bi(`Session logged · ${sess.clusterName} ${sess.n}/${sess.of}`, `সেশন লগ হয়েছে · ${sess.clusterName} ${sess.n}/${sess.of}`), 'ok');
  checkDayComplete(state, todayKey());
});

/* forms */
registerForm('mcq.log', ({ data }) => {
  const state = R.state;
  const attempted = Number(data.attempted) || 0;
  const correct = Math.min(Number(data.correct) || 0, attempted);
  const sess = sessionById(state, data.sid);
  if (!sess) return;
  const rec = sessRec(state, data.sid);
  const prevA = rec.mcq.loggedAttempted || 0;
  const prevC = rec.mcq.loggedCorrect || 0;
  rec.mcq = { attempted: (rec.mcq.attempted || 0) + attempted, correct: (rec.mcq.correct || 0) + correct, time: (rec.mcq.time || 0) + (Number(data.time) || 0) };
  rec.mcq.loggedAttempted = prevA + attempted;
  rec.mcq.loggedCorrect = prevC + correct;
  rec.checklist.mcq = rec.mcq.attempted >= (DEPTH_GUIDE[sess.depth]?.mcq || 15);
  rec.checklist.logged = true;
  logMcq(state, sess.clusterId, attempted, correct);
  R.save();
  R.toast(bi('Practice logged.', 'প্র্যাকটিস লগ হয়েছে।'), 'ok');
  R.refreshSheet();
});

registerForm('flash.add', ({ data }) => {
  const state = R.state;
  if (!data.front || !data.back) return;
  state.flashcards = state.flashcards || [];
  state.flashcards.push({
    id: `fc-${Date.now().toString(36)}`,
    front: String(data.front).slice(0, 400),
    back: String(data.back).slice(0, 800),
    clusterId: data.clusterId || '',
    box: 1,
    createdAt: todayKey(),
    dueKey: nextFlashDueDate(1),
    reviews: 0
  });
  if (data.sid) {
    const rec = sessRec(state, data.sid);
    rec.checklist.cards = true;
  }
  R.save();
  R.toast(bi('Flashcard added to Box 1.', 'ফ্ল্যাশকার্ড Box 1-এ যোগ হয়েছে।'), 'ok');
  R.refreshSheet();
});

registerForm('pin.add', ({ data }) => {
  const state = R.state;
  let url = String(data.url || '').trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  state.pins = state.pins || [];
  state.pins.push({
    id: `pin-${Date.now().toString(36)}`,
    url, title: url.replace(/^https?:\/\//, '').slice(0, 60),
    type: 'link', clusterId: data.clusterId || '',
    verified: !!data.verified, verifiedAt: data.verified ? todayKey() : null,
    addedAt: todayKey()
  });
  R.save();
  R.toast(bi('Pinned. Unverified until you tick the box.', 'পিন হয়েছে। টিক না দেওয়া পর্যন্ত আনভেরিফায়েড।'), 'ok');
  R.refreshSheet();
});

onInput('note.field', ({ data, value }) => {
  const state = R.state;
  const note = noteOf(state, data.sid);
  note[data.field] = value;
  note.updatedAt = new Date().toISOString();
  R.save();
  const el = document.querySelector('[data-note-saved]');
  if (el) el.textContent = bi('saving…', 'সেভ হচ্ছে…');
  clearTimeout(onInput._t);
  onInput._t = setTimeout(() => {
    const e2 = document.querySelector('[data-note-saved]');
    if (e2) e2.textContent = bi('saved ✓', 'সেভ ✓');
  }, 400);
});

export function checkDayComplete(state, key) {
  const p = dayProgress(state, key);
  if (p.complete) {
    state.celebrated = state.celebrated || {};
    if (!state.celebrated[key]) {
      state.celebrated[key] = true;
      R.save();
      R.confetti();
      R.toast(bi('Day complete. Every planned minute logged.', 'দিন সম্পন্ন। প্রতিটি পরিকল্পিত মিনিট লগ হয়েছে।'), 'ok');
    }
  }
}
