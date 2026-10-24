/* =========================================================================
   NET Compass — engine
   Date math, study-window net-time maths, the day templates, the minute
   accurate timeline builder, the 730-day plan generator, backlog / re-plan,
   spaced revision and the move-on gate.
   Pure functions only: everything takes `state` and returns data.
   ========================================================================= */

import { cloneSyllabus, orderedUnits, findCluster, findUnit, PAPER_II_ORDER } from './data/syllabus.js';

export const MAX_NET = 180;
export const PHASE1_DAYS = 365;
export const TOTAL_DAYS = 730;
export const BREAK_AFTER = 55;
export const BREAK_LEN = 5;

/* ------------------------------------------------------------------ dates */
export function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}
export function todayKey() { return toKey(new Date()); }
export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}
export function diffDays(a, b) { // b - a in days
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}
export function weekday(key) { return parseKey(key).getDay(); } // 0 Sun .. 6 Sat
export function dayNumber(startKey, key) { return diffDays(startKey, key) + 1; }
export function keyForDay(startKey, n) { return addDays(startKey, n - 1); }
export function monthKey(key) { return String(key).slice(0, 7); }
export function isLastSundayOfMonth(key) {
  if (weekday(key) !== 0) return false;
  return parseKey(addDays(key, 7)).getMonth() !== parseKey(key).getMonth();
}
export function prettyDate(key, lang = 'en') {
  const d = parseKey(key);
  return d.toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}
export function longDate(key, lang = 'en') {
  const d = parseKey(key);
  return d.toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
export function monthLabel(ym, lang = 'en') {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    month: 'long', year: 'numeric'
  });
}
export function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

/* ------------------------------------------------------------------- time */
export function tMin(hhmm) {
  if (typeof hhmm === 'number') return hhmm;
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
export function tStr(min, fmt = '12') {
  let m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (fmt === '24') return `${String(h).padStart(2, '0')}:${mm}`;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ap}`;
}
export function rangeStr(a, b, fmt = '12') { return `${tStr(a, fmt)} – ${tStr(b, fmt)}`; }

/* --------------------------------------------------------------- windows */
export function grossOf(w) { return Math.max(0, tMin(w.end) - tMin(w.start)); }
export function netOfGross(gross) {
  if (gross <= 0) return 0;
  return gross - BREAK_LEN * Math.floor(gross / 60);
}
export function windowsFor(state, key) {
  const wd = weekday(key);
  const byDay = (state.profile.studyWindows || {})[wd] || (state.profile.studyWindows || {})[String(wd)];
  return (byDay || []).slice().sort((a, b) => tMin(a.start) - tMin(b.start));
}
export function dayNet(state, key) {
  return Math.min(MAX_NET, windowsFor(state, key).reduce((s, w) => s + netOfGross(grossOf(w)), 0));
}
export function maxDailyNet(state) {
  let mx = 0;
  for (let d = 0; d < 7; d++) {
    const ws = (state.profile.studyWindows || {})[d] || [];
    mx = Math.max(mx, ws.reduce((s, w) => s + netOfGross(grossOf(w)), 0));
  }
  return mx;
}

/* ------------------------------------------------------------- templates */
const A = (en, bn) => ({ en, bn });

export const TEMPLATES = {
  A: {
    key: 'A', type: 'learn', total: 180,
    name: A('Standard learn day', 'সাধারণ লার্ন ডে'),
    acts: [
      { id: 'recall', cat: 'recall', mins: 10, icon: '🔁', title: A('Recall', 'রিকল'),
        sub: A('Spaced repetition: due flashcards + yesterday', 'স্পেসড রিপিটিশন: আজকের ফ্ল্যাশকার্ড + গতকালের টপিক'),
        detail: A('Open the flashcards due today and go through them. Then, without notes, say out loud the 5 key points of yesterday\u2019s topic.',
          'আজ যে ফ্ল্যাশকার্ডগুলো দিতে হবে সেগুলো দেখো। তারপর নোট না দেখে গতকালের টপিকের ৫টি মূল পয়েন্ট জোরে বলো।') },
      { id: 'learn', cat: 'learn', mins: 70, icon: '🎥', title: A('Learn', 'শেখা'),
        sub: A('Video 40\u2032 → Reading 20\u2032 → Doubt list 10\u2032', 'ভিডিও ৪০′ → পড়া ২০′ → ডাউট লিস্ট ১০′'),
        steps: [
          { label: A('Video lecture at 1.25×–1.5×', 'ভিডিও লেকচার ১.২৫×–১.৫× গতিতে'), mins: 40 },
          { label: A('Text / reference reading', 'টেক্সট / রেফারেন্স পড়া'), mins: 20 },
          { label: A('Write your doubt list', 'ডাউট লিস্ট লেখা'), mins: 10 }
        ],
        detail: A('Watch once, actively: pause and write. Do not rewind for every small thing — note the timestamp in your doubt list instead.',
          'একবার দেখো, মন দিয়ে: থামিয়ে থামিয়ে লেখো। ছোট ছোট জিনিসে বারবার পিছিয়ে যেয়ো না — ডাউট লিস্টে টাইমস্ট্যাম্প লিখে রাখো।') },
      { id: 'notes', cat: 'notes', mins: 35, icon: '📝', title: A('Notes', 'নোট'),
        sub: A('Cornell notes + 5 flashcards + formula box', 'কর্নেল নোট + ৫টি ফ্ল্যাশকার্ড + ফর্মুলা বক্স'),
        detail: A('Left column = cue words/questions. Right = detailed notes. Bottom = a 3-line summary. Fill the definition/formula box and add 5 flashcards.',
          'বাঁ কলাম = কিউ ওয়ার্ড/প্রশ্ন। ডান = বিস্তারিত নোট। নিচে = ৩ লাইনের সারসংক্ষেপ। ডেফিনিশন/ফর্মুলা বক্স ভরো এবং ৫টি ফ্ল্যাশকার্ড যোগ করো।') },
      { id: 'practice', cat: 'practice', mins: 35, icon: '✍️', title: A('Practice', 'প্র্যাকটিস'),
        sub: A('MCQs at the topic\u2019s depth level', 'টপিকের ডেপথ অনুযায়ী MCQ'),
        detail: A('Official NTA PYQs first, then topic MCQs. Log attempted / correct / time in the session card.',
          'আগে অফিসিয়াল NTA PYQ, তারপর টপিক MCQ। সেশন কার্ডে attempted / correct / সময় লিখে রাখো।') },
      { id: 'review', cat: 'review', mins: 20, icon: '🧠', title: A('Review', 'রিভিউ'),
        sub: A('Mistake analysis + 3-question self-test', 'ভুল বিশ্লেষণ + ৩ প্রশ্নের সেলফ-টেস্ট'),
        detail: A('Re-work every wrong MCQ and name the reason. Then do the self-test in the session card: explain aloud, list 5 terms, draw the diagram.',
          'প্রতিটি ভুল MCQ আবার করো এবং কারণ চিহ্নিত করো। তারপর কার্ডের সেলফ-টেস্ট: জোরে ব্যাখ্যা, ৫টি টার্ম, ডায়াগ্রাম আঁকো।') },
      { id: 'log', cat: 'log', mins: 10, icon: '✅', title: A('Log', 'লগ'),
        sub: A('Completion, confidence 1–5, preview tomorrow', 'সম্পন্ন, কনফিডেন্স ১–৫, কালকের প্রিভিউ'),
        detail: A('Tick the checklist, rate confidence, and glance at tomorrow\u2019s topic. On a cluster\u2019s last session the Move-on Gate appears here.',
          'চেকলিস্ট টিক দাও, কনফিডেন্স রেট করো, কালকের টপিক দেখে নাও। ক্লাস্টারের শেষ সেশনে এখানে মুভ-অন গেট আসবে।') }
    ]
  },
  B: {
    key: 'B', type: 'learn', total: 180,
    name: A('Coaching-overlap day', 'কোচিং-ওভারল্যাপ ডে'),
    acts: [
      { id: 'recall', cat: 'recall', mins: 10, icon: '🔁', title: A('Recall', 'রিকল'),
        sub: A('Spaced repetition items due today', 'আজকের স্পেসড রিপিটিশন'),
        detail: A('Flashcards due today, then a 2-minute verbal recall of the coaching topic before you open anything.',
          'আজকের ফ্ল্যাশকার্ড, তারপর কিছু খোলার আগে কোচিং টপিকের ২ মিনিটের মৌখিক রিকল।') },
      { id: 'consolidate', cat: 'learn', mins: 25, icon: '🧾', title: A('Consolidate', 'কনসোলিডেট'),
        sub: A('Re-read & organise coaching class notes', 'কোচিং ক্লাসের নোট গুছিয়ে পড়া'),
        detail: A('Coaching covered the concept — so do NOT re-watch the full lecture. Clean up your class notes and mark what is unclear.',
          'কোচিং কনসেপ্ট কভার করেছে — তাই পুরো লেকচার আবার দেখো না। ক্লাস নোট পরিষ্কার করো, অস্পষ্ট জায়গা দাগাও।') },
      { id: 'gapfill', cat: 'learn', mins: 30, icon: '🧩', title: A('Gap-fill', 'গ্যাপ-ফিল'),
        sub: A('Study only what coaching skipped (by depth tag)', 'কোচিং যা বাদ দিয়েছে শুধু সেটাই (ডেপথ অনুযায়ী)'),
        detail: A('Check the syllabus key terms for this cluster against your coaching notes. Fill only the missing pieces; stop when the key terms are covered.',
          'এই ক্লাস্টারের সিলেবাস টার্মের সাথে কোচিং নোট মিলাও। শুধু বাদ পড়া অংশ ভরো; কী-টার্ম কভার হলে থামো।') },
      { id: 'conceptmap', cat: 'notes', mins: 15, icon: '🕸️', title: A('Concept map', 'কনসেপ্ট ম্যাপ'),
        sub: A('Connections + questions for next class', 'সংযোগ + পরের ক্লাসের প্রশ্ন'),
        detail: A('Draw the topic map on one page and write 3 questions to ask your coaching teacher.',
          'এক পাতায় টপিক ম্যাপ আঁকো এবং শিক্ষককে জিজ্ঞাসা করার ৩টি প্রশ্ন লেখো।') },
      { id: 'notes', cat: 'notes', mins: 25, icon: '📝', title: A('Notes', 'নোট'),
        sub: A('One-page merged summary + 5 flashcards', 'এক পাতার সামারি + ৫ ফ্ল্যাশকার্ড'),
        detail: A('Merge coaching + self-study into one page. Add 5 flashcards.', 'কোচিং + সেলফ-স্টাডি এক পাতায় মেলাও। ৫টি ফ্ল্যাশকার্ড যোগ করো।') },
      { id: 'practice', cat: 'practice', mins: 55, icon: '✍️', title: A('Practice', 'প্র্যাকটিস'),
        sub: A('Deeper MCQ practice (extra time here)', 'গভীর MCQ প্র্যাকটিস (বেশি সময় এখানে)'),
        detail: A('Because learning was partly done in class, spend the saved time on more MCQs and numericals at this depth level.',
          'শেখার কিছুটা ক্লাসে হয়েছে, তাই বাঁচানো সময় বেশি MCQ ও সংখ্যাগত প্রশ্নে দাও।') },
      { id: 'review', cat: 'review', mins: 15, icon: '🧠', title: A('Review', 'রিভিউ'),
        sub: A('Mistake review + mini self-test', 'ভুল রিভিউ + মিনি সেলফ-টেস্ট'),
        detail: A('Analyse wrong answers and do a 3-question self-test.', 'ভুল উত্তর বিশ্লেষণ করো এবং ৩ প্রশ্নের সেলফ-টেস্ট করো।') },
      { id: 'log', cat: 'log', mins: 5, icon: '✅', title: A('Log', 'লগ'),
        sub: A('Completion + confidence', 'সম্পন্ন + কনফিডেন্স'),
        detail: A('Tick the checklist and rate confidence.', 'চেকলিস্ট টিক দাও ও কনফিডেন্স রেট করো।') }
    ]
  },
  C: {
    key: 'C', type: 'pyq', total: 180,
    name: A('PYQ + backlog day', 'PYQ + ব্যাকলগ ডে'),
    acts: [
      { id: 'topic_pyq', cat: 'practice', mins: 60, icon: '📄', title: A('Topic PYQs', 'টপিক PYQ'),
        sub: A('This week\u2019s topics — ~40\u2032 Paper II + ~20\u2032 Paper I', 'এই সপ্তাহের টপিক — ~৪০′ পত্র II + ~২০′ পত্র I'),
        detail: A('Solve previous-year questions topic-wise, timed. Mark guesses so the error analysis stays honest.',
          'আগের বছরের প্রশ্ন টপিক অনুযায়ী সময় ধরে করো। অনুমানে করা প্রশ্ন আলাদা মার্ক করো।') },
      { id: 'error_analysis', cat: 'review', mins: 30, icon: '🔍', title: A('Error analysis', 'ভুল বিশ্লেষণ'),
        sub: A('Concept gap / silly / time / guess / misread', 'কনসেপ্ট গ্যাপ / ভুল / সময় / অনুমান / ভুল পড়া'),
        detail: A('For every wrong answer write the error type and add a line to the Error Notebook.',
          'প্রতিটি ভুল উত্তরের জন্য error type লেখো এবং Error Notebook-এ যোগ করো।') },
      { id: 'backlog', cat: 'practice', mins: 60, icon: '🧯', title: A('Backlog recovery', 'ব্যাকলগ রিকভারি'),
        sub: A('Fast mode: 1.5× video, 1-page notes, 10 MCQs', 'ফাস্ট মোড: ১.৫× ভিডিও, ১ পাতার নোট, ১০ MCQ'),
        detail: A('Maximum one full missed session per Saturday. If nothing is pending, use this block for extra PYQs.',
          'প্রতি শনিবার সর্বোচ্চ একটি বাদ পড়া সেশন। কিছু বাকি না থাকলে এই সময়ে বাড়তি PYQ করো।') },
      { id: 'weekly_revision', cat: 'recall', mins: 20, icon: '🔁', title: A('Weekly revision', 'সাপ্তাহিক রিভিউ'),
        sub: A('Spaced recall of items from 1 week ago', '১ সপ্তাহ আগের জিনিসের স্পেসড রিকল'),
        detail: A('Open the cluster notes from 7 days ago and test yourself before reading.', '৭ দিন আগের নোট খোলার আগে নিজেকে পরীক্ষা করো।') },
      { id: 'log', cat: 'log', mins: 10, icon: '✅', title: A('Log', 'লগ'),
        sub: A('Progress + backlog queue review', 'প্রোগ্রেস + ব্যাকলগ কিউ'),
        detail: A('Update progress and check what is still in the backlog queue.', 'প্রোগ্রেস আপডেট করো, ব্যাকলগে কী বাকি দেখো।') }
    ]
  },
  D: {
    key: 'D', type: 'revision', total: 180,
    name: A('Revision + weekly test day', 'রিভিশন + সাপ্তাহিক টেস্ট'),
    acts: [
      { id: 'cumulative_recall', cat: 'recall', mins: 20, icon: '🗂️', title: A('Cumulative recall', 'কিউমুলেটিভ রিকল'),
        sub: A('All due Leitner cards + topic → key points', 'সব ডিউ লাইটনার কার্ড + টপিক → কী পয়েন্ট'),
        detail: A('Clear all due flashcards, then pick 5 completed topics and say their key points from memory.',
          'সব ডিউ ফ্ল্যাশকার্ড শেষ করো, তারপর ৫টি টপিক বেছে নিয়ে মুখে মুখে কী পয়েন্ট বলো।') },
      { id: 'weekly_test', cat: 'test', mins: 60, icon: '⏱️', title: A('Weekly test', 'সাপ্তাহিক টেস্ট'),
        sub: A('30–40 MCQs, timed at 90 sec/Q', '৩০–৪০ MCQ, প্রতি প্রশ্নে ৯০ সেকেন্ড'),
        detail: A('Mix this week\u2019s topics with older ones. Log the test in the Tests screen (Paper I / II / Both).',
          'এই সপ্তাহের টপিকের সাথে পুরোনো টপিক মেলাও। Tests স্ক্রিনে টেস্ট লগ করো।') },
      { id: 'test_analysis', cat: 'review', mins: 40, icon: '🔬', title: A('Test analysis', 'টেস্ট বিশ্লেষণ'),
        sub: A('Every question + Error Notebook entries', 'প্রতিটি প্রশ্ন + Error Notebook এন্ট্রি'),
        detail: A('Review every question — including the lucky correct ones. Add concept gaps to the notebook.',
          'প্রতিটি প্রশ্ন রিভিউ করো — ভাগ্যক্রমে ঠিক হওয়াগুলোও। কনসেপ্ট গ্যাপ নোটবুকে যোগ করো।') },
      { id: 'weak_repair', cat: 'practice', mins: 40, icon: '🛠️', title: A('Weak-topic repair', 'দুর্বল টপিক মেরামত'),
        sub: A('Weakest topic of this week, from test data', 'টেস্ট ডেটা অনুযায়ী সপ্তাহের দুর্বলতম টপিক'),
        detail: A('Re-study the weakest cluster of the week: re-read notes, redo the MCQs that went wrong.',
          'সপ্তাহের দুর্বলতম ক্লাস্টার আবার পড়ো: নোট পড়ো, ভুল MCQ আবার করো।') },
      { id: 'planning', cat: 'log', mins: 20, icon: '🗓️', title: A('Planning', 'পরিকল্পনা'),
        sub: A('Flashcards from errors (10\u2032) + next week (10\u2032)', 'ভুল থেকে ফ্ল্যাশকার্ড (১০′) + পরের সপ্তাহ (১০′)'),
        detail: A('Create flashcards from this week\u2019s errors and preview next week\u2019s plan.',
          'এই সপ্তাহের ভুল থেকে ফ্ল্যাশকার্ড বানাও এবং পরের সপ্তাহের প্ল্যান দেখো।') }
    ]
  },
  E: {
    key: 'E', type: 'unit-closure', total: 180,
    name: A('Unit closure day', 'ইউনিট ক্লোজার ডে'),
    acts: [
      { id: 'unit_test', cat: 'test', mins: 45, icon: '🧪', title: A('Unit test', 'ইউনিট টেস্ট'),
        sub: A('All clusters, mixed difficulty, timed', 'সব ক্লাস্টার, মিশ্র কঠিনতা, সময় ধরে'),
        detail: A('Full unit test from already-studied clusters only.', 'শুধু পড়া হয়ে যাওয়া ক্লাস্টার থেকে পুরো ইউনিট টেস্ট।') },
      { id: 'analysis', cat: 'review', mins: 40, icon: '📊', title: A('Analysis', 'বিশ্লেষণ'),
        sub: A('Results broken down by cluster', 'ক্লাস্টার অনুযায়ী ফলাফল'),
        detail: A('Make a cluster-wise accuracy table; rank clusters weakest first.', 'ক্লাস্টার অনুযায়ী অ্যাকুরেসি টেবিল বানাও; দুর্বল আগে।') },
      { id: 'relearn', cat: 'practice', mins: 50, icon: '🛠️', title: A('Re-learn', 'রি-লার্ন'),
        sub: A('2–3 weakest clusters', '২–৩টি দুর্বলতম ক্লাস্টার'),
        detail: A('Re-study only the weakest clusters; redo their MCQs.', 'শুধু দুর্বলতম ক্লাস্টার আবার পড়ো; MCQ আবার করো।') },
      { id: 'summary', cat: 'notes', mins: 30, icon: '🗺️', title: A('Summary', 'সারসংক্ষেপ'),
        sub: A('One-page unit summary / concept map / formula sheet', 'এক পাতার ইউনিট সামারি / ম্যাপ / ফর্মুলা শিট'),
        detail: A('This sheet is what you will revise in Phase 2 — make it clean.', 'Phase 2-এ এই শিটই রিভিশন হবে — পরিষ্কার বানাও।') },
      { id: 'rating', cat: 'log', mins: 15, icon: '⭐', title: A('Rating', 'রেটিং'),
        sub: A('Unit confidence + preview next unit', 'ইউনিট কনফিডেন্স + পরের ইউনিট'),
        detail: A('Rate the unit 1–5, log completion and preview the next unit\u2019s first cluster.',
          'ইউনিট ১–৫ রেট করো, সম্পন্ন লগ করো, পরের ইউনিটের প্রথম ক্লাস্টার দেখো।') }
    ]
  },
  F: {
    key: 'F', type: 'monthly', total: 180,
    name: A('Monthly checkpoint', 'মাসিক চেকপয়েন্ট'),
    acts: [
      { id: 'mixed_test', cat: 'test', mins: 90, icon: '🧮', title: A('Mixed test', 'মিশ্র টেস্ট'),
        sub: A('50–60 MCQs from all completed topics, timed', 'এখন পর্যন্ত সব টপিক থেকে ৫০–৬০ MCQ, সময় ধরে'),
        detail: A('Everything studied so far, both papers. Log it as a Part mock.', 'এখন পর্যন্ত সব, দুই পত্র মিলিয়ে। Part mock হিসেবে লগ করো।') },
      { id: 'analysis', cat: 'review', mins: 45, icon: '📊', title: A('Analysis', 'বিশ্লেষণ'),
        sub: A('Per-unit accuracy breakdown', 'ইউনিট অনুযায়ী অ্যাকুরেসি'),
        detail: A('Update the per-unit accuracy view; mark the single weakest area.', 'ইউনিটভিত্তিক অ্যাকুরেসি আপডেট করো; সবচেয়ে দুর্বল জায়গা চিহ্নিত করো।') },
      { id: 'repair', cat: 'practice', mins: 30, icon: '🛠️', title: A('Repair', 'মেরামত'),
        sub: A('The single weakest area from the test', 'টেস্টের সবচেয়ে দুর্বল জায়গা'),
        detail: A('Quick targeted repair, not a full re-study.', 'দ্রুত টার্গেটেড মেরামত, পুরো আবার পড়া নয়।') },
      { id: 'self_eval', cat: 'log', mins: 15, icon: '🧭', title: A('Self-evaluation', 'সেলফ-ইভ্যালুয়েশন'),
        sub: A('Monthly form: wins, gaps, next month', 'মাসিক ফর্ম: অর্জন, ঘাটতি, পরের মাস'),
        detail: A('Fill the monthly form in Analytics. Be specific — vague answers do not help.', 'Analytics-এ মাসিক ফর্ম ভরো। নির্দিষ্ট লেখো — অস্পষ্ট উত্তর কাজে আসে না।') }
    ]
  },
  G: {
    key: 'G', type: 'consolidation', total: 180,
    name: A('Consolidation day', 'কনসোলিডেশন ডে'),
    acts: [
      { id: 'recall', cat: 'recall', mins: 15, icon: '🔁', title: A('Recall', 'রিকল'),
        sub: A('Spaced repetition (many items by now)', 'স্পেসড রিপিটিশন (এখন অনেক জমেছে)'),
        detail: A('Clear the due queue first.', 'আগে ডিউ কিউ শেষ করো।') },
      { id: 'rapid_review', cat: 'learn', mins: 45, icon: '⚡', title: A('Rapid review', 'দ্রুত রিভিউ'),
        sub: A('One-page notes of 2–3 clusters', '২–৩টি ক্লাস্টারের এক পাতার নোট'),
        detail: A('Read only your own one-page notes and redraw concept maps.', 'শুধু নিজের এক পাতার নোট পড়ো, কনসেপ্ট ম্যাপ আবার আঁকো।') },
      { id: 'pyq_drill', cat: 'practice', mins: 60, icon: '📄', title: A('PYQ drill', 'PYQ ড্রিল'),
        sub: A('Weak units first (by confidence)', 'দুর্বল ইউনিট আগে (কনফিডেন্স অনুযায়ী)'),
        detail: A('Choose units with low confidence/accuracy and do topic-wise PYQs.',
          'কম কনফিডেন্স/অ্যাকুরেসির ইউনিট বেছে নিয়ে টপিকভিত্তিক PYQ করো।') },
      { id: 'error_repair', cat: 'review', mins: 40, icon: '🛠️', title: A('Error repair', 'ভুল মেরামত'),
        sub: A('Concepts from the Error Notebook', 'Error Notebook-এর কনসেপ্ট'),
        detail: A('Pick open errors, re-study the concept, mark them re-tested when you solve one fresh MCQ.',
          'খোলা ভুল বেছে নিয়ে কনসেপ্ট আবার পড়ো, নতুন MCQ ঠিক করলে re-tested মার্ক করো।') },
      { id: 'speed_drill', cat: 'practice', mins: 15, icon: '🏃', title: A('Speed drill', 'স্পিড ড্রিল'),
        sub: A('10 mixed MCQs at 72 sec/Q', '১০টি মিশ্র MCQ, ৭২ সেকেন্ড/প্রশ্ন'),
        detail: A('Strict timer. Accuracy under speed is the goal.', 'কঠোর টাইমার। গতির সাথে অ্যাকুরেসিই লক্ষ্য।') },
      { id: 'log', cat: 'log', mins: 5, icon: '✅', title: A('Log', 'লগ'),
        sub: A('Minutes + confidence', 'মিনিট + কনফিডেন্স'),
        detail: A('Log the day.', 'দিনটি লগ করো।') }
    ]
  },
  GSAT: {
    key: 'GSAT', type: 'consolidation', total: 180,
    name: A('Paper II part mock', 'পত্র II পার্ট মক'),
    acts: [
      { id: 'mock_p2', cat: 'test', mins: 120, icon: '🧪', title: A('Paper II mock', 'পত্র II মক'),
        sub: A('100 Q / 120 min, strict conditions', '১০০ প্রশ্ন / ১২০ মিনিট, কঠোর পরিবেশ'),
        detail: A('Phone away, single sitting, no notes. Log the score in Tests.', 'ফোন দূরে, এক বসায়, নোট ছাড়া। Tests-এ স্কোর লগ করো।') },
      { id: 'analysis', cat: 'review', mins: 60, icon: '🔬', title: A('Analysis', 'বিশ্লেষণ'),
        sub: A('Every question + error types', 'প্রতিটি প্রশ্ন + error type'),
        detail: A('Analyse by unit and by error type; add concept gaps to the notebook.', 'ইউনিট ও error type অনুযায়ী বিশ্লেষণ করো; নোটবুকে যোগ করো।') }
    ]
  },
  GSUN: {
    key: 'GSUN', type: 'consolidation', total: 180,
    name: A('Paper I part mock', 'পত্র I পার্ট মক'),
    acts: [
      { id: 'mock_p1', cat: 'test', mins: 60, icon: '🧪', title: A('Paper I mock', 'পত্র I মক'),
        sub: A('50 Q / 60 min, strict conditions', '৫০ প্রশ্ন / ৬০ মিনিট, কঠোর পরিবেশ'),
        detail: A('Full Paper I simulation. Log it in Tests.', 'পুরো পত্র I সিমুলেশন। Tests-এ লগ করো।') },
      { id: 'analysis', cat: 'review', mins: 60, icon: '🔬', title: A('Analysis', 'বিশ্লেষণ'),
        sub: A('Unit-wise accuracy + error notebook', 'ইউনিট অনুযায়ী অ্যাকুরেসি + নোটবুক'),
        detail: A('Review all questions, update errors.', 'সব প্রশ্ন রিভিউ করো, ভুল আপডেট করো।') },
      { id: 'repair', cat: 'practice', mins: 60, icon: '🛠️', title: A('Repair', 'মেরামত'),
        sub: A('Two weakest Paper I units', 'পত্র I-এর দুই দুর্বলতম ইউনিট'),
        detail: A('Re-read notes and do 20 MCQs across the two weakest units.', 'নোট পড়ো এবং দুই দুর্বল ইউনিটে ২০ MCQ করো।') }
    ]
  },
  H: { key: 'H', type: 'rest', total: 0, name: A('Rest day', 'বিশ্রামের দিন'), acts: [] },
  ORIENT: {
    key: 'ORIENT', type: 'orientation', total: 180,
    name: A('Orientation & baseline day', 'ওরিয়েন্টেশন ও বেসলাইন ডে'),
    acts: [
      { id: 'folders', cat: 'setup', mins: 30, icon: '📁', title: A('Set up study folders', 'স্টাডি ফোল্ডার সেটআপ'),
        sub: A('Use the Folder Helper structure', 'ফোল্ডার হেল্পার স্ট্রাকচার ব্যবহার করো'),
        detail: A('Create the NET_Compass folder tree on your laptop/phone and one Resources.txt per unit.',
          'ল্যাপটপ/ফোনে NET_Compass ফোল্ডার ট্রি বানাও, প্রতি ইউনিটে একটি Resources.txt।') },
      { id: 'syllabus', cat: 'learn', mins: 40, icon: '📖', title: A('Read the official syllabus', 'অফিসিয়াল সিলেবাস পড়া'),
        sub: A('Both papers, unit by unit — no studying yet', 'দুই পত্র, ইউনিট ধরে — এখন পড়া নয়'),
        detail: A('Read the official UGC NET syllabus PDF and compare it with the Syllabus tab. Flag anything that looks different.',
          'অফিসিয়াল UGC NET সিলেবাস PDF পড়ো এবং Syllabus ট্যাবের সাথে মিলাও। অমিল মনে হলে ফ্ল্যাগ করো।') },
      { id: 'diagnostic', cat: 'test', mins: 45, icon: '🧪', title: A('Diagnostic quiz (untimed)', 'ডায়াগনস্টিক কুইজ (সময় ছাড়া)'),
        sub: A('30 questions: 10 Paper I + 20 Paper II', '৩০ প্রশ্ন: ১০ পত্র I + ২০ পত্র II'),
        detail: A('Take any free 30-question mixed set. Do not worry about the score — this is only a baseline.',
          'যেকোনো ফ্রি ৩০ প্রশ্নের মিশ্র সেট নাও। স্কোর নিয়ে ভেবো না — এটি শুধু বেসলাইন।') },
      { id: 'familiarity', cat: 'recall', mins: 30, icon: '🌡️', title: A('Rate every unit 1–5', 'প্রতিটি ইউনিট ১–৫ রেট করো'),
        sub: A('Seeds your confidence ratings', 'এটি তোমার কনফিডেন্স রেটিং তৈরি করবে'),
        detail: A('Open Syllabus → each unit → rate familiarity. These ratings decide your Phase 2 priority.',
          'Syllabus → প্রতিটি ইউনিট → পরিচিতি রেট করো। এই রেটিং Phase 2-এর প্রায়োরিটি ঠিক করবে।') },
      { id: 'plan_review', cat: 'log', mins: 20, icon: '🧭', title: A('Review your plan', 'প্ল্যান রিভিউ'),
        sub: A('Study windows, coaching sync, weekly pattern', 'স্টাডি উইন্ডো, কোচিং সিঙ্ক, সাপ্তাহিক প্যাটার্ন'),
        detail: A('Check the Roadmap and adjust your study windows if they do not fit real life.',
          'রোডম্যাপ দেখো, বাস্তবের সাথে না মিললে স্টাডি উইন্ডো বদলাও।') },
      { id: 'log', cat: 'log', mins: 15, icon: '✅', title: A('Log', 'লগ'),
        sub: A('Mark Day 1 done', 'Day 1 সম্পন্ন মার্ক করো'),
        detail: A('Tick the checklist and set your first week intention.', 'চেকলিস্ট টিক দাও, প্রথম সপ্তাহের সংকল্প লেখো।') }
    ]
  },
  BUFFER: {
    key: 'BUFFER', type: 'buffer', total: 180,
    name: A('Buffer day — one more attempt', 'বাফার ডে — আরেকবার চেষ্টা'),
    acts: [
      { id: 'weak_review', cat: 'practice', mins: 60, icon: '🛠️', title: A('Review weak areas', 'দুর্বল জায়গা রিভিউ'),
        sub: A('Only what failed the gate', 'যা গেটে ফেল করেছে শুধু তা'),
        detail: A('Re-study the specific concepts that failed the gate. No full re-watch.', 'গেটে ফেল করা নির্দিষ্ট কনসেপ্ট আবার পড়ো। পুরো ভিডিও নয়।') },
      { id: 'practice', cat: 'practice', mins: 60, icon: '✍️', title: A('Practice', 'প্র্যাকটিস'),
        sub: A('30 MCQs on this cluster', 'এই ক্লাস্টারে ৩০ MCQ'),
        detail: A('20 topic MCQs + 10 mixed with earlier topics.', '২০টি টপিক MCQ + ১০টি আগের টপিকের সাথে মিশ্র।') },
      { id: 'retest', cat: 'test', mins: 40, icon: '🧪', title: A('Re-test', 'রি-টেস্ট'),
        sub: A('15 MCQs, timed', '১৫ MCQ, সময় ধরে'),
        detail: A('Treat it like the real exam.', 'আসল পরীক্ষার মতো করো।') },
      { id: 'gate', cat: 'log', mins: 20, icon: '🚪', title: A('Final gate', 'ফাইনাল গেট'),
        sub: A('Move-on gate, second attempt', 'মুভ-অন গেট, দ্বিতীয় চেষ্টা'),
        detail: A('Re-check the three gates. Pass 2 of 3 to move on.', 'তিনটি গেট আবার দেখো। ৩টির ২টি পার হলেই এগোও।') }
    ]
  },
  R2: {
    key: 'R2', type: 'revision-cycle', total: 180,
    name: A('Revision cycle 2 day', 'রিভিশন সাইকেল ২'),
    acts: [
      { id: 'recall', cat: 'recall', mins: 20, icon: '🔁', title: A('Recall', 'রিকল'),
        sub: A('Cluster flashcards + key points', 'ক্লাস্টার ফ্ল্যাশকার্ড + কী পয়েন্ট'),
        detail: A('Before opening notes, write everything you remember.', 'নোট খোলার আগে যা মনে আছে সব লেখো।') },
      { id: 'skim', cat: 'learn', mins: 50, icon: '⚡', title: A('Skim', 'স্কিম'),
        sub: A('D3 material + your notes only', 'D3 অংশ + শুধু নিজের নোট'),
        detail: A('Skim for gaps, do not re-learn from scratch.', 'ঘাটতি খোঁজো, শুরু থেকে আবার শিখো না।') },
      { id: 'pyq', cat: 'practice', mins: 60, icon: '📄', title: A('Topic PYQs', 'টপিক PYQ'),
        sub: A('All available years for this cluster', 'এই ক্লাস্টারের সব বছরের প্রশ্ন'),
        detail: A('Log accuracy in the session card.', 'সেশন কার্ডে অ্যাকুরেসি লগ করো।') },
      { id: 'errors', cat: 'review', mins: 30, icon: '🔍', title: A('Error analysis', 'ভুল বিশ্লেষণ'),
        sub: A('Notebook + new entries', 'নোটবুক + নতুন এন্ট্রি'),
        detail: A('Every mistake gets a type and a concept line.', 'প্রতিটি ভুলের type ও কনসেপ্ট লাইন লেখো।') },
      { id: 'drill', cat: 'practice', mins: 20, icon: '🏃', title: A('Weak drill', 'দুর্বল ড্রিল'),
        sub: A('10 quick MCQs on the weakest point', 'দুর্বলতম পয়েন্টে ১০টি দ্রুত MCQ'),
        detail: A('Finish with speed work on the weakest point.', 'দুর্বলতম পয়েন্টে গতির অনুশীলন দিয়ে শেষ করো।') }
    ]
  },
  PYQDEEP: {
    key: 'PYQDEEP', type: 'pyq-deep', total: 180,
    name: A('PYQ deep dive', 'PYQ ডিপ ডাইভ'),
    acts: [
      { id: 'pyq', cat: 'practice', mins: 90, icon: '📄', title: A('Topic-wise PYQs', 'টপিকভিত্তিক PYQ'),
        sub: A('All years, one unit', 'সব বছর, একটি ইউনিট'),
        detail: A('Solve in exam conditions, then mark the question types that repeat.', 'পরীক্ষার মতো করো, তারপর বারবার আসা প্রশ্নের ধরন চিহ্নিত করো।') },
      { id: 'analysis', cat: 'review', mins: 50, icon: '📊', title: A('Pattern analysis', 'প্যাটার্ন বিশ্লেষণ'),
        sub: A('Which question types repeat most?', 'কোন ধরনের প্রশ্ন বেশি আসে?'),
        detail: A('Make a one-line list of recurring question types for this unit.', 'এই ইউনিটে বারবার আসা প্রশ্নের ধরন এক লাইনে লেখো।') },
      { id: 'repair', cat: 'practice', mins: 40, icon: '🛠️', title: A('Repair', 'মেরামত'),
        sub: A('Concepts behind the misses', 'ভুলের পেছনের কনসেপ্ট'),
        detail: A('Fix the concepts, not the questions.', 'প্রশ্ন নয়, কনসেপ্ট ঠিক করো।') }
    ]
  },
  SEC: {
    key: 'SEC', type: 'sectional', total: 180,
    name: A('Sectional test day', 'সেকশনাল টেস্ট ডে'),
    acts: [
      { id: 'test', cat: 'test', mins: 90, icon: '🧪', title: A('Sectional test', 'সেকশনাল টেস্ট'),
        sub: A('One paper / one unit, timed', 'এক পত্র / এক ইউনিট, সময় ধরে'),
        detail: A('Log it in Tests with the unit selected.', 'Tests-এ ইউনিটসহ লগ করো।') },
      { id: 'analysis', cat: 'review', mins: 50, icon: '🔬', title: A('Analysis', 'বিশ্লেষণ'),
        sub: A('Every question, every guess', 'প্রতিটি প্রশ্ন, প্রতিটি অনুমান'),
        detail: A('Update the Error Notebook and per-unit accuracy.', 'Error Notebook ও ইউনিট অ্যাকুরেসি আপডেট করো।') },
      { id: 'repair', cat: 'practice', mins: 40, icon: '🛠️', title: A('Repair', 'মেরামত'),
        sub: A('Weakest cluster in the test', 'টেস্টের দুর্বলতম ক্লাস্টার'),
        detail: A('Targeted re-study + 10 MCQs.', 'টার্গেটেড রিভিশন + ১০ MCQ।') }
    ]
  },
  MOCK: {
    key: 'MOCK', type: 'mock', total: 180,
    name: A('Full mock simulation', 'পূর্ণ মক সিমুলেশন'),
    acts: [
      { id: 'full_mock', cat: 'test', mins: 180, icon: '🧪', title: A('Full mock', 'পূর্ণ মক'),
        sub: A('Paper I 60\u2032 + Paper II 120\u2032, 300 marks', 'পত্র I ৬০′ + পত্র II ১২০′, ৩০০ নম্বর'),
        detail: A('Real conditions, no breaks. Log the scores in Tests.', 'আসল পরিবেশ, বিরতি নয়। Tests-এ স্কোর লগ করো।') }
    ]
  },
  ANAL: {
    key: 'ANAL', type: 'analysis', total: 180,
    name: A('Mock analysis day', 'মক বিশ্লেষণ ডে'),
    acts: [
      { id: 'review', cat: 'review', mins: 90, icon: '🔬', title: A('Review every question', 'প্রতিটি প্রশ্ন রিভিউ'),
        sub: A('Even the ones you got right', 'ঠিক হওয়াগুলোও'),
        detail: A('Mark question type + error type for each miss.', 'প্রতিটি ভুলে প্রশ্নের ধরন + error type লেখো।') },
      { id: 'errors', cat: 'review', mins: 45, icon: '📓', title: A('Error Notebook', 'Error Notebook'),
        sub: A('Add and close entries', 'এন্ট্রি যোগ ও বন্ধ করা'),
        detail: A('Add new concept gaps; mark resolved entries that you re-tested.', 'নতুন কনসেপ্ট গ্যাপ যোগ করো; re-test করা এন্ট্রি resolved মার্ক করো।') },
      { id: 'patterns', cat: 'log', mins: 45, icon: '🧭', title: A('Patterns & next step', 'প্যাটার্ন ও পরবর্তী ধাপ'),
        sub: A('What repeats? What to fix first?', 'কী বারবার আসে? আগে কী ঠিক করবে?'),
        detail: A('Write 3 lines: repeated question types, biggest score leak, next action.', '৩ লাইন লেখো: বারবার আসা ধরন, বড় স্কোর লিক, পরবর্তী পদক্ষেপ।') }
    ]
  },
  FINAL: {
    key: 'FINAL', type: 'final', total: 180,
    name: A('Final revision day', 'ফাইনাল রিভিশন'),
    acts: [
      { id: 'notes', cat: 'learn', mins: 60, icon: '📚', title: A('Rapid notes review', 'দ্রুত নোট রিভিউ'),
        sub: A('One-page notes + formula sheets', 'এক পাতার নোট + ফর্মুলা শিট'),
        detail: A('Only your own condensed notes. No new material.', 'শুধু নিজের সংক্ষিপ্ত নোট। নতুন কিছু নয়।') },
      { id: 'flash', cat: 'recall', mins: 45, icon: '🃏', title: A('Flashcard marathon', 'ফ্ল্যাশকার্ড ম্যারাথন'),
        sub: A('All due boxes', 'সব ডিউ বক্স'),
        detail: A('Clear all due cards in every Leitner box.', 'প্রতিটি লাইটনার বক্সের ডিউ কার্ড শেষ করো।') },
      { id: 'errors', cat: 'review', mins: 45, icon: '📓', title: A('Error Notebook review', 'Error Notebook রিভিউ'),
        sub: A('Only open / unresolved errors', 'শুধু খোলা / অমীমাংসিত ভুল'),
        detail: A('Close what you can explain; keep the rest for tomorrow.', 'যা ব্যাখ্যা করতে পারো বন্ধ করো; বাকিটা কালকের জন্য রাখো।') },
      { id: 'test', cat: 'test', mins: 30, icon: '🧪', title: A('20-question check', '২০ প্রশ্নের চেক'),
        sub: A('Mixed, timed at 72 sec/Q', 'মিশ্র, ৭২ সেকেন্ড/প্রশ্ন'),
        detail: A('A short daily check keeps recall sharp.', 'প্রতিদিনের ছোট চেক রিকল তীক্ষ্ণ রাখে।') }
    ]
  },
  TAPER: {
    key: 'TAPER', type: 'taper', total: 120,
    name: A('Taper day', 'টেপার ডে'),
    acts: [
      { id: 'notes', cat: 'learn', mins: 40, icon: '📚', title: A('Light notes review', 'হালকা নোট রিভিউ'),
        sub: A('Weak spots only', 'শুধু দুর্বল জায়গা'),
        detail: A('No new topics. Keep the load light.', 'নতুন টপিক নয়। লোড হালকা রাখো।') },
      { id: 'flash', cat: 'recall', mins: 30, icon: '🃏', title: A('Flashcards', 'ফ্ল্যাশকার্ড'),
        sub: A('Due cards', 'ডিউ কার্ড'),
        detail: A('One calm pass.', 'শান্তভাবে একবার।') },
      { id: 'errors', cat: 'review', mins: 30, icon: '📓', title: A('Error Notebook', 'Error Notebook'),
        sub: A('The 20 errors you keep repeating', 'যে ২০টি ভুল বারবার করো'),
        detail: A('Read them slowly. Sleep early.', 'ধীরে পড়ো। তাড়াতাড়ি ঘুমাও।') },
      { id: 'strategy', cat: 'log', mins: 20, icon: '🧭', title: A('Exam strategy', 'পরীক্ষার স্ট্র্যাটেজি'),
        sub: A('Order of sections, marking plan', 'সেকশনের ক্রম, মার্কিং প্ল্যান'),
        detail: A('Rehearse how you will start, skip and return.', 'কীভাবে শুরু, বাদ দেওয়া ও ফেরা হবে তা মনে rehears করো।') }
    ]
  },
  EXAMPREP: {
    key: 'EXAMPREP', type: 'exam-prep', total: 90,
    name: A('Exam preparation', 'পরীক্ষার প্রস্তুতি'),
    acts: [
      { id: 'checklist', cat: 'setup', mins: 30, icon: '✅', title: A('Exam-day checklist', 'পরীক্ষার দিনের চেকলিস্ট'),
        sub: A('Documents, admit card, ID, water', 'নথি, অ্যাডমিট, আইডি, জল'),
        detail: A('Pack everything tonight, not tomorrow morning.', 'সব কিছু আজ রাতেই গুছিয়ে রাখো, কাল সকালে নয়।') },
      { id: 'logistics', cat: 'log', mins: 20, icon: '🚌', title: A('Logistics', 'লজিস্টিকস'),
        sub: A('Route, reporting time, backup plan', 'রাস্তা, রিপোর্টিং সময়, বিকল্প পরিকল্পনা'),
        detail: A('Know the centre, the route and the reporting time.', 'সেন্টার, রাস্তা ও রিপোর্টিং সময় জেনে রাখো।') },
      { id: 'light', cat: 'review', mins: 40, icon: '📓', title: A('Light review', 'হালকা রিভিউ'),
        sub: A('Error Notebook + formula sheet only', 'শুধু Error Notebook + ফর্মুলা শিট'),
        detail: A('Stop early. Sleep is worth more than one more MCQ.', 'তাড়াতাড়ি থামো। ঘুম একটা MCQ-এর চেয়ে দামি।') }
    ]
  }
};

export const DAY_TYPE_LABEL = {
  orientation: A('ORIENTATION', 'ওরিয়েন্টেশন'),
  learn: A('LEARN DAY', 'লার্ন ডে'),
  pyq: A('PYQ + BACKLOG', 'PYQ + ব্যাকলগ'),
  revision: A('REVISION + TEST', 'রিভিশন + টেস্ট'),
  'unit-closure': A('UNIT CLOSURE', 'ইউনিট ক্লোজার'),
  monthly: A('MONTHLY CHECK', 'মাসিক চেক'),
  rest: A('REST DAY', 'বিশ্রাম'),
  consolidation: A('CONSOLIDATION', 'কনসোলিডেশন'),
  buffer: A('BUFFER DAY', 'বাফার ডে'),
  'revision-cycle': A('REVISION CYCLE 2', 'রিভিশন সাইকেল ২'),
  'pyq-deep': A('PYQ DEEP DIVE', 'PYQ ডিপ ডাইভ'),
  sectional: A('SECTIONAL TEST', 'সেকশনাল টেস্ট'),
  mock: A('FULL MOCK', 'পূর্ণ মক'),
  analysis: A('MOCK ANALYSIS', 'মক বিশ্লেষণ'),
  final: A('FINAL REVISION', 'ফাইনাল রিভিশন'),
  taper: A('TAPER', 'টেপার'),
  'exam-prep': A('EXAM PREP', 'পরীক্ষার প্রস্তুতি')
};

/* ------------------------------------------------------- depth guidance */
export const DEPTH_GUIDE = {
  D1: {
    label: A('D1 · Awareness', 'D1 · পরিচিতি'),
    guide: A('Focus on definitions, basic concepts and one example per term. Skip derivations and proofs. You only need to recognise terms in MCQs.',
      'সংজ্ঞা, মূল ধারণা ও প্রতি টার্মে একটি উদাহরণে মন দাও। ডেরিভেশন/প্রুফ বাদ দাও। MCQ-তে টার্ম চিনতে পারলেই হবে।'),
    mcq: 10
  },
  D2: {
    label: A('D2 · Exam level', 'D2 · পরীক্ষার স্তর'),
    guide: A('Understand the concept fully. Work through one example per key idea. Know the typical MCQ traps and wrong options. Be able to explain it in your own words.',
      'কনসেপ্ট পুরোপুরি বোঝো। প্রতিটি মূল আইডিয়ায় একটি উদাহরণ করো। সাধারণ MCQ ফাঁদ ও ভুল অপশন চিনো। নিজের ভাষায় বলতে পারো।'),
    mcq: 15
  },
  D3: {
    label: A('D3 · Deep / numerical', 'D3 · গভীর / সংখ্যাগত'),
    guide: A('Master the algorithms and derivations. Solve at least 3 numericals. Understand edge cases and variations. Be able to solve under exam time pressure.',
      'অ্যালগরিদম ও ডেরিভেশন আয়ত্ত করো। অন্তত ৩টি সংখ্যাগত সমস্যা সমাধান করো। এজ কেস ও বৈচিত্র্য বোঝো। পরীক্ষার সময়ের চাপে সমাধান করতে পারো।'),
    mcq: 20
  }
};

export const SKIP_LIST = A(
  'Do NOT spend time on: long mathematical proofs (unless D3), vendor-specific product details, historical trivia, implementation code (unless specified), anything not listed in the syllabus.',
  'এইসবে সময় নষ্ট করো না: লম্বা গাণিতিক প্রুফ (D3 ছাড়া), নির্দিষ্ট ভেন্ডরের প্রোডাক্ট ডিটেইল, ঐতিহাসিক ট্রিভিয়া, ইমপ্লিমেন্টেশন কোড (নির্দিষ্ট না হলে), সিলেবাসে না থাকা কিছু।'
);

/* --------------------------------------------------------------- scaling */
const PRIORITY_WEIGHT = { learn: 1.3, setup: 1.25, test: 1.25, practice: 1.2, recall: 1.05, notes: 0.95, review: 0.85, log: 0.65 };

export function fitActivities(acts, target) {
  const total = acts.reduce((s, a) => s + a.mins, 0);
  if (!total || target <= 0) return acts.map((a) => ({ ...a, mins: 0 }));
  if (total === target) return acts.map((a) => ({ ...a }));
  const scaled = acts.map((a) => {
    const w = (PRIORITY_WEIGHT[a.cat] || 1) * a.mins;
    return { a, w };
  });
  const wsum = scaled.reduce((s, x) => s + x.w, 0);
  let mins = scaled.map((x) => Math.max(5, Math.round((x.w / wsum) * target)));
  let diff = target - mins.reduce((s, m) => s + m, 0);
  let guard = 0;
  while (diff !== 0 && guard++ < 2000) {
    if (diff > 0) {
      let bi = 0;
      mins.forEach((m, i) => { if (PRIORITY_WEIGHT[acts[i].cat] > PRIORITY_WEIGHT[acts[bi].cat] || (PRIORITY_WEIGHT[acts[i].cat] === PRIORITY_WEIGHT[acts[bi].cat] && m > mins[bi])) bi = i; });
      mins[bi]++; diff--;
    } else {
      let bi = -1;
      mins.forEach((m, i) => {
        if (m > 5 && (bi < 0 || PRIORITY_WEIGHT[acts[i].cat] < PRIORITY_WEIGHT[acts[bi].cat])) bi = i;
      });
      if (bi < 0) break;
      mins[bi]--; diff++;
    }
  }
  return acts.map((a, i) => ({ ...a, mins: mins[i] }));
}

/* ------------------------------------------------------- timeline builder */
export function buildTimeline(state, key) {
  const day = getDay(state, key);
  const fmt = state.profile.timeFormat || '12';
  const tplKey = day ? day.t : 'H';
  const tpl = TEMPLATES[tplKey] || TEMPLATES.H;
  const windows = windowsFor(state, key);
  const available = dayNet(state, key);
  const tplTotal = tpl.acts.reduce((s, a) => s + a.mins, 0);
  let acts = tpl.acts.map((a) => ({ ...a }));
  let compressed = false;
  let deficit = 0;
  if (tplTotal > 0 && available < tplTotal) {
    acts = fitActivities(acts, available);
    compressed = true;
    deficit = tplTotal - available;
  }
  const { rows, leftover } = placeActivities(acts, windows);
  // attach clock strings
  const out = rows.map((r, i) => ({ ...r, i, startStr: tStr(r.start, fmt), endStr: tStr(r.start + r.minutes, fmt) }));
  return {
    day, tpl, tplKey, acts, rows: out, available, compressed, deficit, leftover,
    windows, fmt
  };
}

export function placeActivities(acts, windows) {
  const rows = [];
  let qi = 0;
  let remaining = acts[0]?.mins || 0;
  let actIndex = 0;
  for (const w of windows) {
    const gross = grossOf(w);
    const k = Math.floor(gross / 60);
    const netW = gross - BREAK_LEN * k;
    let t = tMin(w.start);
    let used = 0;
    let cont = 0;
    while (used < netW && qi < acts.length) {
      const a = acts[qi];
      let take = Math.min(remaining, netW - used);
      const untilBreak = BREAK_AFTER - cont;
      if (take > untilBreak) take = untilBreak;
      if (take <= 0) break;
      // merge a tiny remainder into this chunk when it fits
      const restAfter = remaining - take;
      if (restAfter > 0 && restAfter < 10 && take + restAfter <= netW - used && take + restAfter <= untilBreak) {
        take += restAfter;
      }
      rows.push({ kind: 'act', act: a, actIndex, start: t, minutes: take, part: rows.filter((r) => r.kind === 'act' && r.actIndex === actIndex).length + 1 });
      t += take; used += take; cont += take; remaining -= take;
      if (remaining === 0) { qi++; actIndex = qi; remaining = acts[qi]?.mins || 0; }
      if (cont >= BREAK_AFTER && used < netW && qi < acts.length && netW - used >= BREAK_LEN) {
        rows.push({ kind: 'break', start: t, minutes: BREAK_LEN });
        t += BREAK_LEN; cont = 0;
      }
    }
    if (used < netW && qi >= acts.length) {
      rows.push({ kind: 'free', start: t, minutes: netW - used });
    }
  }
  const leftover = qi < acts.length ? remaining + acts.slice(qi + 1).reduce((s, a) => s + a.mins, 0) : 0;
  return { rows, leftover };
}

/* ------------------------------------------------------- queue building */
function unitOrderFor(state, paper) {
  if (paper.id === 'P2') return state.profile.unitOrderP2 && state.profile.unitOrderP2.length
    ? state.profile.unitOrderP2 : PAPER_II_ORDER;
  return null;
}

export function buildQueue(state, paperIndex) {
  const paper = state.syllabus[paperIndex];
  const units = orderedUnits(paper, unitOrderFor(state, paper));
  const queue = [];
  units.forEach((u) => {
    u.clusters.forEach((c) => {
      const n = Math.max(1, c.sessions || 1);
      for (let i = 1; i <= n; i++) {
        queue.push({
          sid: `${c.id}#${i}`,
          paper: paper.id,
          paperIndex,
          unitId: u.id,
          unitN: u.n,
          unitName: u.name,
          clusterId: c.id,
          clusterName: c.name,
          clusterTerms: c.terms,
          depth: c.depth || 'D2',
          n: i,
          of: n,
          verify: !!c.verify
        });
      }
    });
  });
  // mark last session of each unit
  const last = {};
  queue.forEach((s) => { last[s.unitId] = s.sid; });
  queue.forEach((s) => { s.isUnitLast = last[s.unitId] === s.sid; });
  return queue;
}

export function sessionById(state, sid) {
  const cid = String(sid).split('#')[0];
  const f = findCluster(state.syllabus, cid);
  if (!f) return null;
  const n = Number(String(sid).split('#')[1] || 1);
  return {
    sid,
    paper: f.paper.id,
    paperIndex: state.syllabus.findIndex((p) => p.id === f.paper.id),
    unitId: f.unit.id,
    unitN: f.unit.n,
    unitName: f.unit.name,
    clusterId: f.cluster.id,
    clusterName: f.cluster.name,
    clusterTerms: f.cluster.terms,
    depth: f.cluster.depth || 'D2',
    n, of: Math.max(1, f.cluster.sessions || 1),
    verify: !!f.cluster.verify
  };
}

export function sessionDone(state, sid) {
  const s = state.sessions[sid];
  return !!(s && s.status === 'done');
}

function pendingBuffers(state) {
  return (state.buffers || []).filter((b) => !b.done);
}

/* --------------------------------------------------------- plan builder */
const WEEKDAY_PAPER_PARALLEL = { 1: 'P2', 2: 'P2', 3: 'P1', 4: 'P2', 5: 'P2' };

function paperForWeekday(state, wd, q1len, q2len) {
  const mode = state.profile.planMode || 'parallel';
  if (mode === 'p1first') {
    if (q1len > 0) return 'P1';
    if (q2len > 0) return 'P2';
    return null;
  }
  if (mode === 'custom') {
    const split = state.profile.customSplit || { p1: [3], p2: [1, 2, 4, 5] };
    if ((split.p1 || []).includes(wd) && q1len > 0) return 'P1';
    if ((split.p2 || []).includes(wd) && q2len > 0) return 'P2';
    if (q1len > 0) return 'P1';
    if (q2len > 0) return 'P2';
    return null;
  }
  const want = WEEKDAY_PAPER_PARALLEL[wd];
  if (!want) return null;
  if (want === 'P1') {
    if (q1len > 0) return 'P1';
    if (q2len > 0) return 'P2';
    return null;
  }
  if (q2len > 0) return 'P2';
  if (q1len > 0) return 'P1';
  return null;
}

export function coachingSlotFor(state, key, clusterId) {
  const c = state.profile.coaching;
  if (!c || !c.started || !Array.isArray(c.slots)) return null;
  return c.slots.find((s) => Number(s.day) === weekday(key) && (!clusterId || s.clusterId === clusterId)) || null;
}

const isRest = (state, key) => (state.restDays || []).includes(key);

/**
 * Generate the plan.
 * opts.fromKey        — first date to (re)generate (default: start date or today)
 * opts.keepPast       — keep existing entries before opts.fromKey
 */
export function generatePlan(state, opts = {}) {
  const start = state.profile.startDate || todayKey();
  const today = todayKey();
  const oldDays = (state.plan && state.plan.days) || {};
  const keepPast = opts.keepPast !== false && Object.keys(oldDays).length > 0;
  let fromKey = opts.fromKey || (keepPast && today >= start ? today : start);
  if (diffDays(start, fromKey) < 0) fromKey = start;

  const days = {};
  if (keepPast) {
    Object.keys(oldDays).forEach((k) => { if (k < fromKey) days[k] = oldDays[k]; });
  }

  const q1 = buildQueue(state, 0).filter((s) => !sessionDone(state, s.sid));
  const q2 = buildQueue(state, 1).filter((s) => !sessionDone(state, s.sid));
  const buffers = pendingBuffers(state);
  let bufferCursor = 0;
  let buf1 = 0, buf2 = 0;

  const phase2Info = phaseTwoClusters(state);

  let cursor = Math.max(1, dayNumber(start, fromKey));
  const lastDay = TOTAL_DAYS;

  for (; cursor <= lastDay; cursor++) {
    const key = keyForDay(start, cursor);
    if (key < fromKey) continue;

    if (isRest(state, key)) {
      days[key] = { t: 'H', s: [], i: cursor, rest: true };
      continue;
    }

    if (cursor === 1) {
      days[key] = { t: 'ORIENT', s: [], i: cursor };
      continue;
    }

    if (cursor > PHASE1_DAYS) {
      days[key] = buildPhase2Day(state, key, cursor, phase2Info);
      continue;
    }

    const wd = weekday(key);
    const day = { t: null, s: [], i: cursor };

    /* ---- Saturday ---- */
    if (wd === 6) {
      // buffer day has priority
      if (bufferCursor < buffers.length) {
        const b = buffers[bufferCursor++];
        day.t = 'BUFFER';
        day.c = b.clusterId;
        day.bufferId = b.id;
        day.bufferDate = key;
        days[key] = day;
        continue;
      }
      // unit closure: did any unit's last session fall in Mon–Fri of this week?
      const monday = addDays(key, -5);
      const closing = closingUnitFor(days, monday, key);
      if (closing) {
        day.t = 'E';
        day.u = closing.unitId;
        days[key] = day;
        continue;
      }
      if (!q1.length && !q2.length) {
        day.t = 'GSAT';
        days[key] = day;
        continue;
      }
      day.t = 'C';
      days[key] = day;
      continue;
    }

    /* ---- Sunday ---- */
    if (wd === 0) {
      if (!q1.length && !q2.length) {
        day.t = isLastSundayOfMonth(key) ? 'F' : 'GSUN';
        days[key] = day;
        continue;
      }
      day.t = isLastSundayOfMonth(key) ? 'F' : 'D';
      days[key] = day;
      continue;
    }

    /* ---- weekdays ---- */
    if (bufferCursor < buffers.length) {
      const b = buffers[bufferCursor++];
      day.t = 'BUFFER';
      day.c = b.clusterId;
      day.bufferId = b.id;
      days[key] = day;
      continue;
    }

    if (!q1.length && !q2.length) {
      day.t = 'G';
      days[key] = day;
      continue;
    }

    const want = paperForWeekday(state, wd, q1.length, q2.length);
    let sess = null;
    if (want === 'P1') { sess = q1.shift(); buf1++; }
    else if (want === 'P2') { sess = q2.shift(); buf2++; }
    if (!sess) { day.t = 'G'; days[key] = day; continue; }
    sess.plannedDate = key;
    day.s = [sess.sid];
    day.u = sess.unitId;
    day.unitLast = !!sess.isUnitLast;
    // coaching overlap → template B
    const cs = coachingSlotFor(state, key, sess.clusterId);
    day.t = cs ? 'B' : 'A';
    if (cs) day.coach = true;
    days[key] = day;
  }

  return {
    days,
    builtAt: new Date().toISOString(),
    fromKey,
    remaining: { p1: q1.length, p2: q2.length }
  };
}

function closingUnitFor(days, monday, saturday) {
  for (const [k, d] of Object.entries(days)) {
    if (k >= monday && k < saturday && d.unitLast && d.u) return { unitId: d.u };
  }
  return null;
}

/* --------------------------------------------------- phase 2 structures */
export function clusterStats(state, clusterId) {
  const cs = (state.clusters || {})[clusterId] || {};
  const mcqs = (state.mcqTotals || {})[clusterId] || { attempted: 0, correct: 0 };
  const accuracy = mcqs.attempted ? Math.round((mcqs.correct / mcqs.attempted) * 100) : 0;
  const confidence = cs.confidence || 0;
  const lastReview = cs.lastReviewAt || cs.firstPassAt || state.profile.startDate;
  const daysSince = Math.max(0, diffDays(lastReview, todayKey()));
  const weight = (5 - (confidence || 3)) * 2 + (100 - (accuracy || 50)) / 10 + daysSince / 30;
  return { confidence, accuracy, attempted: mcqs.attempted, correct: mcqs.correct, weight, status: cs.status || 'not-started', lastReview };
}

export function phaseTwoClusters(state) {
  const list = [];
  state.syllabus.forEach((p) => {
    orderedUnits(p, p.id === 'P2' ? (state.profile.unitOrderP2 || PAPER_II_ORDER) : null).forEach((u) => {
      u.clusters.forEach((c) => {
        const st = clusterStats(state, c.id);
        list.push({ clusterId: c.id, clusterName: c.name, unitId: u.id, unitName: u.name, unitN: u.n, paper: p.id, depth: c.depth, ...st });
      });
    });
  });
  list.sort((a, b) => b.weight - a.weight);
  return { weakOrder: list, cycleIndex: 0, cursor: 0 };
}

/* --------------------------------------------------------- phase 2 days */
export function buildPhase2Day(state, key, dayNo, info) {
  const wd = weekday(key);
  const offset = dayNo - PHASE1_DAYS - 1; // 0..364
  const day = { t: 'G', s: [], i: dayNo };
  const lastSunday = isLastSundayOfMonth(key);

  // last 3 days
  if (offset >= 361) {
    day.t = 'EXAMPREP';
    if (offset === 361) day.t = 'TAPER';
    return day;
  }
  // last two weeks: taper
  if (offset >= 351) {
    if (wd === 0) { day.t = 'MOCK'; return day; }
    day.t = 'TAPER';
    return day;
  }

  if (offset < 90) { // months 13-15 — revision cycle 2
    if (wd === 0) { day.t = lastSunday ? 'F' : 'D'; return day; }
    if (wd === 6) { day.t = 'C'; return day; }
    const picks = nextRevisionClusters(info, 2);
    day.t = 'R2';
    day.cs = picks.map((p) => p.clusterId);
    day.u = picks[0]?.unitId;
    return day;
  }

  if (offset < 180) { // months 16-18 — PYQ deep dive
    if (wd === 0) { day.t = lastSunday ? 'F' : 'D'; return day; }
    if (wd === 6) {
      day.t = 'SEC';
      const u = info.weakOrder[(offset >> 1) % info.weakOrder.length];
      day.u = u?.unitId;
      return day;
    }
    day.t = 'PYQDEEP';
    const units = [...new Set(info.weakOrder.map((c) => c.unitId))];
    day.u = units[offset % units.length];
    return day;
  }

  if (offset < 270) { // months 19-21 — mock phase
    const week = Math.floor((offset - 180) / 7);
    if (wd === 0) { day.t = 'MOCK'; return day; }
    if (wd === 1) { day.t = 'ANAL'; return day; }
    if (wd === 3) { day.t = 'SEC'; day.u = info.weakOrder[(week * 3) % info.weakOrder.length]?.unitId; return day; }
    if (wd === 6) { day.t = 'SEC'; day.u = info.weakOrder[(week * 5) % info.weakOrder.length]?.unitId; return day; }
    day.t = 'FINAL';
    return day;
  }

  // months 22-24 — final revision
  if (wd === 0) { day.t = 'MOCK'; return day; }
  if (wd === 3) { day.t = 'SEC'; return day; }
  if (wd === 6) { day.t = 'ANAL'; return day; }
  day.t = 'FINAL';
  return day;
}

function nextRevisionClusters(info, n) {
  if (!info.weakOrder.length) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = info.weakOrder[info.cursor % info.weakOrder.length];
    info.cursor++;
    if (c) out.push(c);
    // strong clusters can share a day; weak ones get the day alone
    if (c && (c.confidence <= 2 || (c.attempted >= 10 && c.accuracy < 50))) break;
  }
  return out;
}

/* ------------------------------------------------------ plan accessors */
export function getDay(state, key) {
  const d = state.plan && state.plan.days ? state.plan.days[key] : null;
  if (d) return d;
  return null;
}

export function rebuildPlan(state, opts = {}) {
  const res = generatePlan(state, opts);
  state.plan = { days: res.days, builtAt: res.builtAt, fromKey: res.fromKey };
  return res;
}

export function planRange(state) {
  const start = state.profile.startDate;
  return { start, end: keyForDay(start, TOTAL_DAYS), today: todayKey() };
}

/* --------------------------------------------------------------- backlog */
export function sessionPlanIndex(state) {
  const idx = {};
  const days = (state.plan && state.plan.days) || {};
  Object.keys(days).sort().forEach((k) => {
    (days[k].s || []).forEach((sid) => {
      if (!idx[sid]) idx[sid] = { plannedDate: k, dayKey: k, template: days[k].t };
    });
  });
  return idx;
}

export function backlogItems(state) {
  const today = todayKey();
  const idx = sessionPlanIndex(state);
  const items = [];
  Object.entries(idx).forEach(([sid, v]) => {
    if (v.plannedDate >= today) return;
    const s = state.sessions[sid];
    if (s && (s.status === 'done' || s.status === 'dropped')) return;
    const info = sessionById(state, sid);
    if (!info) return;
    const depthScore = info.depth === 'D3' ? 3 : info.depth === 'D2' ? 2 : 1;
    const age = diffDays(v.plannedDate, today);
    items.push({
      sid, ...info, plannedDate: v.plannedDate, age,
      priority: age + depthScore * 3,
      partial: !!(s && s.status === 'partial')
    });
  });
  items.sort((a, b) => b.priority - a.priority);
  return items;
}

export function replanPreview(state) {
  const fresh = generatePlan(state, { fromKey: todayKey(), keepPast: true });
  const oldDays = (state.plan && state.plan.days) || {};
  const moved = [];
  const today = todayKey();
  Object.keys(fresh.days).forEach((k) => {
    if (k < today) return;
    const a = oldDays[k];
    const b = fresh.days[k];
    if (!a || !b) return;
    const as = (a.s || []).join(','), bs = (b.s || []).join(',');
    if (as !== bs || a.t !== b.t) moved.push({ key: k, from: as || a.t, to: bs || b.t });
  });
  return { days: fresh.days, moved, builtAt: fresh.builtAt, fromKey: fresh.fromKey };
}

export function applyReplan(state, preview, reason) {
  const before = backlogItems(state).length;
  state.plan = { days: preview.days, builtAt: preview.builtAt, fromKey: preview.fromKey };
  state.changelog = state.changelog || [];
  state.changelog.unshift({
    at: new Date().toISOString(), kind: 'replan', reason: reason || 'Manual re-plan',
    moved: preview.moved.length, backlogBefore: before
  });
  state.changelog = state.changelog.slice(0, 100);
  return preview;
}

/* --------------------------------------------------------- study records */
export function dayProgress(state, key) {
  const log = (state.actLog || {})[key] || {};
  const tl = buildTimeline(state, key);
  const total = tl.rows.filter((r) => r.kind === 'act').reduce((s, r) => s + r.minutes, 0);
  let done = 0;
  // count each activity's planned minutes once, based on the activity's status
  const byAct = {};
  tl.rows.forEach((r) => { if (r.kind === 'act') byAct[r.actIndex] = (byAct[r.actIndex] || 0) + r.minutes; });
  Object.entries(byAct).forEach(([i, m]) => {
    const rec = log[i];
    if (rec && rec.status === 'done') done += m;
    else if (rec && rec.status === 'partial') done += Math.min(m, rec.actualMin || 0);
  });
  const planned = total || 1;
  return {
    total, done, pct: Math.round((done / planned) * 100),
    loggedMinutes: Object.values(log).reduce((s, r) => s + (r.actualMin || 0), 0),
    complete: total > 0 && done >= total,
    touched: done > 0
  };
}

export function dayMinutes(state, key) {
  return dayProgress(state, key).done;
}

export function streak(state) {
  const today = todayKey();
  let n = 0;
  let k = today;
  if (!dayProgress(state, k).touched) k = addDays(k, -1);
  let guard = 0;
  while (guard++ < 800) {
    if (k < state.profile.startDate) break;
    if (dayProgress(state, k).touched) { n++; k = addDays(k, -1); } else break;
  }
  return n;
}

/* ------------------------------------------------------------- revision */
export const REVISION_OFFSETS = [1, 7, 30, 90];

export function scheduleRevisions(state, clusterId, baseKey) {
  state.revisions = state.revisions || [];
  state.revisions = state.revisions.filter((r) => !(r.clusterId === clusterId && !r.done));
  REVISION_OFFSETS.forEach((off) => {
    state.revisions.push({
      id: `${clusterId}-${off}-${baseKey}`,
      clusterId, due: addDays(baseKey, off), offset: off, done: false, kind: 'cluster'
    });
  });
}

export function dueRevisions(state, key = todayKey()) {
  return (state.revisions || []).filter((r) => !r.done && r.due <= key);
}

export const LEITNER_INTERVALS = [1, 3, 7, 21, 60];

export function dueFlashcards(state, key = todayKey()) {
  return (state.flashcards || []).filter((c) => !c.dueKey || c.dueKey <= key);
}

export function nextFlashDueDate(box, fromKey = todayKey()) {
  const days = LEITNER_INTERVALS[Math.min(4, Math.max(0, box - 1))];
  return addDays(fromKey, days);
}

export function reviewFlashcard(state, id, correct) {
  const c = (state.flashcards || []).find((x) => x.id === id);
  if (!c) return;
  c.box = correct ? Math.min(5, (c.box || 1) + 1) : 1;
  c.dueKey = nextFlashDueDate(c.box);
  c.reviews = (c.reviews || 0) + 1;
  c.lastReview = todayKey();
}

/* ------------------------------------------------------------- progress */
export function overallProgress(state) {
  const sessions = state.sessions || {};
  const totals = state.syllabus.reduce((s, p) => s + p.units.reduce((a, u) => a + u.clusters.reduce((x, c) => x + (c.sessions || 0), 0), 0), 0);
  let done = 0;
  let p1done = 0;
  let p2done = 0;
  Object.entries(sessions).forEach(([sid, v]) => {
    if (v.status !== 'done') return;
    done++;
    if (sid.startsWith('P1')) p1done++; else p2done++;
  });
  const p1total = state.syllabus[0].units.reduce((a, u) => a + u.clusters.reduce((x, c) => x + (c.sessions || 1), 0), 0);
  const p2total = state.syllabus[1].units.reduce((a, u) => a + u.clusters.reduce((x, c) => x + (c.sessions || 1), 0), 0);
  return {
    done, total: totals, pct: totals ? Math.round((done / totals) * 100) : 0,
    p1done, p1total, p1pct: p1total ? Math.round((p1done / p1total) * 100) : 0,
    p2done, p2total, p2pct: p2total ? Math.round((p2done / p2total) * 100) : 0
  };
}

export function unitProgress(state, unitId) {
  const { syllabus } = state;
  for (const p of syllabus) {
    const u = p.units.find((x) => x.id === unitId);
    if (!u) continue;
    let total = 0, done = 0, mcqA = 0, mcqC = 0;
    u.clusters.forEach((c) => {
      const n = Math.max(1, c.sessions || 1);
      total++;
      const st = (state.clusters || {})[c.id] || {};
      if (st.status === 'done' || st.status === 'done-revisit' || st.status === 'needs-help') done++;
      const m = (state.mcqTotals || {})[c.id] || { attempted: 0, correct: 0 };
      mcqA += m.attempted; mcqC += m.correct;
    });
    return {
      pct: total ? Math.round((done / total) * 100) : 0, done, total: u.clusters.length,
      accuracy: mcqA ? Math.round((mcqC / mcqA) * 100) : 0, attempted: mcqA, correct: mcqC
    };
  }
  return { pct: 0, done: 0, total: 0, accuracy: 0, attempted: 0, correct: 0 };
}

export function paperProgress(state, paperId) {
  const paper = state.syllabus.find((p) => p.id === paperId);
  if (!paper) return { pct: 0 };
  let total = 0, done = 0;
  paper.units.forEach((u) => {
    u.clusters.forEach((c) => {
      total++;
      const st = (state.clusters || {})[c.id] || {};
      if (st.status === 'done' || st.status === 'done-revisit' || st.status === 'needs-help') done++;
    });
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total };
}

export function clusterDone(state, clusterId) {
  const st = (state.clusters || {})[clusterId];
  return !!(st && st.status && st.status !== 'not-started' && st.status !== 'learning');
}

export function markClusterSessionDone(state, sess, extra = {}) {
  state.sessions = state.sessions || {};
  const prev = state.sessions[sess.sid] || {};
  state.sessions[sess.sid] = {
    ...prev, status: 'done', doneAt: todayKey(),
    checklist: extra.checklist || prev.checklist || {},
    ...extra
  };
  // cluster bookkeeping
  state.clusters = state.clusters || {};
  const cl = state.clusters[sess.clusterId] || { status: 'not-started' };
  if (!cl.firstPassAt) {
    cl.firstPassAt = todayKey();
    cl.status = 'done';
  }
  if (sess.n === sess.of) {
    cl.status = cl.status === 'needs-help' ? 'needs-help' : (cl.status === 'done-revisit' ? 'done-revisit' : 'done');
    scheduleRevisions(state, sess.clusterId, todayKey());
  } else {
    cl.status = 'learning';
  }
  state.clusters[sess.clusterId] = cl;
}

/* --------------------------------------------------------- activity log */
export function setActivityStatus(state, key, actIndex, status, actualMin) {
  state.actLog = state.actLog || {};
  state.actLog[key] = state.actLog[key] || {};
  const rec = state.actLog[key][actIndex] || {};
  state.actLog[key][actIndex] = {
    ...rec, status,
    actualMin: actualMin != null ? actualMin : (status === 'done' ? rec.actualMin : rec.actualMin)
  };
}

export function addActivityMinutes(state, key, actIndex, mins) {
  state.actLog = state.actLog || {};
  state.actLog[key] = state.actLog[key] || {};
  const rec = state.actLog[key][actIndex] || {};
  state.actLog[key][actIndex] = { ...rec, actualMin: (rec.actualMin || 0) + mins };
}

export function logMcq(state, clusterId, attempted, correct) {
  state.mcqTotals = state.mcqTotals || {};
  const m = state.mcqTotals[clusterId] || { attempted: 0, correct: 0 };
  m.attempted += Number(attempted) || 0;
  m.correct += Math.min(Number(correct) || 0, Number(attempted) || 0);
  state.mcqTotals[clusterId] = m;
  return m;
}

export function clusterTotalMinutes(state, clusterId) {
  let mins = 0;
  Object.entries(state.actLog || {}).forEach(([key, log]) => {
    const day = state.plan?.days?.[key];
    if (!day) return;
    // only count days whose session belongs to this cluster
    const sid = (day.s || [])[0];
    if (!sid || sid.split('#')[0] !== clusterId) return;
    Object.values(log).forEach((r) => { mins += r.actualMin || 0; });
  });
  return mins;
}

/* ------------------------------------------------------- move-on gate */
export function gateResults(state, sess) {
  const cl = (state.clusters || {})[sess.clusterId] || {};
  const m = (state.mcqTotals || {})[sess.clusterId] || { attempted: 0, correct: 0 };
  const accuracy = m.attempted ? Math.round((m.correct / m.attempted) * 100) : 0;
  const explain = !!(cl.gate && cl.gate.explain);
  const mcqPass = m.attempted >= 10 && accuracy >= 60;
  const confPass = (cl.confidence || 0) >= 3;
  const passed = [explain, mcqPass, confPass].filter(Boolean).length;
  return { explain, mcqPass, confPass, passed, accuracy, attempted: m.attempted, confidence: cl.confidence || 0 };
}

export function applyGateDecision(state, sess, gate = gateResults(state, sess)) {
  state.clusters = state.clusters || {};
  const cl = state.clusters[sess.clusterId] || {};
  cl.gate = { ...(cl.gate || {}), explain: gate.explain, decidedAt: todayKey(), passed: gate.passed };
  if (gate.passed === 3) {
    cl.status = cl.status === 'needs-help' ? 'needs-help' : 'done';
    cl.revisit = false;
    scheduleRevisions(state, sess.clusterId, todayKey());
  } else if (gate.passed === 2) {
    cl.status = 'done-revisit';
    cl.revisit = true;
    scheduleRevisions(state, sess.clusterId, todayKey());
  } else {
    if (cl.bufferUsed) {
      cl.status = 'needs-help';
      cl.needsHelp = true;
      state.coachingDoubts = state.coachingDoubts || [];
      if (!state.coachingDoubts.some((d) => d.clusterId === sess.clusterId)) {
        state.coachingDoubts.push({ clusterId: sess.clusterId, addedAt: todayKey() });
      }
    } else {
      cl.bufferUsed = true;
      cl.status = 'learning';
      state.buffers = state.buffers || [];
      state.buffers.push({ id: `buf-${sess.clusterId}-${Date.now()}`, clusterId: sess.clusterId, createdAt: todayKey(), done: false });
    }
  }
  state.clusters[sess.clusterId] = cl;
  return cl;
}

/* ------------------------------------------------------ study windows UI */
export function validateWindows(windows) {
  // returns {ok, net, gross, error}
  let gross = 0;
  const sorted = windows.slice().sort((a, b) => tMin(a.start) - tMin(b.start));
  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i];
    if (tMin(w.end) <= tMin(w.start)) return { ok: false, error: 'end-before-start' };
    gross += grossOf(w);
    if (i > 0 && tMin(w.start) < tMin(sorted[i - 1].end)) return { ok: false, error: 'overlap' };
  }
  const net = windows.reduce((s, w) => s + netOfGross(grossOf(w)), 0);
  if (net > MAX_NET) return { ok: false, net, gross, error: 'too-much' };
  return { ok: net > 0, net, gross, error: net > 0 ? null : 'empty' };
}

export const PRESETS = {
  early: { name: A('Early Bird', 'আর্লি বার্ড'), windows: [{ start: '05:30', end: '08:45' }] },
  split: { name: A('Split Day', 'স্প্লিট ডে'), windows: [{ start: '05:15', end: '06:50' }, { start: '19:00', end: '20:35' }] },
  custom: { name: A('Custom', 'কাস্টম'), windows: [] }
};

/* ---------------------------------------------------------- misc stats */
export function weeklyReport(state, weekEndKey = todayKey()) {
  const keys = [];
  for (let i = 0; i < 7; i++) keys.push(addDays(weekEndKey, -6 + i));
  let minutes = 0, sessions = 0;
  keys.forEach((k) => {
    minutes += dayMinutes(state, k);
    ((state.plan?.days?.[k]?.s) || []).forEach((sid) => { if (sessionDone(state, sid)) sessions++; });
  });
  const tests = (state.tests || []).filter((t) => t.date >= keys[0] && t.date <= weekEndKey);
  const attempted = tests.reduce((s, t) => s + (t.attempted || 0), 0);
  const correct = tests.reduce((s, t) => s + (t.correct || 0), 0);
  const clusterAcc = [];
  Object.entries(state.mcqTotals || {}).forEach(([cid, m]) => {
    if (m.attempted >= 5) clusterAcc.push({ clusterId: cid, skill: Math.round((m.correct / m.attempted) * 100), attempted: m.attempted });
  });
  clusterAcc.sort((a, b) => b.skill - a.skill);
  return {
    keys, minutes, sessions, tests: tests.length,
    attempted, correct, accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    strengths: clusterAcc.slice(0, 3), gaps: clusterAcc.slice(-3).reverse(),
    streak: streak(state), backlog: backlogItems(state).length
  };
}
