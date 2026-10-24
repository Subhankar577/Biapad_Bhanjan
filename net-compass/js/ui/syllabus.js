/* Syllabus tracker + editor. Topics come only from the official PDF data. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, L, esc, icon, progressBar, statusPill, dots, depthPill, verifyMark, emptyState } from './dom.js';
import {
  todayKey, overallProgress, paperProgress, unitProgress, sessionById, sessionPlanIndex,
  clusterStats, DAY_TYPE_LABEL, getDay, dueRevisions, dueFlashcards
} from '../engine.js';
import { orderedUnits } from '../data/syllabus.js';
import { searchLinks, badgeHTML } from './links.js';

let activePaper = 'P1';
let openUnits = new Set();
let editMode = false;
let dirty = false;

function unitsOf(state, paper) {
  return paper.id === 'P2'
    ? orderedUnits(paper, state.profile.unitOrderP2)
    : paper.units;
}

export function render(state, param) {
  if (param && (param === 'P1' || param === 'P2')) activePaper = param;
  const paper = state.syllabus.find((p) => p.id === activePaper) || state.syllabus[0];
  const overall = overallProgress(state);
  const pProg = paperProgress(state, paper.id);
  const units = unitsOf(state, paper);

  if (editMode) return editor(state, paper, units);

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Syllabus tracker', 'সিলেবাস ট্র্যাকার')}</div>
      <div class="page-sub">${bi('Only the official UGC NET topics — nothing invented', 'শুধু অফিসিয়াল UGC NET টপিক — বানানো কিছু নয়')}</div></div>
    <button class="btn btn-sm" data-act="syl.edit">${icon('pen', 15)} ${bi('Edit', 'এডিট')}</button>
  </div>

  ${dirty ? `<div class="note-band mb" style="background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 35%, transparent);color:var(--warn)">
    <span>⚠</span><span><b>${bi('Syllabus changed.', 'সিলেবাস বদলেছে।')}</b> ${bi('Re-generate the plan?', 'প্ল্যান আবার তৈরি করবে?')}
    <button class="btn btn-xs btn-soft" data-act="syl.replan" style="margin-left:6px">${bi('Re-generate', 'আবার তৈরি')}</button></span></div>` : ''}

  <div class="seg full mb">
    <button class="${activePaper === 'P1' ? 'active' : ''}" data-act="syl.paper" data-p="P1">${bi('Paper I', 'পত্র I')} · 44</button>
    <button class="${activePaper === 'P2' ? 'active' : ''}" data-act="syl.paper" data-p="P2">${bi('Paper II', 'পত্র II')} · 165</button>
  </div>

  <div class="grid g3">
    <div class="stat"><div class="stat-v">${pProg.pct}%</div><div class="stat-k">${bi('this paper', 'এই পত্র')}</div></div>
    <div class="stat"><div class="stat-v">${overall.pct}%</div><div class="stat-k">${bi('first pass total', 'মোট প্রথম পাস')}</div></div>
    <div class="stat"><div class="stat-v">${pProg.done}/${pProg.total}</div><div class="stat-k">${bi('clusters done', 'ক্লাস্টার শেষ')}</div></div>
  </div>

  <div class="card tight mt">
    <div class="row between" style="font-size:.72rem"><span class="muted">${bi('Paper I', 'পত্র I')} · ${overall.p1pct}%</span><span class="muted">${bi('Paper II', 'পত্র II')} · ${overall.p2pct}%</span></div>
    <div class="mt" style="display:flex;gap:4px;height:8px">
      <div style="flex:1;background:var(--surface-3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${overall.p1pct}%;background:var(--brand)"></div></div>
      <div style="flex:1;background:var(--surface-3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${overall.p2pct}%;background:var(--gold)"></div></div>
    </div>
  </div>

  <div class="tree mt-2">
    ${units.map((u) => unitHTML(state, paper, u)).join('')}
  </div>

  <div class="note-band mt">${icon('info', 15)} <span>${bi('Depth tags: D1 = awareness, D2 = exam level, D3 = deep/numerical. They change how much time the plan gives a topic.',
    'ডেপথ ট্যাগ: D1 = পরিচিতি, D2 = পরীক্ষার স্তর, D3 = গভীর/সংখ্যাগত। এগুলো টপিকের সময় নির্ধারণ করে।')}</span></div>
  <div class="note-band mt">${icon('info', 15)} <span>${bi('First pass = studied once. Mastery comes from revision, testing and error correction in Phase 2.',
    'প্রথম পাস = একবার পড়া। দক্ষতা আসে Phase 2-এর রিভিশন, টেস্ট ও ভুল সংশোধনে।')}</span></div>
  <div class="row mt" style="gap:8px;flex-wrap:wrap">
    <button class="btn btn-sm" data-act="nav.go" data-to="cards">${icon('cards', 15)} ${bi('Flashcards & notes', 'ফ্ল্যাশকার্ড ও নোট')}</button>
    <button class="btn btn-sm" data-act="nav.go" data-to="resources">${icon('folder', 15)} ${bi('Resources', 'রিসোর্স')}</button>
  </div>
  `;
}

function unitHTML(state, paper, u) {
  const up = unitProgress(state, u.id);
  const open = openUnits.has(u.id);
  const totalSessions = u.clusters.reduce((s, c) => s + (c.sessions || 1), 0);
  return `<div class="unit ${open ? 'open' : ''}">
    <div class="unit-h" data-act="syl.toggle" data-u="${esc(u.id)}" role="button" tabindex="0">
      <span class="unit-n">${u.n}</span>
      <div style="flex:1;min-width:0">
        <div class="unit-name">${esc(u.name.en)}</div>
        <div class="unit-meta">${u.clusters.length} ${bi('clusters', 'ক্লাস্টার')} · ${totalSessions} ${bi('sessions', 'সেশন')} · ${up.pct}% · ${up.accuracy ? up.accuracy + '% ' + bi('MCQ', 'MCQ') : bi('no MCQ logged', 'MCQ লগ নেই')}</div>
        <div class="mt" style="margin-top:6px">${progressBar(up.pct, up.pct === 100 ? 'ok' : '')}</div>
      </div>
      <span class="chev">${icon('chevron', 16)}</span>
    </div>
    <div class="unit-body">
      ${u.clusters.map((c) => {
        const st = (state.clusters || {})[c.id] || {};
        const cs = clusterStats(state, c.id);
        const rev = (state.revisions || []).filter((r) => r.clusterId === c.id && r.done).length;
        return `<div class="cluster" data-act="syl.cluster" data-c="${esc(c.id)}" role="button" tabindex="0">
          <div class="cluster-h">
            <div style="flex:1;min-width:0">
              <div class="cluster-name">${esc(c.name)} ${verifyMark(c.verify)}</div>
              <div class="cluster-terms">${esc(c.terms)}</div>
            </div>
            <span class="chev">${icon('chevron', 14)}</span>
          </div>
          <div class="cluster-meta">
            ${statusPill(st.status || 'not-started')}
            ${depthPill(c.depth)}
            <span class="pill line">${c.sessions} ${bi('sess', 'সেশন')}</span>
            <span class="pill line">${dots(st.confidence || 0)}</span>
            ${cs.attempted ? `<span class="pill ${cs.accuracy >= 60 ? 'ok' : 'bad'}">${cs.accuracy}% · ${cs.attempted}Q</span>` : ''}
            ${rev ? `<span class="pill info">${bi('revised', 'রিভিশন')} ×${rev}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function clusterSheet(state, cid, R) {
  let found = null;
  state.syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((c) => { if (c.id === cid) found = { p, u, c }; })));
  if (!found) return;
  const { p, u, c } = found;
  const st = (state.clusters || {})[cid] || {};
  const cs = clusterStats(state, cid);
  const idx = sessionPlanIndex(state);
  const sess = [];
  for (let i = 1; i <= (c.sessions || 1); i++) {
    const sid = `${cid}#${i}`;
    sess.push({ sid, n: i, planned: idx[sid]?.plannedDate, done: (state.sessions[sid] || {}).status === 'done' });
  }
  const cards = (state.flashcards || []).filter((f) => f.clusterId === cid);
  const pins = (state.pins || []).filter((x) => x.clusterId === cid && !x.broken);
  const errors = (state.errors || []).filter((e) => e.clusterId === cid);
  const revisions = (state.revisions || []).filter((r) => r.clusterId === cid);
  const links = searchLinks(c, p, u);

  R.openSheet({
    title: esc(c.name),
    sub: `${bi('Paper', 'পত্র')} ${p.id === 'P1' ? 'I' : 'II'} · ${bi('Unit', 'ইউনিট')} ${u.n} · ${c.sessions} ${bi('sessions', 'সেশন')}`,
    body: `
      <div class="row wrap" style="gap:6px">
        ${statusPill(st.status || 'not-started')} ${depthPill(c.depth)} ${verifyMark(c.verify)}
        <span class="pill line">${bi('confidence', 'কনফিডেন্স')} ${st.confidence || 0}/5</span>
        ${cs.attempted ? `<span class="pill ${cs.accuracy >= 60 ? 'ok' : 'bad'}">${cs.accuracy}% · ${cs.attempted}Q</span>` : ''}
      </div>
      <div class="card tight mt"><div class="label">${bi('Official key terms', 'অফিসিয়াল কী টার্ম')}</div>
        <p class="small mt" style="line-height:1.6">${esc(c.terms)}</p></div>

      <div class="card tight mt">
        <div class="card-title">${bi('Sessions', 'সেশন')}</div>
        ${sess.map((s) => `<div class="kv"><span>${bi('Session', 'সেশন')} ${s.n} · ${s.done ? `<span style="color:var(--ok)">✓ ${bi('done', 'সম্পন্ন')}</span>` : (s.planned ? esc(s.planned) : bi('unscheduled', 'সময় নির্ধারিত নয়'))}</span>
          <b>${s.done ? '' : (s.planned ? `${bi('planned', 'পরিকল্পিত')}` : '')}</b></div>`).join('')}
      </div>

      <div class="card tight mt">
        <div class="row between"><span class="label">${bi('Confidence', 'কনফিডেন্স')}</span>
          <div class="row" style="gap:4px">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${(st.confidence || 0) === n ? 'on' : ''}" data-act="syl.rate" data-c="${esc(cid)}" data-n="${n}" style="padding:4px 9px">${n}</button>`).join('')}</div>
        </div>
        <div class="row mt" style="gap:6px;flex-wrap:wrap">
          <button class="btn btn-xs" data-act="syl.markdone" data-c="${esc(cid)}">${bi('Mark first pass done', 'প্রথম পাস সম্পন্ন মার্ক')}</button>
          <button class="btn btn-xs btn-ghost" data-act="syl.revision" data-c="${esc(cid)}">${bi('Add revision now', 'রিভিশন যোগ')}</button>
        </div>
      </div>

      <div class="card tight mt">
        <div class="card-h"><span class="card-title">${bi('Resources', 'রিসোর্স')}</span><span class="hint">${bi('free only', 'শুধু ফ্রি')}</span></div>
        <div class="link-list">
          ${links.map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
            <span class="ic">${l.ic}</span><span class="lt"><b>${esc(l.title)}</b><span>${esc(l.note)}</span></span>
            ${badgeHTML(l.badge)}${icon('external', 14)}</a>`).join('')}
          ${pins.map((pin) => `<a class="link" href="${esc(pin.url)}" target="_blank" rel="noopener noreferrer"><span class="ic">📌</span>
            <span class="lt"><b>${esc(pin.title || pin.url)}</b><span>${bi('pinned', 'পিন করা')}</span></span>${badgeHTML('pin', pin.verified)}${icon('external', 14)}</a>`).join('')}
        </div>
        <div class="tiny muted mt">${bi('Links are search links or official portals only. Verify before studying.',
          'লিংকগুলো সার্চ লিংক বা অফিসিয়াল পোর্টাল। পড়ার আগে যাচাই করো।')}</div>
      </div>

      <div class="grid g3 mt">
        <div class="stat"><div class="stat-v">${cards.length}</div><div class="stat-k">${bi('flashcards', 'ফ্ল্যাশকার্ড')}</div></div>
        <div class="stat"><div class="stat-v">${errors.length}</div><div class="stat-k">${bi('errors logged', 'ভুল লগ')}</div></div>
        <div class="stat"><div class="stat-v">${revisions.filter((r) => !r.done).length}</div><div class="stat-k">${bi('revisions due', 'রিভিশন বাকি')}</div></div>
      </div>
      ${errors.length ? `<div class="card tight mt"><div class="card-title">${bi('Recent errors', 'সাম্প্রতিক ভুল')}</div>
        ${errors.slice(0, 4).map((e) => `<div class="kv"><span>${esc(String(e.question || '').slice(0, 60))}</span><b class="tiny">${esc(e.errorType || '')}</b></div>`).join('')}</div>` : ''}
      <div class="row mt" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm" data-act="nav.go" data-to="cards">${icon('cards', 15)} ${bi('Study these cards', 'কার্ড পড়ো')}</button>
        <button class="btn btn-sm" data-act="nav.go" data-to="errors">${icon('alert', 15)} ${bi('Error notebook', 'এরর নোটবুক')}</button>
      </div>`
  });
}

/* --------------------------------------------------------------- editor */
function editor(state, paper, units) {
  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Edit syllabus', 'সিলেবাস এডিট')}</div>
      <div class="page-sub">${bi('Match every line with the official UGC/NTA PDF', 'প্রতিটি লাইন অফিসিয়াল UGC/NTA PDF-এর সাথে মিলাও')}</div></div>
    <button class="btn btn-sm" data-act="syl.edit">${icon('x', 15)} ${bi('Close', 'বন্ধ')}</button>
  </div>
  <div class="note-band" style="background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 40%, transparent);color:var(--warn)">
    ${icon('alert', 16)} <span><b>${bi('Edit carefully.', 'সাবধানে এডিট করো।')}</b> ${bi('The plan engine uses these session counts and depths. A change can re-shuffle your future days.',
      'প্ল্যান ইঞ্জিন এই সেশন সংখ্যা ও ডেপথ ব্যবহার করে। পরিবর্তনে ভবিষ্যতের দিন বদলে যেতে পারে।')}</span></div>

  ${units.map((u, ui) => `<div class="card mt">
    <form data-form="syl.unit" data-u="${esc(u.id)}">
      <div class="row between"><div class="label">${bi('Unit', 'ইউনিট')} ${u.n} · ${esc(u.id)}</div>
        <div class="row" style="gap:4px">
          ${paper.id === 'P2' ? `<button class="icon-btn" type="button" data-act="syl.move" data-u="${esc(u.id)}" data-dir="-1" aria-label="${bi('Move up', 'উপরে')}">↑</button>
          <button class="icon-btn" type="button" data-act="syl.move" data-u="${esc(u.id)}" data-dir="1" aria-label="${bi('Move down', 'নিচে')}">↓</button>` : ''}
        </div>
      </div>
      <input class="input mt" name="name" value="${esc(u.name.en)}" aria-label="${bi('Unit name', 'ইউনিটের নাম')}">
      <div class="col mt" style="gap:9px">
        ${u.clusters.map((c, ci) => `<div class="card tight" style="background:var(--surface-2);box-shadow:none">
          <div class="row between"><span class="tiny muted">${bi('Cluster', 'ক্লাস্টার')} ${ci + 1}</span>
            <button class="btn btn-xs btn-ghost" type="button" data-act="syl.delcluster" data-u="${esc(u.id)}" data-c="${esc(c.id)}">${icon('trash', 13)}</button></div>
          <input class="input mt" name="cname_${c.id}" value="${esc(c.name)}" aria-label="${bi('Cluster name', 'ক্লাস্টারের নাম')}">
          <textarea class="textarea mt" name="terms_${c.id}" style="min-height:64px" aria-label="${bi('Key terms', 'কী টার্ম')}">${esc(c.terms)}</textarea>
          <div class="mini-grid mt">
            <div class="field"><label>${bi('Sessions', 'সেশন')}</label><input class="input" type="number" min="1" max="20" name="sess_${c.id}" value="${c.sessions}"></div>
            <div class="field"><label>${bi('Depth', 'ডেপথ')}</label>
              <select class="select" name="depth_${c.id}">
                ${['D1', 'D2', 'D3'].map((d) => `<option value="${d}" ${c.depth === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select></div>
            <div class="field"><label>${bi('Verify', 'যাচাই')}</label>
              <label class="chk" style="padding-top:8px"><input type="checkbox" name="verify_${c.id}" ${c.verify ? 'checked' : ''}> <span class="tiny">⚠</span></label></div>
          </div>
        </div>`).join('')}
      </div>
      <div class="row mt" style="gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" type="submit">${bi('Save unit', 'ইউনিট সেভ')}</button>
        <button class="btn btn-sm" type="button" data-act="syl.addcluster" data-u="${esc(u.id)}">${icon('plus', 14)} ${bi('Add cluster', 'ক্লাস্টার যোগ')}</button>
      </div>
    </form>
  </div>`).join('')}

  <div class="card mt">
    <div class="card-title">${bi('Session totals', 'সেশন মোট')}</div>
    <div class="kv"><span>${bi('Paper I', 'পত্র I')}</span><b>${state.syllabus[0].units.reduce((s, u) => s + u.clusters.reduce((a, c) => a + c.sessions, 0), 0)}</b></div>
    <div class="kv"><span>${bi('Paper II', 'পত্র II')}</span><b>${state.syllabus[1].units.reduce((s, u) => s + u.clusters.reduce((a, c) => a + c.sessions, 0), 0)}</b></div>
    <div class="row mt" style="gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-ghost" data-act="syl.reset">${icon('refresh', 15)} ${bi('Reset to official data', 'অফিসিয়াল ডেটায় ফেরাও')}</button>
    </div>
  </div>

  <div class="card mt">
    <div class="card-title">${bi('Edit history', 'এডিট হিস্ট্রি')}</div>
    ${(state.syllabusHistory || []).length === 0 ? `<div class="hint mt">${bi('No edits yet.', 'এখনও এডিট নেই।')}</div>`
      : state.syllabusHistory.slice(0, 8).map((h, i) => `<div class="kv"><span>${esc(new Date(h.at).toLocaleString())}<div class="tiny muted">${esc(h.note || '')}</div></span>
        <button class="btn btn-xs btn-ghost" data-act="syl.restore" data-i="${i}" ${h.snapshot ? '' : 'disabled'}>${bi('Restore', 'ফিরিয়ে আনো')}</button></div>`).join('')}
    <div class="hint mt">${bi('Restoring replaces the current syllabus with that saved version. Your progress is kept.', 'ফিরিয়ে আনলে বর্তমান সিলেবাসের জায়গায় সেই সংস্করণ বসবে। অগ্রগতি অক্ষত থাকবে।')}</div>
  </div>`;
}

/* -------------------------------------------------------------- actions */
register('syl.paper', ({ data }) => { activePaper = data.p; editMode = false; R.refresh(); });
register('syl.toggle', ({ data }) => {
  if (openUnits.has(data.u)) openUnits.delete(data.u); else openUnits.add(data.u);
  R.refresh();
});
register('syl.cluster', ({ data }) => { clusterSheet(R.state, data.c, R); });
register('syl.edit', () => {
  editMode = !editMode;
  if (editMode) dirty = false;
  R.refresh();
});
register('syl.rate', ({ data }) => {
  const state = R.state;
  state.clusters = state.clusters || {};
  const cl = state.clusters[data.c] || { status: 'learning' };
  cl.confidence = Number(data.n);
  if (!cl.status || cl.status === 'not-started') cl.status = 'learning';
  state.clusters[data.c] = cl;
  R.save(); R.closeSheet(); R.refresh();
});
register('syl.markdone', ({ data }) => {
  const state = R.state;
  state.clusters = state.clusters || {};
  const cl = state.clusters[data.c] || {};
  cl.status = 'done';
  cl.firstPassAt = cl.firstPassAt || todayKey();
  state.clusters[data.c] = cl;
  import('../engine.js').then(({ scheduleRevisions }) => {
    scheduleRevisions(state, data.c, todayKey());
    R.save(); R.closeSheet(); R.refresh();
    R.toast(bi('Marked first pass done. Revisions scheduled at +1, +7, +30, +90 days.', 'প্রথম পাস সম্পন্ন। +১, +৭, +৩০, +৯০ দিনে রিভিশন বসানো হয়েছে।'), 'ok');
  });
});
register('syl.revision', ({ data }) => {
  import('../engine.js').then(({ scheduleRevisions, addDays }) => {
    R.state.revisions = R.state.revisions || [];
    R.state.revisions.push({ id: `manual-${data.c}-${Date.now()}`, clusterId: data.c, due: addDays(todayKey(), 1), offset: 1, done: false, kind: 'manual' });
    R.save(); R.closeSheet(); R.refresh();
    R.toast(bi('Revision added for tomorrow.', 'কালকের জন্য রিভিশন যোগ হয়েছে।'), 'ok');
  });
});
register('syl.move', ({ data }) => {
  const state = R.state;
  const order = state.profile.unitOrderP2.slice();
  const i = order.indexOf(data.u);
  const j = i + Number(data.dir);
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  state.profile.unitOrderP2 = order;
  R.save();
  dirty = true;
  R.refresh();
});
register('syl.addcluster', ({ data }) => {
  const state = R.state;
  let unit = null, paper = null;
  state.syllabus.forEach((p) => p.units.forEach((u) => { if (u.id === data.u) { unit = u; paper = p; } }));
  if (!unit) return;
  const n = unit.clusters.length + 1;
  const cid = `${unit.id}C${n}${Date.now().toString(36).slice(-3)}`;
  unit.clusters.push({ id: cid, name: bi('New cluster', 'নতুন ক্লাস্টার'), sessions: 1, depth: 'D2', terms: bi('Add key terms from the official syllabus.', 'অফিসিয়াল সিলেবাস থেকে কী টার্ম লেখো।'), verify: true });
  pushHistory(state, `Added cluster to ${unit.id}`);
  R.save(); R.refresh();
});
register('syl.delcluster', ({ data }) => {
  const state = R.state;
  state.syllabus.forEach((p) => p.units.forEach((u) => {
    if (u.id === data.u) {
      u.clusters = u.clusters.filter((c) => c.id !== data.c);
    }
  }));
  pushHistory(state, `Removed cluster ${data.c}`);
  R.save(); R.refresh();
  R.toast(bi('Cluster removed. Re-generate the plan to apply.', 'ক্লাস্টার মুছে গেছে। প্রয়োগ করতে প্ল্যান আবার তৈরি করো।'), 'warn');
});
register('syl.reset', () => {
  const state = R.state;
  pushHistory(state, 'Reset syllabus to official data');
  import('../data/syllabus.js').then(({ cloneSyllabus }) => {
    state.syllabus = cloneSyllabus();
    R.save(); R.refresh();
    R.toast(bi('Syllabus reset to the official data.', 'সিলেবাস অফিসিয়াল ডেটায় ফিরেছে।'), 'ok');
  });
});
register('syl.restore', ({ data }) => {
  const state = R.state;
  const entry = (state.syllabusHistory || [])[Number(data.i)];
  if (!entry || !entry.snapshot) return;
  state.syllabus = JSON.parse(JSON.stringify(entry.snapshot));
  pushHistory(state, 'Restored an earlier syllabus version');
  dirty = true;
  R.save(); R.refresh();
  R.toast(bi('Version restored. Re-generate the plan to apply it.', 'সংস্করণ ফিরেছে। প্রয়োগ করতে প্ল্যান আবার তৈরি করো।'), 'ok');
});
register('syl.replan', () => {
  R.ensurePlan({ force: true });
  dirty = false;
  R.refresh();
  R.toast(bi('Plan regenerated from today.', 'আজ থেকে প্ল্যান আবার তৈরি হয়েছে।'), 'ok');
});

registerForm('syl.unit', ({ data, el }) => {
  const state = R.state;
  const uid = el.dataset.u;
  let unit = null;
  state.syllabus.forEach((p) => p.units.forEach((u) => { if (u.id === uid) unit = u; }));
  if (!unit) return;
  pushHistory(state, `Edited unit ${uid}`);
  unit.name = { ...unit.name, en: data.name || unit.name.en };
  unit.clusters.forEach((c) => {
    if (data[`cname_${c.id}`] != null) c.name = data[`cname_${c.id}`];
    if (data[`terms_${c.id}`] != null) c.terms = data[`terms_${c.id}`];
    if (data[`sess_${c.id}`] != null) c.sessions = Math.max(1, Math.min(20, Number(data[`sess_${c.id}`]) || 1));
    if (data[`depth_${c.id}`]) c.depth = data[`depth_${c.id}`];
    c.verify = !!data[`verify_${c.id}`];
  });
  R.save();
  dirty = true;
  R.refresh();
  R.toast(bi('Syllabus saved. Re-generate the plan to apply the change.', 'সিলেবাস সেভ হয়েছে। প্রয়োগ করতে প্ল্যান আবার তৈরি করো।'), 'ok');
});

function pushHistory(state, note) {
  state.syllabusHistory = state.syllabusHistory || [];
  state.syllabusHistory.unshift({ at: new Date().toISOString(), note, snapshot: JSON.parse(JSON.stringify(state.syllabus)) });
  state.syllabusHistory = state.syllabusHistory.slice(0, 20);
}
