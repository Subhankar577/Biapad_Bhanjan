/* Flashcards (Leitner) + Notes library. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, L, esc, icon, emptyState, progressBar } from './dom.js';
import {
  todayKey, addDays, dueFlashcards, reviewFlashcard, nextFlashDueDate, LEITNER_INTERVALS,
  getDay, sessionById, diffDays
} from '../engine.js';
import { uid, downloadFile, exportFilename } from '../store.js';

let tab = 'cards';
let study = null; // {queue:[ids], idx, revealed, correct, wrong}
let fBox = 'all';
let fSearch = '';
let nSearch = '';

function clusterName(state, cid) {
  let out = '';
  state.syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((c) => { if (c.id === cid) out = `${c.name} · U${u.n}`; })));
  return out;
}

export function render(state) {
  const cards = state.flashcards || [];
  const due = dueFlashcards(state);
  const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => (c.box || 1) === b).length);
  const notes = Object.entries(state.notes || {}).filter(([, n]) => (n.body || n.cue || n.summary || n.formula));

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Cards & notes', 'কার্ড ও নোট')}</div>
      <div class="page-sub">${bi('Active recall beats re-reading', 'পুনরায় পড়ার চেয়ে সক্রিয় রিকল ভালো')}</div></div>
    <button class="btn btn-sm" data-act="cards.export">${icon('download', 15)} ${bi('Export', 'এক্সপোর্ট')}</button>
  </div>

  <div class="seg full mb">
    <button class="${tab === 'cards' ? 'active' : ''}" data-act="cards.tab" data-t="cards">${bi('Flashcards', 'ফ্ল্যাশকার্ড')} · ${cards.length}</button>
    <button class="${tab === 'notes' ? 'active' : ''}" data-act="cards.tab" data-t="notes">${bi('Notes', 'নোট')} · ${notes.length}</button>
  </div>

  ${tab === 'cards' ? cardsTab(state, cards, due, boxes) : notesTab(state, notes)}`;
}

/* ------------------------------------------------------------- flashcards */
function cardsTab(state, cards, due, boxes) {
  if (study) return studyView(state);
  const filtered = cards.filter((c) => {
    if (fBox !== 'all' && String(c.box || 1) !== String(fBox)) return false;
    if (fSearch && !(`${c.front} ${c.back} ${c.clusterId}`).toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  });
  return `
  <div class="card">
    <div class="row between mb"><div class="card-title">${bi('Leitner boxes', 'লাইটনার বক্স')}</div>
      <span class="pill ${due.length ? 'warn' : 'ok'}">${due.length} ${bi('due today', 'আজ ডিউ')}</span></div>
    <div class="boxes">
      ${boxes.map((n, i) => `<div class="box"><b>${n}</b><span>Box ${i + 1}</span><div class="tiny muted">${LEITNER_INTERVALS[i]}d</div></div>`).join('')}
    </div>
    <div class="hint mt">${bi('Right answer moves a card up a box. Wrong answer sends it back to Box 1.', 'ঠিক হলে কার্ড এক বক্স উপরে যায়। ভুল হলে Box 1-এ ফেরে।')}</div>
    <button class="btn btn-primary btn-block mt" data-act="cards.study">
      ${icon('play', 16)} ${due.length
        ? `${bi('Study', 'পড়ো')} ${due.length} ${bi('due cards', 'ডিউ কার্ড')}`
        : cards.length ? bi(`Practice all ${cards.length} cards`, `সব ${cards.length}টি কার্ড প্র্যাকটিস`) : bi('Add a card to start', 'শুরু করতে কার্ড যোগ করো')}
    </button>
    ${!due.length && cards.length ? `<div class="hint mt center">${bi('Nothing is due today — this is a free practice round. Correct answers still move a card up a box.', 'আজ কিছু ডিউ নেই — এটি ফ্রি প্র্যাকটিস। সঠিক উত্তরেও কার্ড পরের বক্সে ওঠে।')}</div>` : ''}
  </div>

  <div class="card mt">
    <div class="card-title mb">${bi('Add a flashcard', 'ফ্ল্যাশকার্ড যোগ')}</div>
    <form data-form="flash.add">
      <div class="field"><label>${bi('Front', 'সামনে')}</label><input class="input" name="front" placeholder="${bi('Question / term', 'প্রশ্ন / টার্ম')}" required></div>
      <div class="field mt"><label>${bi('Back', 'পেছনে')}</label><textarea class="textarea" name="back" style="min-height:64px" placeholder="${bi('Answer in one or two lines', 'উত্তর এক-দুই লাইনে')}" required></textarea></div>
      <div class="field mt"><label>${bi('Topic (optional)', 'টপিক (ঐচ্ছিক)')}</label>
        <select class="select" name="clusterId">
          <option value="">—</option>
          ${state.syllabus.map((p) => p.units.map((u) => `<optgroup label="${esc(p.short.en)} · U${u.n}">${u.clusters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('')).join('')}
        </select></div>
      <button class="btn btn-soft btn-block mt" type="submit">${icon('plus', 15)} ${bi('Add card', 'কার্ড যোগ')}</button>
    </form>
  </div>

  <div class="card mt">
    <div class="row between mb"><span class="card-title">${bi('All cards', 'সব কার্ড')}</span>
      <div class="row" style="gap:5px">
        <select class="select" data-change="cards.box" style="width:auto;padding:6px 8px;font-size:.72rem">
          <option value="all">${bi('All boxes', 'সব বক্স')}</option>
          ${[1, 2, 3, 4, 5].map((b) => `<option value="${b}" ${String(fBox) === String(b) ? 'selected' : ''}>Box ${b}</option>`).join('')}
        </select>
        <input class="input" data-input="cards.search" value="${esc(fSearch)}" placeholder="${bi('Search', 'খোঁজো')}" style="width:110px;padding:6px 8px;font-size:.72rem">
      </div>
    </div>
    ${filtered.length === 0 ? `<div class="hint center" style="padding:14px">${cards.length ? bi('No card matches.', 'কোনো কার্ড মেলেনি।') : bi('No cards yet — add 5 after every learn session.', 'এখনও কার্ড নেই — প্রতিটি লার্ন সেশনের পর ৫টি যোগ করো।')}</div>`
      : filtered.slice(0, 60).map((c) => `<div class="row between" style="gap:8px;padding:8px 0;border-bottom:1px solid var(--line-2)">
        <div style="min-width:0">
          <b style="font-size:.8rem">${esc(c.front)}</b>
          <div class="tiny muted">${esc(c.back)}</div>
          <div class="tiny muted">${c.clusterId ? esc(clusterName(state, c.clusterId)) + ' · ' : ''}${bi('Box', 'বক্স')} ${c.box || 1} · ${bi('due', 'ডিউ')} ${esc(c.dueKey || '—')}</div>
        </div>
        <button class="icon-btn" data-act="cards.del" data-id="${esc(c.id)}" aria-label="${bi('Delete', 'মুছো')}">${icon('trash', 14)}</button>
      </div>`).join('')}
  </div>

  <div class="row mt" style="gap:8px;flex-wrap:wrap">
    <button class="btn btn-sm" data-act="cards.import">${icon('upload', 15)} ${bi('Import JSON', 'JSON ইমপোর্ট')}</button>
    <input type="file" accept=".json,application/json,.jsonl,.txt" data-change="cards.file" class="hide" id="card-file">
    <span class="hint">${bi('One JSON object per line, fields: front, back, clusterId.', 'প্রতি লাইনে একটি JSON, ফিল্ড: front, back, clusterId।')}</span>
  </div>`;
}

function studyView(state) {
  const c = (state.flashcards || []).find((x) => x.id === study.queue[study.idx]);
  if (!c) return `<div class="card center"><div style="font-weight:800">${bi('Deck finished!', 'ডেক শেষ!')}</div>
    <p class="small muted mt">${bi(`Right: ${study.correct} · Wrong: ${study.wrong}`, `ঠিক: ${study.correct} · ভুল: ${study.wrong}`)}</p>
    <button class="btn btn-primary mt" data-act="cards.study.end">${bi('Back to deck', 'ডেকে ফিরে যাও')}</button></div>`;
  return `
  <div class="row between mb">
    <span class="pill line">${study.idx + 1} / ${study.queue.length}</span>
    <span class="tiny muted">${bi('Box', 'বক্স')} ${c.box || 1} · ${esc(clusterName(state, c.clusterId) || '')}</span>
    <button class="btn btn-xs btn-ghost" data-act="cards.study.end">${icon('x', 14)} ${bi('End', 'শেষ')}</button>
  </div>
  ${progressBar(Math.round((study.idx / study.queue.length) * 100))}
  <div class="flash mt-2" data-act="cards.reveal">
    <div class="flash-card ${study.revealed ? 'flipped' : ''}">
      <div class="eyebrow">${study.revealed ? bi('Answer', 'উত্তর') : bi('Question', 'প্রশ্ন')}</div>
      <div class="${study.revealed ? 'flash-back' : 'flash-front'}">${esc(study.revealed ? c.back : c.front)}</div>
      ${!study.revealed ? `<div class="hint">${bi('Tap to reveal', 'দেখতে ট্যাপ করো')}</div>` : ''}
    </div>
  </div>
  ${study.revealed ? `<div class="row mt-2" style="gap:8px">
    <button class="btn btn-block btn-danger" data-act="cards.wrong">${icon('x', 16)} ${bi('Wrong — back to Box 1', 'ভুল — Box 1-এ')}</button>
    <button class="btn btn-block btn-primary" data-act="cards.right">${icon('check', 16)} ${bi('Got it ✓', 'পারলাম ✓')}</button>
  </div>` : `<button class="btn btn-primary btn-block mt-2" data-act="cards.reveal">${bi('Reveal answer', 'উত্তর দেখাও')}</button>`}
  <div class="row between mt tiny muted"><span>✓ ${study.correct}</span><span>✕ ${study.wrong}</span></div>`;
}

/* ------------------------------------------------------------------ notes */
function mdToHTML(text) {
  let s = esc(text || '');
  s = s.replace(/^### (.*)$/gm, '<b style="font-size:.92rem">$1</b>')
    .replace(/^## (.*)$/gm, '<b style="font-size:.98rem">$1</b>')
    .replace(/^# (.*)$/gm, '<b style="font-size:1.05rem">$1</b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-3);padding:1px 4px;border-radius:4px">$1</code>')
    .replace(/^- (.*)$/gm, '• $1')
    .replace(/\n/g, '<br>');
  return s;
}

function notesTab(state, notes) {
  const entries = notes.map(([sid, n]) => {
    const sess = sessionById(state, sid);
    return { sid, n, sess };
  }).filter((e) => {
    if (!e.sess) return false;
    if (nSearch) {
      const hay = `${e.n.body || ''} ${e.n.cue || ''} ${e.n.summary || ''} ${e.n.formula || ''} ${e.sess.clusterName}`;
      if (!hay.toLowerCase().includes(nSearch.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => (a.sess.unitN - b.sess.unitN));

  const grouped = {};
  entries.forEach((e) => {
    const k = `${e.sess.paper}|${e.sess.unitId}`;
    grouped[k] = grouped[k] || { paper: e.sess.paper, unitId: e.sess.unitId, unitName: e.sess.unitName, items: [] };
    grouped[k].items.push(e);
  });

  return `
  <div class="card">
    <div class="row" style="gap:8px">
      <input class="input" data-input="notes.search" value="${esc(nSearch)}" placeholder="${bi('Search across all notes…', 'সব নোটে খোঁজো…')}">
      <button class="btn btn-sm" data-act="notes.print">${icon('download', 15)} ${bi('Print', 'প্রিন্ট')}</button>
    </div>
    <div class="hint mt">${bi('Notes are saved per session, offline, in this browser. Export a backup from Settings.', 'নোট প্রতি সেশনে সেভ হয়, অফলাইনে, এই ব্রাউজারে। Settings থেকে ব্যাকআপ নাও।')}</div>
  </div>

  ${Object.keys(grouped).length === 0 ? `<div class="card mt">${emptyState('📝', bi('No notes yet.', 'এখনও নোট নেই।'),
    bi('The Notes block of every learn session opens a Cornell editor. Start with Day 1.', 'প্রতিটি লার্ন সেশনের Notes ব্লকে কর্নেল এডিটর আছে। Day 1 থেকে শুরু করো।'))}</div>`
    : Object.values(grouped).map((g) => `<div class="card mt">
      <div class="row between" style="align-items:flex-start">
        <div><div class="eyebrow">${g.paper === 'P1' ? 'Paper I' : 'Paper II'}</div>
          <div class="card-title">${esc(g.unitName.en)}</div></div>
        <button class="btn btn-xs" data-act="notes.unit" data-u="${esc(g.unitId)}">${bi('Unit summary', 'ইউনিট সামারি')}</button>
      </div>
      ${g.items.map((e) => `<div style="padding:9px 0;border-top:1px solid var(--line-2);margin-top:8px">
        <div class="row between"><b style="font-size:.8rem">${esc(e.sess.clusterName)} · S${e.sess.n}</b>
          <span class="tiny muted">${esc((e.n.updatedAt || '').slice(0, 10))}</span></div>
        <div class="small" style="max-height:64px;overflow:hidden;margin-top:3px;color:var(--ink-2)">${mdToHTML(e.n.summary || e.n.body || e.n.cue).slice(0, 260)}</div>
        <button class="tl-expand" data-act="notes.open" data-sid="${esc(e.sid)}">${bi('Open note →', 'নোট খোলো →')}</button>
      </div>`).join('')}
    </div>`).join('')}`;
}

function noteSheet(state, sid, R) {
  const n = (state.notes || {})[sid] || {};
  const sess = sessionById(state, sid);
  R.openSheet({
    title: sess ? esc(sess.clusterName) : bi('Note', 'নোট'),
    sub: sess ? `${sess.paper === 'P1' ? 'Paper I' : 'Paper II'} · U${sess.unitN} · ${bi('Session', 'সেশন')} ${sess.n}/${sess.of}` : '',
    body: `<div class="note-cornell">
      <div class="card tight" style="background:var(--surface-2)"><div class="label mb">${bi('Cues', 'কিউ')}</div><div class="small">${mdToHTML(n.cue) || '<span class="muted">—</span>'}</div></div>
      <div class="card tight"><div class="label mb">${bi('Notes', 'নোট')}</div><div class="small">${mdToHTML(n.body) || '<span class="muted">—</span>'}</div></div>
      <div class="card tight full2"><div class="label mb">${bi('Summary', 'সারসংক্ষেপ')}</div><div class="small">${mdToHTML(n.summary) || '<span class="muted">—</span>'}</div></div>
      <div class="card tight full2 formula-box"><div class="label mb">${bi('Formula / definition box', 'ফর্মুলা / ডেফিনিশন বক্স')}</div><div class="small">${mdToHTML(n.formula) || '<span class="muted">—</span>'}</div></div>
    </div>
    <div class="row mt" style="gap:8px">
      <button class="btn btn-sm" data-act="notes.edit" data-sid="${esc(sid)}">${icon('pen', 14)} ${bi('Edit in session card', 'সেশন কার্ডে এডিট')}</button>
      <button class="btn btn-sm btn-ghost" data-act="notes.printone" data-sid="${esc(sid)}">${bi('Print', 'প্রিন্ট')}</button>
    </div>`
  });
}

/* --------------------------------------------------------------- actions */
register('cards.tab', ({ data }) => { tab = data.t; study = null; R.refresh(); });
register('cards.study', () => {
  const state = R.state;
  const due = dueFlashcards(state);
  const queue = due.length ? due : (state.flashcards || []).filter((c) => !c.suspended);
  if (!queue.length) { R.toast(bi('Add a flashcard first.', 'আগে একটি ফ্ল্যাশকার্ড যোগ করো।'), 'warn'); return; }
  study = { queue: queue.map((c) => c.id), idx: 0, revealed: false, correct: 0, wrong: 0 };
  R.refresh();
});
register('cards.reveal', () => { if (study) { study.revealed = true; R.refresh(); } });
register('cards.right', () => {
  const state = R.state;
  const id = study.queue[study.idx];
  reviewFlashcard(state, id, true);
  study.correct++;
  advance();
});
register('cards.wrong', () => {
  const state = R.state;
  const id = study.queue[study.idx];
  reviewFlashcard(state, id, false);
  study.wrong++;
  advance();
});
function advance() {
  study.revealed = false;
  study.idx++;
  R.save();
  R.refresh();
}
register('cards.study.end', () => { study = null; R.refresh(); });
register('cards.del', ({ data }) => {
  R.state.flashcards = (R.state.flashcards || []).filter((c) => c.id !== data.id);
  R.save(); R.refresh();
});
register('cards.box', ({ value }) => { fBox = value; R.refresh(); });
onInput('cards.search', ({ value }) => { fSearch = value; R.refresh(); });
onInput('notes.search', ({ value }) => { nSearch = value; R.refresh(); });

register('cards.export', () => {
  const state = R.state;
  const lines = (state.flashcards || []).map((c) => JSON.stringify({ front: c.front, back: c.back, clusterId: c.clusterId || '', box: c.box || 1 }));
  downloadFile(exportFilename().replace('.json', '-flashcards.jsonl'), lines.join('\n'), 'application/jsonl');
  R.toast(bi('Flashcards exported as JSONL.', 'ফ্ল্যাশকার্ড JSONL হিসেবে এক্সপোর্ট হয়েছে।'), 'ok');
});
register('cards.import', () => {
  const inp = document.getElementById('card-file');
  if (inp) inp.click();
});
register('cards.file', ({ el }) => {
  const file = el.files && el.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const state = R.state;
    const text = String(reader.result || '');
    let added = 0;
    const push = (o) => {
      if (!o || !o.front || !o.back) return;
      state.flashcards.push({
        id: uid('fc'), front: String(o.front).slice(0, 400), back: String(o.back).slice(0, 800),
        clusterId: o.clusterId || '', box: Number(o.box) || 1, createdAt: todayKey(),
        dueKey: addDays(todayKey(), 1), reviews: 0
      });
      added++;
    };
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) parsed.forEach(push); else push(parsed);
    } catch (e) {
      text.split('\n').forEach((line) => { if (!line.trim()) return; try { push(JSON.parse(line)); } catch (err) { /* skip */ } });
    }
    R.save(); R.refresh();
    R.toast(bi(`${added} cards imported.`, `${added}টি কার্ড ইমপোর্ট হয়েছে।`), added ? 'ok' : 'warn');
  };
  reader.readAsText(file);
});

register('notes.open', ({ data }) => noteSheet(R.state, data.sid, R));
register('notes.edit', ({ data }) => {
  R.closeSheet();
  const state = R.state;
  const sid = data.sid;
  const dayKey = Object.keys(state.plan?.days || {}).find((k) => (state.plan.days[k].s || []).includes(sid));
  if (dayKey) {
    const tl = state.plan ? null : null;
    import('./session.js').then(({ openSessionSheet }) => {
      import('../engine.js').then(({ buildTimeline }) => {
        const rows = buildTimeline(state, dayKey).rows.filter((r) => r.kind === 'act' && r.act.cat === 'notes');
        openSessionSheet(state, R, dayKey, rows.length ? rows[0].actIndex : 0);
      });
    });
  } else {
    R.toast(bi('This note is not attached to a planned day yet.', 'এই নোট কোনো পরিকল্পিত দিনের সাথে যুক্ত নয়।'), 'warn');
  }
});
register('notes.unit', ({ data }) => {
  const state = R.state;
  let unit = null, paper = null;
  state.syllabus.forEach((p) => p.units.forEach((u) => { if (u.id === data.u) { unit = u; paper = p; } }));
  if (!unit) return;
  const items = unit.clusters.map((c) => {
    for (let i = 1; i <= c.sessions; i++) {
      const n = (state.notes || {})[`${c.id}#${i}`];
      if (n && (n.body || n.summary || n.cue || n.formula)) return { c, n, i };
    }
    return null;
  }).filter(Boolean);
  R.openSheet({
    title: `${esc(unit.name.en)} — ${bi('unit summary', 'ইউনিট সামারি')}`,
    sub: `${paper.id === 'P1' ? 'Paper I' : 'Paper II'} · ${items.length} ${bi('cluster notes', 'ক্লাস্টার নোট')}`,
    body: `${items.map(({ c, n, i }) => `<div class="card tight mt" style="background:var(--surface-2)">
        <div class="eyebrow">${esc(c.name)} · S${i}</div>
        ${n.summary ? `<div class="small mt"><b>${bi('Summary:', 'সারসংক্ষেপ:')}</b> ${mdToHTML(n.summary)}</div>` : ''}
        ${n.body ? `<div class="small mt">${mdToHTML(n.body).slice(0, 700)}</div>` : ''}
        ${n.formula ? `<div class="formula-box mt small">${mdToHTML(n.formula)}</div>` : ''}
      </div>`).join('')}
      ${items.length === 0 ? `<div class="hint">${bi('No notes in this unit yet.', 'এই ইউনিটে এখনও নোট নেই।')}</div>` : ''}
      <button class="btn btn-block mt" data-act="notes.print">${icon('download', 15)} ${bi('Print this summary', 'এই সামারি প্রিন্ট')}</button>`
  });
});
register('notes.print', () => { window.print(); });
register('notes.printone', () => { window.print(); });
