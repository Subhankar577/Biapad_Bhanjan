import { defaultState } from '../js/store.js';
import { rebuildPlan, buildTimeline, dayNet, dayNumber, keyForDay, backlogItems, sessionPlanIndex, overallProgress, weekday, todayKey, TOTAL_DAYS, generatePlan } from '../js/engine.js';

function mk(start = '2026-01-05') {
  const s = defaultState();
  s.profile.startDate = start;
  return s;
}

// 1. generate
const st = mk();
const t0 = Date.now();
rebuildPlan(st);
console.log('gen ms', Date.now() - t0);
const days = st.plan.days;
const keys = Object.keys(days).sort();
console.log('days generated', keys.length, 'first', keys[0], 'last', keys[keys.length - 1]);

// 2. day 1 orientation
console.log('day1', days['2026-01-05'].t, 'day2', days['2026-01-06'].t, weekday('2026-01-06'));

// 3. timelines: every weekday activity minutes == available net
let bad = 0, empty = 0;
for (const k of keys) {
  const tl = buildTimeline(st, k);
  const actMin = tl.rows.filter(r => r.kind === 'act').reduce((s, r) => s + r.minutes, 0);
  const net = dayNet(st, k);
  const want = Math.min(net, tl.tpl.total);
  if (actMin !== want) { bad++; if (bad < 4) console.log('MISMATCH', k, days[k].t, actMin, want, 'leftover', tl.leftover); }
  if (tl.leftover > 0) { empty++; if (empty < 4) console.log('LEFTOVER', k, days[k].t, tl.leftover); }
}
console.log('timeline mismatches', bad, 'leftovers', empty);

// 4. where does the new-session queue end?
const idx = sessionPlanIndex(st);
const planned = Object.values(idx).filter(v => v.template !== 'G' && v.template !== 'GSAT');
const dates = Object.keys(idx).sort();
console.log('sessions planned', Object.keys(idx).length);
const lastSessionDate = Object.keys(idx).sort().pop();
console.log('last session planned', lastSessionDate, 'day', dayNumber(st.profile.startDate, lastSessionDate));
const byType = {};
keys.forEach(k => { const t = days[k].t; byType[t] = (byType[t] || 0) + 1; });
console.log(byType);

// 5. rest day shift
st.restDays = ['2026-01-14'];
const st2 = mk(); st2.restDays = ['2026-01-14']; rebuildPlan(st2);
console.log('rest day 2026-01-14 ->', st2.plan.days['2026-01-14'].t, 'day15', st2.plan.days['2026-01-15'].t);

// 6. low-time mode: 90 min windows
const st3 = mk();
st3.profile.studyWindows = { 0: [{start:'05:30',end:'07:10'}],1:[{start:'05:30',end:'07:10'}],2:[{start:'05:30',end:'07:10'}],3:[{start:'05:30',end:'07:10'}],4:[{start:'05:30',end:'07:10'}],5:[{start:'05:30',end:'07:10'}],6:[{start:'05:30',end:'07:10'}]};
rebuildPlan(st3);
const tl3 = buildTimeline(st3, '2026-01-07');
console.log('lowtime net', dayNet(st3,'2026-01-07'), 'actmin', tl3.rows.filter(r=>r.kind==='act').reduce((s,r)=>s+r.minutes,0), 'compressed', tl3.compressed, 'deficit', tl3.deficit);
console.log(tl3.rows.slice(0,8).map(r => `${r.startStr}-${r.endStr} ${r.kind === 'act' ? r.act.id : r.kind} ${r.minutes}`).join('\n'));

// 7. backlog
st3.profile.startDate = '2026-01-05';
const stB = mk('2025-11-24');
rebuildPlan(stB);
console.log('backlog items', backlogItems(stB).length, 'progress', overallProgress(stB));
console.log('phase2 sample', days['2027-01-06']?.t, days['2027-06-01']?.t, days['2027-12-20']?.t);
