/**
 * Inject group-only report into coverage HTML.
 * Usage: node inject-group-summary.js <STT>
 */
const fs = require('fs');
const path = require('path');

const STT = process.argv[2];
if (!STT) {
  console.error('Missing STT number. Usage: node inject-group-summary.js <STT>');
  process.exit(1);
}

const testDir = path.join(__dirname, `STT${STT}`);
const projectRoot = path.resolve(__dirname, '..');
const claudeDir = path.join(projectRoot, '.claude');

const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.ts')).map((f) => path.join(testDir, f));
const groupCounts = new Map();
const groupOrder = [];
const groupFunctions = new Map();
const groupLabels = new Map();

const describeRegex = /describe\(\s*['"`](Nhóm\s+[^'"`]+)['"`]\s*,/;
const groupKeyRegex = /(Nhóm\s+([A-Z]))/i;
const testRegex = /^\s*(it|test)\(\s*['"`]/;

for (const filePath of testFiles) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let currentGroup = null;
  for (const line of lines) {
    const m = line.match(describeRegex);
    if (m) {
      currentGroup = m[1].trim();
      const km = currentGroup.match(groupKeyRegex);
      const key = km ? `Nhóm ${km[2].toUpperCase()}` : currentGroup;
      if (!groupCounts.has(key)) {
        groupCounts.set(key, 0);
        groupOrder.push(key);
        groupFunctions.set(key, new Set());
      }
      groupLabels.set(key, currentGroup);
      continue;
    }
    if (currentGroup && testRegex.test(line)) {
      const km = currentGroup.match(groupKeyRegex);
      const key = km ? `Nhóm ${km[2].toUpperCase()}` : currentGroup;
      groupCounts.set(key, groupCounts.get(key) + 1);
    }
  }
}

const totalTests = Array.from(groupCounts.values()).reduce((a, b) => a + b, 0);

const planFiles = fs.readdirSync(claudeDir).filter((f) => f.startsWith(`STT${STT}_`) && f.endsWith('.md'));
const planPath = path.join(claudeDir, planFiles[0]);
const planLines = fs.readFileSync(planPath, 'utf8').split(/\r?\n/);
const groupHeadingRegex = /^#{2,3}\s+(Nhóm\s+[A-Z]\s+—\s+.+)$/;
const tableRowRegex = /^\|.+\|$/;

let planGroup = null;
let functionColIndex = null;
let awaitingSeparator = false;
for (const line of planLines) {
  const hm = line.match(groupHeadingRegex);
  if (hm) {
    const raw = hm[1].trim();
    const km = raw.match(groupKeyRegex);
    const key = km ? `Nhóm ${km[2].toUpperCase()}` : raw;
    planGroup = key;
    if (!groupFunctions.has(key)) groupFunctions.set(key, new Set());
    if (!groupLabels.has(key)) groupLabels.set(key, raw);
    functionColIndex = null;
    awaitingSeparator = false;
    continue;
  }
  if (!planGroup) continue;

  if (tableRowRegex.test(line)) {
    const cols = line.split('|').slice(1, -1).map((c) => c.trim());
    const isSep = cols.every((c) => /^-+$/.test(c));
    if (functionColIndex === null) {
      const idx = cols.findIndex((c) => c.toLowerCase() === 'function');
      if (idx !== -1) {
        functionColIndex = idx;
        awaitingSeparator = true;
      }
      continue;
    }
    if (awaitingSeparator) {
      if (isSep) awaitingSeparator = false;
      continue;
    }
    if (isSep) continue;
    const fn = (cols[functionColIndex] || '').replace(/`/g, '').replace(/\(.*\)$/, '').trim();
    if (fn) groupFunctions.get(planGroup).add(fn);
  } else if (functionColIndex !== null) {
    functionColIndex = null;
    awaitingSeparator = false;
  }
}

const lcovPath = path.join(testDir, 'coverage', 'lcov.info');
const lcovLines = fs.readFileSync(lcovPath, 'utf8').split(/\r?\n/);
const functionHits = new Map();
const getTotal = (key) => {
  const line = lcovLines.find((l) => l.startsWith(`${key}:`));
  if (!line) return null;
  const n = Number(line.slice(key.length + 1));
  return Number.isFinite(n) ? n : null;
};

for (const line of lcovLines) {
  if (line.startsWith('FNDA:')) {
    const p = line.slice(5).split(',');
    if (p.length >= 2) functionHits.set(p.slice(1).join(',').trim(), parseInt(p[0], 10));
  }
}

for (const [k, set] of groupFunctions.entries()) {
  const filtered = new Set();
  for (const fn of set) if (functionHits.has(fn)) filtered.add(fn);
  groupFunctions.set(k, filtered);
}

const excluded = groupOrder.filter((k) => (groupFunctions.get(k) ? Array.from(groupFunctions.get(k)).length : 0) === 0)
  .map((k) => groupLabels.get(k) || k);

const rowsHtml = groupOrder.map((k) => {
  const funcs = groupFunctions.get(k) ? Array.from(groupFunctions.get(k)) : [];
  if (funcs.length === 0) return null;
  let covered = 0;
  for (const fn of funcs) if ((functionHits.get(fn) || 0) > 0) covered += 1;
  const pass = covered === funcs.length;
  const cls = pass ? 'high' : 'low';
  return `\n<tr><td class="file ${cls}">${groupLabels.get(k) || k}</td><td class="pct ${cls}">${groupCounts.get(k) || 0}</td><td class="pct ${cls}">${covered}/${funcs.length}</td><td class="pct ${cls}">${Math.round((covered / funcs.length) * 100)}%</td><td class="pct ${cls}"><strong>${pass ? 'PASS' : 'FAIL'}</strong></td></tr>`;
}).filter(Boolean).join('');

const metric = (hit, total) => {
  if (!Number.isFinite(hit) || !Number.isFinite(total) || total <= 0) return 'N/A';
  return `${Math.round((hit / total) * 100)}%`;
};

const summaryBlock = `\n<!-- GROUP_SUMMARY_START -->\n<style>
  .wrapper, .footer { display: none !important; }
  .custom-report { font-family: Arial, sans-serif; padding: 16px; }
  .custom-report .metrics { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 14px; }
  .custom-report .metric .value { font-size: 24px; font-weight: 700; }
</style>
<div class="custom-report">
  <h2>Total Coverage</h2>
  <div class="metrics">
    <div class="metric"><div class="value">${metric(getTotal('LH'), getTotal('LF'))}</div><div>Lines</div></div>
    <div class="metric"><div class="value">${metric(getTotal('BRH'), getTotal('BRF'))}</div><div>Branches</div></div>
    <div class="metric"><div class="value">${metric(getTotal('FNH'), getTotal('FNF'))}</div><div>Functions</div></div>
    <div class="metric"><div class="value">${metric(getTotal('LH'), getTotal('LF'))}</div><div>Statements</div></div>
  </div>
  <h2>Test Groups</h2>
  <table class="coverage-summary">
    <thead>
      <tr>
        <th class="file">Group</th>
        <th class="pct">Test Cases</th>
        <th class="pct">Funcs Covered</th>
        <th class="pct">Func Coverage</th>
        <th class="pct">Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}
      <tr>
        <td class="file high"><strong>Total</strong></td>
        <td class="pct high"><strong>${totalTests}</strong></td>
        <td class="pct high"><strong>-</strong></td>
        <td class="pct high"><strong>-</strong></td>
        <td class="pct high"><strong>-</strong></td>
      </tr>
    </tbody>
  </table>
  <p class="quiet">Nhóm không có mapping Function bị loại khỏi bảng đánh giá: ${excluded.length ? excluded.join(', ') : 'Không có'}.</p>
</div>
<!-- GROUP_SUMMARY_END -->\n`;

const coverageIndex = path.join(testDir, 'coverage', 'index.html');
let html = fs.readFileSync(coverageIndex, 'utf8');
html = html.replace(/<!-- GROUP_SUMMARY_START -->[\s\S]*?<!-- GROUP_SUMMARY_END -->/g, '');
if (/<body>[\s\S]*<\/body>/i.test(html)) {
  html = html.replace(/<body>[\s\S]*<\/body>/i, `<body>${summaryBlock}</body>`);
} else {
  html = `${summaryBlock}\n${html}`;
}
fs.writeFileSync(coverageIndex, html, 'utf8');
console.log(`✅ Injected group summary into: ${coverageIndex}`);
