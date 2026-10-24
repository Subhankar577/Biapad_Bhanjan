/* Resource library — free links only, with honest badges + folder helper. */
import { R } from '../runtime.js';
import { register, registerForm, onInput } from './actions.js';
import { bi, esc, icon, emptyState, copyText } from './dom.js';
import { searchLinks, badgeHTML, folderTree, OFFICIAL_LINKS } from './links.js';
import { findCluster } from '../data/syllabus.js';
import { todayKey } from '../engine.js';
import { uid } from '../store.js';

let rPaper = 'P2';
let rUnit = null;
let rSource = 'all';
let rType = 'all';
let showFolders = false;

export function render(state) {
  const paper = state.syllabus.find((p) => p.id === rPaper) || state.syllabus[1];
  const unit = paper.units.find((u) => u.id === rUnit) || paper.units[0];
  const pins = state.pins || [];
  const filteredPins = pins.filter((p) => {
    if (p.broken) return false;
    if (rSource === 'verified' && !p.verified) return false;
    if (rSource === 'unverified' && p.verified) return false;
    if (rType !== 'all' && (p.type || 'link') !== rType) return false;
    return true;
  });

  return `
  <div class="page-head">
    <div><div class="page-title">${bi('Resources', 'রিসোর্স')}</div>
      <div class="page-sub">${bi('Free only. No books needed.', 'শুধু ফ্রি। বইয়ের দরকার নেই।')}</div></div>
    <button class="btn btn-sm" data-act="res.folders">${icon('folder', 15)} ${bi('Folder helper', 'ফোল্ডার হেল্পার')}</button>
  </div>

  ${showFolders ? folderHelper(state) : ''}

  <div class="seg full mb">
    <button class="${rPaper === 'P1' ? 'active' : ''}" data-act="res.paper" data-p="P1">${bi('Paper I', 'পত্র I')}</button>
    <button class="${rPaper === 'P2' ? 'active' : ''}" data-act="res.paper" data-p="P2">${bi('Paper II', 'পত্র II')}</button>
  </div>

  <div class="row wrap mb" style="gap:6px">
    ${paper.units.map((u) => `<button class="chip ${u.id === unit.id ? 'on' : ''}" data-act="res.unit" data-u="${esc(u.id)}" style="font-size:.7rem">U${u.n}</button>`).join('')}
  </div>

  <div class="card">
    <div class="card-h"><span class="card-title">${esc(unit.name.en)}</span><span class="pill line">${unit.clusters.length} ${bi('clusters', 'ক্লাস্টার')}</span></div>
    <div class="hint mb">${bi('Auto-generated search links are built from the official topic name. They are not verified.',
      'স্বয়ংক্রিয় সার্চ লিংক অফিসিয়াল টপিকের নাম থেকে তৈরি। এগুলো যাচাই করা নয়।')}</div>
    ${unit.clusters.map((c) => {
      const links = searchLinks(c, paper, unit);
      const cp = pins.filter((p) => p.clusterId === c.id && !p.broken);
      const sid = `${c.id}#1`;
      const pinSess = (state.pins || []).filter((p) => p.sid === sid);
      return `<div class="card tight mt" style="background:var(--surface-2);box-shadow:none">
        <div class="row between" style="align-items:flex-start">
          <div style="min-width:0"><b style="font-size:.82rem">${esc(c.name)}</b>
            <div class="tiny muted">${esc(c.sessions)} ${bi('sessions', 'সেশন')} · ${c.depth}</div></div>
        </div>
        <div class="link-list mt">
          ${links.slice(0, 2).map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" style="background:var(--surface)">
            <span class="ic">${l.ic}</span><span class="lt"><b>${esc(l.title)}</b></span>${badgeHTML(l.badge)}${icon('external', 13)}</a>`).join('')}
          ${cp.map((p) => `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" style="background:var(--surface)">
            <span class="ic">📌</span><span class="lt"><b>${esc(p.title || p.url)}</b><span>${esc(p.note || '')}</span></span>
            ${badgeHTML('pin', p.verified)}${icon('external', 13)}</a>`).join('')}
        </div>
        <form class="mt" data-form="res.pin">
          <input type="hidden" name="clusterId" value="${esc(c.id)}">
          <div class="row" style="gap:6px">
            <input class="input" name="url" placeholder="${bi('Paste your free link', 'তোমার ফ্রি লিংক পেস্ট করো')}" required>
            <select class="select" name="type" style="width:auto;padding:8px"><option value="video">🎥</option><option value="article">📖</option><option value="pdf">📄</option><option value="tool">🛠</option><option value="other">🔗</option></select>
            <button class="btn btn-sm btn-soft" type="submit">${icon('pin', 14)}</button>
          </div>
          <label class="chk mt tiny"><input type="checkbox" name="verified"> <span>${bi('I verified this link', 'আমি লিংকটি যাচাই করেছি')}</span></label>
        </form>
      </div>`;
    }).join('')}
  </div>

  <div class="card mt">
    <div class="card-h"><span class="card-title">${bi('My pinned resources', 'আমার পিন করা রিসোর্স')}</span><span class="pill ${filteredPins.length ? 'brand' : 'line'}">${filteredPins.length}</span></div>
    <div class="row wrap mb" style="gap:6px">
      ${[['all', bi('All', 'সব')], ['verified', bi('Verified ✔', 'যাচাই ✔')], ['unverified', bi('Unverified', 'যাচাই হয়নি')]]
        .map(([v, l]) => `<button class="chip ${rSource === v ? 'on' : ''}" data-act="res.source" data-v="${v}" style="font-size:.68rem">${l}</button>`).join('')}
      <select class="select" data-change="res.type" style="width:auto;padding:5px 8px;font-size:.7rem">
        ${[['all', bi('Any type', 'যেকোনো')], ['video', bi('Video', 'ভিডিও')], ['article', bi('Article', 'আর্টিকেল')], ['pdf', bi('PDF', 'PDF')], ['tool', bi('Tool', 'টুল')]]
          .map(([v, l]) => `<option value="${v}" ${rType === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    ${filteredPins.length === 0 ? `<div class="hint">${bi('Nothing pinned yet. Pin the one video you actually use — not twenty.', 'এখনও কিছু পিন করা নেই। যে একটি ভিডিও সত্যিই ব্যবহার করো সেটাই পিন করো।')}</div>`
      : filteredPins.map((p) => {
        const cl = findCluster(state.syllabus, p.clusterId);
        return `<div class="res">
          <span class="res-ic">🔗</span>
          <div class="res-t">
            <b><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title || p.url)}</a></b>
            <span>${cl ? esc(cl.cluster.name) : bi('unlinked', 'আনলিংকড')} · ${esc(p.type || 'link')}${p.verifiedAt ? ` · ${bi('verified', 'যাচাই')} ${esc(p.verifiedAt)}` : ''}</span>
          </div>
          <div class="res-actions">
            <button class="icon-btn" data-act="res.verify" data-id="${esc(p.id)}" title="${bi('Toggle verified', 'যাচাই টগল')}">${p.verified ? '✔' : '○'}</button>
            <button class="icon-btn" data-act="res.broken" data-id="${esc(p.id)}" title="${bi('Flag as broken', 'ভাঙা বলে ফ্ল্যাগ')}">⚠</button>
            <button class="icon-btn" data-act="res.del" data-id="${esc(p.id)}" aria-label="${bi('Delete', 'মুছো')}">${icon('trash', 14)}</button>
          </div>
        </div>`;
      }).join('')}
    <div class="tiny muted mt">${bi('Verified means you personally opened the link and it matched the topic. The app never marks a link as verified for you.',
      'যাচাই মানে তুমি নিজে লিংক খুলে দেখেছ সেটি টপিকের সাথে মেলে। অ্যাপ কখনো নিজে থেকে ভেরিফায়েড বলে না।')}</div>
  </div>

  <div class="card mt">
    <div class="card-title mb">${bi('Official & free root sites', 'অফিসিয়াল ও ফ্রি রুট সাইট')}</div>
    <div class="link-list">
      ${OFFICIAL_LINKS.map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
        <span class="ic">🌐</span><span class="lt"><b>${esc(l.title)}</b><span>${esc(l.url)}</span></span>${badgeHTML(l.badge)}${icon('external', 13)}</a>`).join('')}
    </div>
    <div class="hint mt">${bi('Only official portals and search links are used. No invented deep URLs.', 'শুধু অফিসিয়াল পোর্টাল ও সার্চ লিংক ব্যবহার হয়। বানানো ডিপ URL নয়।')}</div>
  </div>`;
}

function folderHelper(state) {
  const tree = folderTree(state);
  return `<div class="card" style="border-color:color-mix(in srgb,var(--brand) 30%, transparent)">
    <div class="row between mb"><span class="card-title">${bi('Folder helper', 'ফোল্ডার হেল্পার')}</span>
      <div class="row" style="gap:5px">
        <button class="btn btn-xs" data-act="res.copyfolders">${icon('download', 13)} ${bi('Copy', 'কপি')}</button>
        <button class="btn btn-xs btn-ghost" data-act="res.printfolders">${bi('Print', 'প্রিন্ট')}</button>
      </div></div>
    <pre id="folder-tree" style="font-size:.62rem;line-height:1.5;overflow-x:auto;background:var(--surface-2);border-radius:10px;padding:10px;margin:0;color:var(--ink-2)">${esc(tree)}</pre>
    <div class="hint mt">${bi('Naming convention: U01_C05_GraphTheory_Notes.pdf', 'নামকরণ: U01_C05_GraphTheory_Notes.pdf')}</div>
    <div class="note-band mt">${icon('info', 15)} <span>${bi('Tip: keep a Resources.txt in each unit folder with your pinned links as a backup.', 'টিপ: প্রতিটি ইউনিট ফোল্ডারে Resources.txt-এ পিন করা লিংক ব্যাকআপ হিসেবে রাখো।')}</span></div>
    <button class="btn btn-sm btn-ghost mt" data-act="res.folders">${bi('Hide', 'লুকাও')}</button>
  </div>`;
}

/* --------------------------------------------------------------- actions */
register('res.paper', ({ data }) => { rPaper = data.p; rUnit = null; R.refresh(); });
register('res.unit', ({ data }) => { rUnit = data.u; R.refresh(); });
register('res.source', ({ data }) => { rSource = data.v; R.refresh(); });
register('res.type', ({ value }) => { rType = value; R.refresh(); });
register('res.folders', () => { showFolders = !showFolders; R.refresh(); });
register('res.printfolders', () => {
  const tree = folderTree(R.state);
  R.openSheet({
    title: bi('Folder structure', 'ফোল্ডার স্ট্রাকচার'),
    sub: bi('Print it and keep it next to your desk.', 'প্রিন্ট করে ডেস্কের পাশে রাখো।'),
    body: `<pre style="font-size:.66rem;line-height:1.6;white-space:pre-wrap">${esc(tree)}</pre>
      <div class="hint mt">${bi('Naming convention: U01_C05_GraphTheory_Notes.pdf', 'নামকরণ: U01_C05_GraphTheory_Notes.pdf')}</div>
      <button class="btn btn-primary btn-block mt" data-act="res.doprint">${icon('download', 15)} ${bi('Print / save as PDF', 'প্রিন্ট / PDF সেভ')}</button>`
  });
});
register('res.doprint', () => { setTimeout(() => window.print(), 150); });
register('res.copyfolders', () => {
  const el = document.getElementById('folder-tree');
  if (el) copyText(el.textContent).then(() => R.toast(bi('Folder tree copied.', 'ফোল্ডার ট্রি কপি হয়েছে।'), 'ok'));
});
registerForm('res.pin', ({ data }) => {
  const state = R.state;
  let url = String(data.url || '').trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  state.pins = state.pins || [];
  state.pins.push({
    id: uid('pin'), url, title: url.replace(/^https?:\/\//, '').slice(0, 70),
    type: data.type || 'link', clusterId: data.clusterId || '',
    verified: !!data.verified, verifiedAt: data.verified ? todayKey() : null, addedAt: todayKey()
  });
  R.save(); R.refresh();
  R.toast(bi('Pinned.', 'পিন হয়েছে।'), 'ok');
});
register('res.verify', ({ data }) => {
  const state = R.state;
  const p = (state.pins || []).find((x) => x.id === data.id);
  if (!p) return;
  p.verified = !p.verified;
  p.verifiedAt = p.verified ? todayKey() : null;
  R.save(); R.refresh();
});
register('res.broken', ({ data }) => {
  const state = R.state;
  const p = (state.pins || []).find((x) => x.id === data.id);
  if (!p) return;
  p.broken = true;
  p.brokenAt = todayKey();
  R.save(); R.refresh();
  R.toast(bi('Flagged as broken. It is hidden from the list.', 'ভাঙা বলে ফ্ল্যাগ হয়েছে। তালিকা থেকে লুকানো হলো।'), 'warn');
});
register('res.del', ({ data }) => {
  R.state.pins = (R.state.pins || []).filter((x) => x.id !== data.id);
  R.save(); R.refresh();
});
onInput('res.search', () => {});
