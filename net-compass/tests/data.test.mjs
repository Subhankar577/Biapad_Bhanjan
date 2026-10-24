import {PAPERS, paperSessionCount, syllabusTotals, clusterCount} from '../js/data/syllabus.js';
for (const p of PAPERS) console.log(p.id, paperSessionCount(p), p.units.length, p.units.map(u=>u.clusters.length).join(','));
console.log(syllabusTotals(PAPERS), 'clusters', clusterCount(PAPERS));
