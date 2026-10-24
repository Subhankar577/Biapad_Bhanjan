/* Tiny DOM / formatting helpers shared by every screen. */
import { icon } from './icons.js';
export { icon };

export function lang() {
  return document.documentElement.getAttribute('data-lang') || 'en';
}
export function bi(en, bn) { return lang() === 'bn' ? bn : en; }
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return lang() === 'bn' ? (obj.bn || obj.en || '') : (obj.en || obj.bn || '');
}
export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function fmtMin(m) {
  const v = Math.round(m || 0);
  return bi(`${v} min`, `${v} মিনিট`);
}
export function fmtHours(m) {
  const h = (m || 0) / 60;
  const s = h >= 10 ? Math.round(h) : Math.round(h * 10) / 10;
  return bi(`${s} h`, `${s} ঘণ্টা`);
}
export function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}
export function fmtNum(v) { return Number(v || 0).toLocaleString('en-IN'); }

export function ring(pct, value, unit, size = 156) {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  const r = 62;
  const c = 2 * Math.PI * r;
  const off = c - (p / 100) * c;
  return `<div class="ring-wrap" style="width:${size}px;height:${size}px" role="img" aria-label="${p}%">
    <svg class="ring" viewBox="0 0 156 156">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--brand)"/><stop offset="100%" stop-color="var(--brand-2)"/>
      </linearGradient></defs>
      <circle class="bg" cx="78" cy="78" r="${r}"/>
      <circle class="fg" cx="78" cy="78" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="ring-mid"><b>${value}</b><span>${esc(unit)}</span></div>
  </div>`;
}

export function progressBar(pct, tone = '') {
  const p = Math.max(0, Math.min(100, pct || 0));
  return `<div class="progress ${tone}"><i style="width:${p}%"></i></div>`;
}

export function statusPill(status) {
  const map = {
    'not-started': ['line', bi('Not started', 'শুরু হয়নি')],
    learning: ['warn', bi('Learning', 'শিখছি')],
    done: ['ok', bi('First pass done ✔', 'প্রথম পাস সম্পন্ন ✔')],
    'done-revisit': ['info', bi('Done · needs revisit', 'সম্পন্ন · আবার দেখা দরকার')],
    'needs-help': ['bad', bi('🔴 Needs help', '🔴 সাহায্য দরকার')],
    mastered: ['brand', bi('Mastered ⭐', 'মাস্টার্ড ⭐')]
  };
  const [tone, label] = map[status] || map['not-started'];
  return `<span class="pill ${tone}">${label}</span>`;
}

export function confTone(v) {
  if (v <= 2) return 'bad';
  if (v === 3) return 'warn';
  return 'ok';
}

export function dots(n, total = 5) {
  let out = '<span class="dots">';
  for (let i = 1; i <= total; i++) out += `<i class="${i <= n ? 'on' : ''}"></i>`;
  return out + '</span>';
}

export function depthPill(depth) {
  const map = { D1: 'line', D2: 'info', D3: 'brand' };
  return `<span class="pill ${map[depth] || 'line'}">${esc(depth || 'D2')}</span>`;
}

export function verifyMark(on) {
  if (!on) return '';
  return `<span class="badge b-verify" title="${bi('Text was unclear in the PDF — please verify in the official syllabus', 'PDF-এ লেখা অস্পষ্ট ছিল — অফিসিয়াল সিলেবাসে যাচাই করুন')}">⚠ ${bi('Verify with official PDF', 'অফিসিয়াল PDF-এ যাচাই করুন')}</span>`;
}

export function emptyState(ic, title, sub, action = '') {
  return `<div class="empty"><div class="em-ic">${ic}</div><div style="font-weight:700;color:var(--ink)">${esc(title)}</div>
    ${sub ? `<div class="small mt">${esc(sub)}</div>` : ''}${action ? `<div class="mt-2">${action}</div>` : ''}</div>`;
}

export function switchRow(label, name, checked, hint = '') {
  return `<label class="row between" style="gap:14px;padding:8px 0">
    <span><b style="font-size:.84rem">${esc(label)}</b>${hint ? `<div class="hint">${esc(hint)}</div>` : ''}</span>
    <span class="switch"><input type="checkbox" name="${esc(name)}" ${checked ? 'checked' : ''}><i></i></span>
  </label>`;
}

export function topbarNote(text) {
  return `<div class="note-band"><span>${icon('info', 15)}</span><span>${text}</span></div>`;
}

export const FIRST_PASS_NOTE = () => bi(
  'First pass = you have studied everything once. Mastery comes from revision, testing and error correction in Phase 2. Completing Phase 1 does not guarantee exam readiness.',
  'প্রথম পাস = সবকিছু একবার পড়া হয়ে গেছে। দক্ষতা আসে Phase 2-এর রিভিশন, টেস্ট ও ভুল সংশোধন থেকে। Phase 1 শেষ হলেই পরীক্ষার প্রস্তুতি হয়ে যায় না।'
);

export const EXAM_PATTERN_WARNING = () => bi(
  '⚠ Please confirm these values from the latest NTA Information Bulletin before relying on them.',
  '⚠ নির্ভর করার আগে সর্বশেষ NTA Information Bulletin থেকে এই মানগুলো যাচাই করুন।'
);

export function monthGrid(year, month /* 1-12 */, cellFn) {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay(); // Sun=0
  const days = new Date(year, month, 0).getDate();
  let out = '<div class="cal-head">' +
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div>${d}</div>`).join('') + '</div><div class="cal-grid">';
  for (let i = 0; i < startPad; i++) out += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= days; d++) out += cellFn(d);
  out += '</div>';
  return out;
}

export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) { /* noop */ }
  ta.remove();
  return Promise.resolve();
}
