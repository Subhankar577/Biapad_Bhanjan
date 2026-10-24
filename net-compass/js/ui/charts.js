/* Lightweight hand-rolled SVG charts (no chart library → works offline). */
import { esc, bi } from './dom.js';

const NS = (n) => Number(n).toFixed(1);

export function lineChart({ series = [], labels = [], height = 150, yMax = null, target = null, yLabel = '' }) {
  const W = 340, H = height, padL = 26, padR = 8, padT = 10, padB = labels.length ? 20 : 8;
  const all = series.flatMap((s) => s.values.filter((v) => v != null));
  const max = yMax != null ? yMax : Math.max(1, ...all) * 1.15;
  const n = Math.max(1, ...series.map((s) => s.values.length));
  const x = (i) => padL + (n === 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - Math.max(0, Math.min(1, v / max))) * (H - padT - padB);
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const yy = padT + f * (H - padT - padB);
    return `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${NS(yy)}" y2="${NS(yy)}"/>
      <text class="axis-lbl" x="2" y="${NS(yy + 3)}">${Math.round(max * (1 - f))}</text>`;
  }).join('');
  const paths = series.map((s, si) => {
    const vals = s.values;
    if (vals.length === 0) return '';
    let d = '';
    vals.forEach((v, i) => {
      if (v == null) return;
      d += `${d ? 'L' : 'M'}${NS(x(i))},${NS(y(v))} `;
    });
    const area = `${d}L${NS(x(vals.length - 1))},${NS(y(0))} L${NS(x(0))},${NS(y(0))} Z`;
    const pts = vals.map((v, i) => v == null ? '' : `<circle class="pt" cx="${NS(x(i))}" cy="${NS(y(v))}" r="2.4" style="stroke:${s.color || 'var(--brand)'}"/>`).join('');
    return `${si === 0 && s.area !== false ? `<path class="area" d="${area}" style="fill:${s.color || 'var(--brand)'};opacity:.10"/>` : ''}
      <path d="${d}" style="fill:none;stroke:${s.color || 'var(--brand)'};stroke-width:${s.width || 2.3};stroke-linecap:round;stroke-linejoin:round;${s.dash ? 'stroke-dasharray:4 4;' : ''}"/>${pts}`;
  }).join('');
  const targetLine = target != null ? `<line x1="${padL}" x2="${W - padR}" y1="${NS(y(target))}" y2="${NS(y(target))}" style="stroke:var(--gold);stroke-width:1.3;stroke-dasharray:5 4"/>
    <text class="axis-lbl" x="${W - padR}" y="${NS(y(target) - 3)}" text-anchor="end" style="fill:var(--gold)">${esc(target)}</text>` : '';
  const labs = labels.length
    ? labels.map((l, i) => (i % Math.ceil(labels.length / 5) === 0 || i === labels.length - 1)
      ? `<text class="axis-lbl" x="${NS(x(i))}" y="${H - 4}" text-anchor="middle">${esc(l)}</text>` : '').join('')
    : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(yLabel || 'chart')}" style="width:100%;height:${H}px">
    ${gridLines}${targetLine}${paths}${labs}
  </svg>`;
}

export function barChart({ values = [], labels = [], height = 130, color = 'var(--brand)' }) {
  const W = 340, H = height, padL = 24, padB = labels.length ? 20 : 6, padT = 8, padR = 4;
  const max = Math.max(1, ...values);
  const bw = (W - padL - padR) / Math.max(1, values.length);
  const bars = values.map((v, i) => {
    const h = (v / max) * (H - padT - padB);
    return `<rect x="${NS(padL + i * bw + bw * 0.16)}" y="${NS(H - padB - h)}" width="${NS(bw * 0.68)}" height="${NS(Math.max(0, h))}" rx="3" style="fill:${color}"/>
      ${labels[i] ? `<text class="axis-lbl" x="${NS(padL + i * bw + bw / 2)}" y="${H - 5}" text-anchor="middle">${esc(labels[i])}</text>` : ''}`;
  }).join('');
  const grid = [0, 0.5, 1].map((f) => {
    const yy = padT + (1 - f) * (H - padT - padB);
    return `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${NS(yy)}" y2="${NS(yy)}"/>
      <text class="axis-lbl" x="2" y="${NS(yy + 3)}">${Math.round(max * f)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px" role="img">${grid}${bars}</svg>`;
}

export function donut(items, size = 140) {
  const total = items.reduce((s, i) => s + (i.value || 0), 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = items.map((it) => {
    const frac = (it.value || 0) / total;
    const dash = frac * c;
    const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${it.color}" stroke-width="16"
      stroke-dasharray="${NS(dash)} ${NS(c - dash)}" stroke-dashoffset="${NS(-acc)}" transform="rotate(-90 70 70)"
      stroke-linecap="butt"><title>${esc(it.label)}: ${it.value}</title></circle>`;
    acc += dash;
    return seg;
  }).join('');
  return `<div class="row" style="gap:16px;flex-wrap:wrap;align-items:center">
    <svg viewBox="0 0 140 140" width="${size}" height="${size}" role="img">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="16"/>
      ${arcs}
      <text x="70" y="66" text-anchor="middle" style="font-size:17px;font-weight:800;fill:var(--ink)">${total}</text>
      <text x="70" y="82" text-anchor="middle" style="font-size:8px;fill:var(--muted);letter-spacing:.08em">TOTAL</text>
    </svg>
    <div class="col" style="gap:5px;font-size:.74rem">${items.map((i) => `<div class="row" style="gap:7px">
      <i style="width:9px;height:9px;border-radius:3px;background:${i.color};display:inline-block"></i>
      <span style="flex:1">${esc(i.label)}</span><b style="font-variant-numeric:tabular-nums">${i.value}</b></div>`).join('')}</div>
  </div>`;
}

export function heatmap({ weeks = [], max = 180, onCell = null, legend = true }) {
  // weeks: array of arrays of {key, minutes, out}
  const cols = weeks.map((week) => `<div class="heat-col">${week.map((d) => {
    if (!d) return '<div class="heat-cell off"></div>';
    const ratio = d.minutes / (max || 180);
    const lvl = d.minutes <= 0 ? '' : ratio < 0.3 ? 'l1' : ratio < 0.6 ? 'l2' : ratio < 0.9 ? 'l3' : 'l4';
    return `<div class="heat-cell ${lvl} ${d.out ? 'off' : ''}" data-heat="${esc(d.key)}" title="${esc(d.key)} · ${d.minutes} min"></div>`;
  }).join('')}</div>`).join('');
  return `<div class="heat" role="img" aria-label="${esc(bi('Study heatmap', 'স্টাডি হিটম্যাপ'))}">${cols}</div>
    ${legend ? `<div class="row" style="gap:6px;margin-top:8px;font-size:.64rem;color:var(--muted)">
      <span>${esc(bi('less', 'কম'))}</span>
      <span class="heat-cell"></span><span class="heat-cell l1"></span><span class="heat-cell l2"></span><span class="heat-cell l3"></span><span class="heat-cell l4"></span>
      <span>${esc(bi('more', 'বেশি'))}</span></div>` : ''}`;
}
