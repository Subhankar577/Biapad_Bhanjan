/* Link building. Rule 0.2: never invent deep URLs.
   Only (a) official root domains, (b) search URLs generated from the topic name,
   (c) links the user pins themselves. Every link carries a badge. */
import { bi } from './dom.js';

export const ALLOWED_ROOTS = [
  'nta.ac.in', 'ugcnet.nta.ac.in', 'nptel.ac.in', 'swayam.gov.in',
  'youtube.com', 'google.com', 'geeksforgeeks.org', 'tutorialspoint.com'
];

export function q(text) { return encodeURIComponent(text); }

export function searchLinks(cluster, paper, unit) {
  const topic = `${cluster.name} UGC NET ${paper.id === 'P1' ? 'Paper 1' : 'Computer Science Paper 2'}`;
  const topicBn = `${cluster.name} UGC NET ${paper.id === 'P1' ? 'Paper 1' : 'Computer Science'}`;
  return [
    {
      key: 'video', ic: '🎥',
      title: bi('YouTube search', 'ইউটিউব সার্চ'),
      note: bi('Free video lectures for this topic', 'এই টপিকের ফ্রি ভিডিও লেকচার'),
      badge: 'search',
      url: `https://www.youtube.com/results?search_query=${q(topic)}`
    },
    {
      key: 'reading', ic: '📖',
      title: bi('Reading (GeeksforGeeks / TutorialsPoint / NPTEL)', 'পড়া (GeeksforGeeks / TutorialsPoint / NPTEL)'),
      note: bi('Auto search across 3 free sites', '৩টি ফ্রি সাইটে স্বয়ংক্রিয় সার্চ'),
      badge: 'search',
      url: `https://www.google.com/search?q=${q(topic + ' site:geeksforgeeks.org OR site:tutorialspoint.com OR site:nptel.ac.in')}`
    },
    {
      key: 'official', ic: '🏛',
      title: bi('NPTEL course index', 'NPTEL কোর্স তালিকা'),
      note: bi('Official free course portal (root page)', 'অফিসিয়াল ফ্রি কোর্স পোর্টাল (রুট পেজ)'),
      badge: 'official',
      url: 'https://nptel.ac.in'
    },
    {
      key: 'swayam', ic: '🎓',
      title: bi('SWAYAM', 'SWAYAM'),
      note: bi('Official free MOOCs (root page)', 'অফিসিয়াল ফ্রি MOOC (রুট পেজ)'),
      badge: 'official',
      url: 'https://swayam.gov.in'
    }
  ];
}

export const OFFICIAL_LINKS = [
  { title: bi('NTA UGC NET (official)', 'NTA UGC NET (অফিসিয়াল)'), url: 'https://ugcnet.nta.ac.in', badge: 'official' },
  { title: bi('National Testing Agency', 'ন্যাশনাল টেস্টিং এজেন্সি'), url: 'https://nta.ac.in', badge: 'official' },
  { title: bi('NPTEL courses', 'NPTEL কোর্স'), url: 'https://nptel.ac.in', badge: 'official' },
  { title: bi('SWAYAM', 'SWAYAM'), url: 'https://swayam.gov.in', badge: 'official' },
  { title: bi('GeeksforGeeks (free CS reading)', 'GeeksforGeeks (ফ্রি CS পড়া)'), url: 'https://www.geeksforgeeks.org', badge: 'free' },
  { title: bi('TutorialsPoint (free reading)', 'TutorialsPoint (ফ্রি পড়া)'), url: 'https://www.tutorialspoint.com', badge: 'free' }
];

export function badgeHTML(kind, verified) {
  if (kind === 'official') return `<span class="badge b-official">Official</span>`;
  if (kind === 'free') return `<span class="badge b-free">Free 3rd-party</span>`;
  if (kind === 'search') return `<span class="badge b-search">Search link</span>`;
  if (kind === 'pin') {
    return verified
      ? `<span class="badge b-verified">My pinned (verified ✔)</span>`
      : `<span class="badge b-pin">My pinned (unverified)</span>`;
  }
  return '';
}

export function folderTree(state) {
  const clean = (s) => String(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/_+$/, '');
  const p1 = state.syllabus[0].units.map((u) => `${String(u.n).padStart(2, '0')}_${clean(u.name.en)}`).join('/');
  const p2 = state.syllabus[1].units.map((u) => `${String(u.n).padStart(2, '0')}_${clean(u.name.en)}`).join('/');
  return `NET_Compass/
├── Paper_I/
${state.syllabus[0].units.map((u) => `│   ├── U${String(u.n).padStart(2, '0')}_${clean(u.name.en)}/
│   │   ├── Notes/
│   │   ├── PYQs/
│   │   └── Resources.txt`).join('\n')}
├── Paper_II/
${state.syllabus[1].units.map((u) => `│   ├── U${String(u.n).padStart(2, '0')}_${clean(u.name.en)}/
│   │   ├── C01_${clean(u.clusters[0]?.name || 'Cluster')}/
│   │   ├── Notes/
│   │   ├── PYQs/
│   │   └── Resources.txt`).join('\n')}
├── Mocks_and_Tests/
│   ├── Paper_I/
│   ├── Paper_II/
│   └── Full_Mocks/
└── Error_Notebook/
    └── error_log.md`;
}
