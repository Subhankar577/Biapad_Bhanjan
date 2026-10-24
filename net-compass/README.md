# NET Compass — নেট কম্পাস

**প্রতিদিন এক ধাপ, লক্ষ্য NET** · *Every day one step, goal NET*

A personal, minute-by-minute study planner and progress tracker for one UGC NET candidate —
**Paper I (Code 00)** + **Paper II Computer Science & Applications (Code 87)** — planned across
**730 days** (two years), running entirely in the browser.

No backend. No login. No paid APIs. No accounts. Everything lives in `localStorage` on your own device,
and the app keeps working offline as a PWA after the first load.

---

## Run it

```bash
cd net-compass
python3 -m http.server 8000 --bind 0.0.0.0     # or: npm start
# open http://localhost:8000
```

Any static host works (GitHub Pages, Netlify, a USB stick with `python3 -m http.server`).
Because it is a service-worker app, open it over `http://` or `https://` — not `file://`.

```bash
npm install     # only needed for the test suite (jsdom)
npm test        # data + plan engine + boot + flows + feature matrix
```

## What it actually does

| Area | Behaviour |
| --- | --- |
| **Plan engine** | A 730-day, day-by-day plan generated from your own study windows. Mon/Tue/Thu/Fri = Paper II new topics, Wed = Paper I, Sat = PYQ + backlog or unit closure, Sun = revision + weekly test, last Sun = monthly checkpoint, Day 1 = orientation with a 30-question diagnostic. |
| **Hard cap** | 180 **net** study minutes per day (gross − 5 min break per completed hour). Enforced by the engine *and* the window editor: anything above the cap refuses to save with an explanation. |
| **Templates A–H** | Each day is filled from a priority-ordered minute table (recall → learn → notes → practice → review → log), never leaving an empty day. Short windows compress proportionally and the deficit is pushed to the Saturday backlog block. |
| **Session card** | What to study, depth D1/D2/D3, a "what to skip" list, three free search links + your own pins, Cornell notes, flashcard quick-add, MCQ target with attempted/correct/time and accuracy, self-test prompts, checklist, per-block timer (start/pause/resume/done with auto-advance), and the move-on gate. |
| **Gate** | Self-explanation + MCQ accuracy ≥60% on ≥10 questions + confidence ≥3 → 3/3 done; 2/3 done-with-revisit; ≤1 one buffer day, then **🔴 needs help** plus a coaching-doubt entry. |
| **Revision** | D+1 / D+7 / D+30 / D+90 spaced revisions, plus a Leitner deck with 5 boxes (1/3/7/21/60 days). Wrong answer → Box 1. |
| **Backlog** | Missed or partial sessions carry forward (never dropped). Priority flavours older + deeper. Warn above 3, a catch-up-week suggestion above 7, and a re-plan preview you must confirm. Every re-plan is written to a changelog. |
| **Phase 2 (Day 366+)** | Weighted by `(5 − confidence) × 2 + (100 − accuracy)/10 + days_since_review/30`: revision days, PYQ deep-dives (months 16–18), mock phase (19–21), final revision and taper (22–24). |
| **Screens** | Today · Calendar (month / week / Gantt roadmap) · Syllabus tracker + editor · PYQ & mock tracker · Error notebook · Flashcards & notes · Resource library · Analytics · Backlog · Settings, plus the 5-step onboarding wizard. |
| **Bilingual** | Full EN / বাংলা toggle. Technical terms stay in English; Bengali uses Hind Siliguri with a Noto Sans Bengali fallback; Inter for English. |
| **Data** | Versioned schema, JSON export/import with validation and a preview before replacing anything, a storage meter with an 80% warning, and a reset guarded by typing `RESET`. |

## Honesty rules baked in

- **No invented syllabus topics.** Every cluster comes from `js/data/syllabus.js`, transcribed from the
  official UGC NET syllabus (Paper I Code 00, Paper II Code 87). Anything ambiguous carries a
  ⚠ *Verify with official PDF* flag. You can edit any line in **Syllabus → Edit** — the editor keeps a
  version history you can restore, and asks before re-generating the plan.
- **No invented links.** Only root domains (`nta.ac.in`, `ugcnet.nta.ac.in`, `nptel.ac.in`,
  `swayam.gov.in`, `geeksforgeeks.org`, `tutorialspoint.com`) and generated search URLs
  (YouTube / Google). Your own pins stay marked **My pinned (unverified)** until *you* tick
  "I verified this link", which stores the date and shows **verified ✔**.
- **Exam pattern is unverified by default.** Paper I 50 Q × 2 = 100 marks / 60 min, Paper II
  100 Q × 2 = 200 / 120 min, 150 Q / 300 marks / 180 min, no negative marking — all editable in
  Settings, always with a reminder to confirm from the latest NTA Information Bulletin.
- **First pass ≠ mastery.** The app says so wherever a percentage could be misread, and keeps the note
  permanently on Today, Syllabus and the phase roadmap.

## Project layout

```
index.html            app shell (fonts, manifest, service-worker boot)
manifest.webmanifest  PWA manifest
sw.js                 offline cache (core shell + fonts, stale-while-revalidate)
css/styles.css        design system: warm-paper light + midnight dark theme
js/data/syllabus.js   the syllabus data (P1 44 sessions, P2 165 sessions, 132 clusters)
js/data/quotes.js     30 bilingual rotating lines
js/engine.js          dates, windows, templates A–H, 730-day generation, backlog,
                      revisions/Leitner, gate, Phase 2, analytics
js/store.js           default state, migration, save/load, export/import, rest tokens
js/app.js             router, top bar, bottom nav, sheets, toasts, timer, confetti, SW
js/runtime.js         the small bridge (`R`) shared with every screen
js/ui/*.js            icons, DOM helpers, charts, actions registry and the 11 screens
tests/                node test scripts (data, plan, boot, flows, feature matrix)
```

State shape (abridged):

```js
{ version, profile{ name, lang, theme, fontSize, timeFormat, startDate, targetExam,
                    wake, ritual, sleep, studyWindows[7], coaching, planMode,
                    examPattern, … },
  syllabus, syllabusHistory, plan{days, builtAt}, sessions, clusters, actLog,
  notes, flashcards, revisions, tests, errors, pins, mcqTotals, restDays, buffers,
  changelog, monthlyEvals, quotes, timer }
```

## Tests

```bash
npm test
```

- `tests/data.test.mjs` — syllabus integrity (44 / 165 / 209 sessions, 132 clusters).
- `tests/plan.test.mjs` — 730 generated days, no empty day, minute totals ≤ net, rest days,
  compression, Phase 2 samples.
- `tests/smoke.test.mjs` — boots the real app in jsdom and renders all screens.
- `tests/flows.test.mjs` — a full study day (notes → flashcards → MCQs → gate → revisions), rest
  tokens, test logging, error notebook, Leitner study round, re-plan, exam pattern, reset guard,
  language switch.
- `tests/features.test.mjs` — 81 assertions that every required element of every screen exists.

## Known limits

- Single user, single device. Use **Export backup** before clearing browser data.
- Notifications need browser permission and only fire while the app is open.
- The exam pattern defaults are **unverified** — check the NTA bulletin.
- The demo data in Settings is sample progress for previewing charts; clear it before Day 1.
- Ambiguous syllabus wording is flagged, not guessed. When in doubt, the official PDF wins.

*Built for the long game. Not affiliated with NTA or UGC.*
