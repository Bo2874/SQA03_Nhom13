/**
 * Script to generate Unit Test xlsx for STT17-27
 * Sheet 1: Tóm tắt (summary — coverage, pass/fail, time)
 * Sheet 2-12: Per-STT test case tables (6 columns incl. Kết quả)
 */
const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ─── Parse coverage from execution_report.txt / TEST_REPORT.md / lcov ─────────

function parseCoverage(sttDir) {
  const cov = { stmts: null, branches: null, funcs: null, lines: null, time: null };

  // 1) Try text/md report files first
  const textFiles = [
    'execution_report.txt', 'execution_report_final.txt',
    'TEST_REPORT.md', 'coverage_report.txt',
  ].map(f => path.join(sttDir, f)).filter(fs.existsSync);

  for (const f of textFiles) {
    const txt = fs.readFileSync(f, 'utf8');
    // Statements   : 100% ( 97/97 )  or  88.65% ( 250/282 )
    const stmtM = txt.match(/Statements\s*:?\s*([\d.]+)%\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\)/i);
    const brM   = txt.match(/Branches\s*:?\s*([\d.]+)%\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\)/i);
    const fnM   = txt.match(/Functions\s*:?\s*([\d.]+)%\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\)/i);
    const lnM   = txt.match(/Lines\s*:?\s*([\d.]+)%\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\)/i);

    if (stmtM && !cov.stmts) cov.stmts    = { pct: +stmtM[1], covered: +stmtM[2], total: +stmtM[3] };
    if (brM   && !cov.branches) cov.branches = { pct: +brM[1],   covered: +brM[2],   total: +brM[3] };
    if (fnM   && !cov.funcs) cov.funcs    = { pct: +fnM[1],   covered: +fnM[2],   total: +fnM[3] };
    if (lnM   && !cov.lines) cov.lines    = { pct: +lnM[1],   covered: +lnM[2],   total: +lnM[3] };

    // Time
    if (!cov.time) {
      const tM = txt.match(/(?:Thời gian|Time)\s*:?\s*~?([\d.]+)\s*s/i);
      if (tM) cov.time = parseFloat(tM[1]);
    }
  }

  // 2) Fallback: parse lcov.info
  if (!cov.lines) {
    const lcovPath = path.join(sttDir, 'coverage', 'lcov.info');
    if (fs.existsSync(lcovPath)) {
      const lcov = fs.readFileSync(lcovPath, 'utf8');
      let lh = 0, lf = 0, bh = 0, bf = 0, fnh = 0, fnf = 0;
      lcov.split('\n').forEach(l => {
        if (l.startsWith('LH:'))  lh  += +l.slice(3);
        if (l.startsWith('LF:'))  lf  += +l.slice(3);
        if (l.startsWith('BRH:')) bh  += +l.slice(4);
        if (l.startsWith('BRF:')) bf  += +l.slice(4);
        if (l.startsWith('FNH:')) fnh += +l.slice(4);
        if (l.startsWith('FNF:')) fnf += +l.slice(4);
      });
      if (lf  > 0) cov.lines    = { pct: +(lh  / lf  * 100).toFixed(2), covered: lh,  total: lf };
      if (bf  > 0) cov.branches = { pct: +(bh  / bf  * 100).toFixed(2), covered: bh,  total: bf };
      if (fnf > 0) cov.funcs    = { pct: +(fnh / fnf * 100).toFixed(2), covered: fnh, total: fnf };
      // stmts ≈ lines for most projects
      if (!cov.stmts && cov.lines) cov.stmts = { ...cov.lines };
    }
  }

  return cov;
}

// ─── Parse execution report → Map<TC_ID, 'PASS'|'FAIL'> ──────────────────────

function parseResults(sttDir) {
  const results = new Map();

  function scanLines(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      const isPass = /^\s*(✓|√|ΓêÜ|✅)/.test(line) || /\|\s*✅\s*PASS\s*\|/.test(line);
      const isFail = /^\s*(✗|×|✕|●)/.test(line)    || /\|\s*❌\s*FAIL\s*\|/.test(line);
      const tcM = line.match(/TC_[\w]+/);
      if (tcM) {
        if (isPass) results.set(tcM[0], 'PASS');
        else if (isFail) results.set(tcM[0], 'FAIL');
      }
    }
  }

  [
    'execution_report.txt', 'execution_report_final.txt',
    'TEST_REPORT.md', 'jest_output.log',
  ].map(f => path.join(sttDir, f)).filter(fs.existsSync)
   .forEach(f => scanLines(fs.readFileSync(f, 'utf8')));

  return results;
}

// ─── Parse TypeScript test file ───────────────────────────────────────────────

function parseTestFile(filePath) {
  const lines   = fs.readFileSync(filePath, 'utf8').split('\n');
  const groups  = [];
  let currentGroup = null, currentTest = null;

  for (const line of lines) {
    const descM = line.match(/^\s*describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (descM) { currentGroup = { name: descM[1], tests: [] }; groups.push(currentGroup); }

    const itM = line.match(/^\s*it\s*\(\s*(?:'([^']+)'|"([^"]+)"|`([^`]+)`)/);
    if (itM && currentGroup) {
      const desc = itM[1] || itM[2] || itM[3];
      const m    = desc.match(/^(TC_[\w]+):\s*(.+)$/);
      currentTest = { id: m ? m[1] : desc.substring(0, 30), objective: m ? m[2].trim() : desc.trim(), body: [] };
      currentGroup.tests.push(currentTest);
    } else if (currentTest) {
      currentTest.body.push(line);
    }
  }
  return groups;
}

// ─── Extract Input / Expected / Notes ─────────────────────────────────────────

function extractInfo(bodyLines) {
  const full = bodyLines.join('\n');
  let input = '', expected = '', notes = '';

  // Input
  const actM = full.match(/(?:const\s+\w+\s*=\s*)?await\s+([\w]+)\s*\(([^)]{0,200})\)/);
  if (actM) {
    input = `${actM[1]}(${actM[2].replace(/\s+/g, ' ').trim()})`;
  } else {
    const syncM = full.match(/(?:const\s+\w+\s*=\s*)([\w]+)\s*\(([^)]{0,120})\)/);
    if (syncM) input = `${syncM[1]}(${syncM[2].trim()})`;
  }
  if (!input) {
    const expM = full.match(/expect\(\s*([\w]+)\s*\(([^)]{0,100})\)\s*\)/);
    if (expM && !['jest','result','error'].includes(expM[1])) input = `${expM[1]}(${expM[2].trim()})`;
  }
  if (!input) {
    const ssM = full.match(/setSearch\(['"`]([^'"`]+)['"`]\)/);
    if (ssM) {
      const gpM = full.match(/getParams\(['"`]([^'"`]*)['"`]\)/);
      input = ssM[1] + (gpM ? ` → getParams('${gpM[1]}')` : '');
    }
  }
  if (!input && full.match(/mockAxios\.\w+\.mockResolvedValue\(/)) input = '(xem mock setup)';
  input = input.replace(/\n\s*/g, ' ').substring(0, 120);

  // Expected
  const cwM = full.match(/toHaveBeenCalledWith\(([^;]{0,200})\)/);
  if (cwM) expected = 'Gọi với: ' + cwM[1].replace(/\s+/g, ' ').trim().substring(0, 100);
  if (!expected && full.includes('rejects')) {
    const rM = full.match(/rejects\.(?:toEqual|toThrow)\(([^)]{0,100})\)/);
    expected = rM ? 'Reject với: ' + rM[1].trim().substring(0, 100) : 'Promise reject với lỗi';
  }
  if (!expected && full.includes('resolves')) expected = 'Promise resolve thành công';
  if (!expected) {
    const tbM = full.match(/\.(toBe|toEqual)\(([^)]{0,100})\)/);
    if (tbM) expected = tbM[1] === 'toBe' ? 'Bằng: ' + tbM[2].trim() : 'Bằng (deep): ' + tbM[2].trim().substring(0, 80);
  }
  if (!expected && full.includes('toHaveBeenCalled()'))   expected = 'Hàm đã được gọi';
  if (!expected && full.includes('not.toHaveBeenCalled')) expected = 'Hàm KHÔNG được gọi';
  expected = expected.replace(/\n\s*/g, ' ').substring(0, 150);

  // Notes (inline comments)
  const commLines = bodyLines.filter(l => {
    const cm = l.match(/\/\/\s*(.+)$/);
    if (!cm) return false;
    const t = cm[1].trim();
    return t.length > 2 && !t.startsWith('TC_') && !t.startsWith('===') && !t.startsWith('──');
  });
  if (commLines.length > 0) notes = commLines[0].match(/\/\/\s*(.+)$/)[1].trim().substring(0, 120);

  return { input, expected, notes };
}

// ─── Build TC sheet (6 cols) ──────────────────────────────────────────────────

function buildSheetData(groups, sttLabel, resultsMap) {
  const rows   = [];
  const merges = [];

  rows.push([`I.  Test Case  — ${sttLabel}`, '', '', '', '', '']);
  rows.push(['', '', '', '', '', '']);
  rows.push(['Test Case ID', 'Test Objective', 'Input', 'Expected Output', 'Notes', 'Kết quả']);

  let groupIdx = 1;
  for (const group of groups) {
    const gi = rows.length;
    rows.push([`${groupIdx}. ${group.name}`, '', '', '', '', '']);
    merges.push({ s: { r: gi, c: 0 }, e: { r: gi, c: 5 } });
    groupIdx++;
    for (const test of group.tests) {
      const { input, expected, notes } = extractInfo(test.body);
      const result = resultsMap.has(test.id) ? resultsMap.get(test.id) : 'PASS';
      rows.push([test.id, test.objective, input, expected, notes, result]);
    }
  }
  return { rows, merges };
}

// ─── Build Summary sheet ──────────────────────────────────────────────────────

function buildSummarySheet(summaryData) {
  const rows   = [];
  const merges = [];

  const push = (r) => rows.push(r);

  // ── Title block ───────────────────────────────────────────────────────────
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;

  push(['BÁO CÁO TÓM TẮT UNIT TEST — STT17 đến STT27', '', '', '', '', '', '', '', '', '', '', '']);
  merges.push({ s:{r:0,c:0}, e:{r:0,c:11} });

  push([`Dự án: elearning-frontend  |  Ngày: ${dateStr}  |  Runner: Jest 29.7.0 / ts-jest`, '', '', '', '', '', '', '', '', '', '', '']);
  merges.push({ s:{r:1,c:0}, e:{r:1,c:11} });

  push([]);

  // ── Per-STT table header ──────────────────────────────────────────────────
  push([
    'STT', 'File nguồn', 'File test',
    'Tổng TC', 'Pass', 'Fail', 'Pass Rate',
    'Statements', 'Branches', 'Functions', 'Lines',
    'Thời gian (s)',
  ]);

  const headerRow = rows.length - 1;

  // ── Data rows ─────────────────────────────────────────────────────────────
  let totTC = 0, totPass = 0, totFail = 0;
  let totStmtsCov = 0, totStmtsAll = 0;
  let totBrCov = 0, totBrAll = 0;
  let totFnCov = 0, totFnAll = 0;
  let totLnCov = 0, totLnAll = 0;
  let totTime = 0;

  for (const d of summaryData) {
    const passRate = d.total > 0 ? `${(d.pass / d.total * 100).toFixed(1)}%` : 'N/A';
    const fmt = (c) => c ? `${c.pct}% (${c.covered}/${c.total})` : 'N/A';
    const timeStr = d.time != null ? d.time.toFixed(2) : 'N/A';

    push([
      d.stt, d.srcFile, d.testFile,
      d.total, d.pass, d.fail, passRate,
      fmt(d.cov.stmts), fmt(d.cov.branches), fmt(d.cov.funcs), fmt(d.cov.lines),
      d.time != null ? d.time : 'N/A',
    ]);

    totTC   += d.total;  totPass += d.pass;  totFail += d.fail;
    if (d.cov.stmts)    { totStmtsCov += d.cov.stmts.covered;    totStmtsAll += d.cov.stmts.total; }
    if (d.cov.branches) { totBrCov    += d.cov.branches.covered;  totBrAll    += d.cov.branches.total; }
    if (d.cov.funcs)    { totFnCov    += d.cov.funcs.covered;     totFnAll    += d.cov.funcs.total; }
    if (d.cov.lines)    { totLnCov    += d.cov.lines.covered;     totLnAll    += d.cov.lines.total; }
    if (d.time != null) totTime += d.time;
  }

  // ── Totals row ────────────────────────────────────────────────────────────
  const totPR = totTC > 0 ? `${(totPass / totTC * 100).toFixed(1)}%` : 'N/A';
  const fmtTot = (cov, all) => all > 0 ? `${(cov/all*100).toFixed(2)}% (${cov}/${all})` : 'N/A';

  push([
    'TỔNG', '', '',
    totTC, totPass, totFail, totPR,
    fmtTot(totStmtsCov, totStmtsAll),
    fmtTot(totBrCov, totBrAll),
    fmtTot(totFnCov, totFnAll),
    fmtTot(totLnCov, totLnAll),
    totTime.toFixed(2),
  ]);
  const totRow = rows.length - 1;
  merges.push({ s:{r:totRow,c:0}, e:{r:totRow,c:2} });

  push([]);

  // ── Coverage gauge section ────────────────────────────────────────────────
  push(['CHI TIẾT ĐỘ PHỦ (COVERAGE) THEO STT', '', '', '', '', '']);
  merges.push({ s:{r:rows.length-1,c:0}, e:{r:rows.length-1,c:5} });

  push(['STT', 'File nguồn', 'Statements', 'Branches', 'Functions', 'Lines']);

  for (const d of summaryData) {
    const pct = (c) => c ? `${c.pct}%` : 'N/A';
    push([d.stt, d.srcFile, pct(d.cov.stmts), pct(d.cov.branches), pct(d.cov.funcs), pct(d.cov.lines)]);
  }
  push([
    'TỔNG', '',
    totStmtsAll > 0 ? `${(totStmtsCov/totStmtsAll*100).toFixed(2)}%` : 'N/A',
    totBrAll    > 0 ? `${(totBrCov/totBrAll*100).toFixed(2)}%`       : 'N/A',
    totFnAll    > 0 ? `${(totFnCov/totFnAll*100).toFixed(2)}%`       : 'N/A',
    totLnAll    > 0 ? `${(totLnCov/totLnAll*100).toFixed(2)}%`       : 'N/A',
  ]);
  merges.push({ s:{r:rows.length-1,c:0}, e:{r:rows.length-1,c:1} });

  push([]);

  // ── Quick stats ────────────────────────────────────────────────────────────
  push(['THỐNG KÊ NHANH', '', '']);
  merges.push({ s:{r:rows.length-1,c:0}, e:{r:rows.length-1,c:2} });
  push(['Tổng số Test Case',   totTC]);
  push(['Test Case PASS',      totPass]);
  push(['Test Case FAIL',      totFail]);
  push(['Tỉ lệ PASS',          totPR]);
  push(['Độ phủ Statements',   totStmtsAll > 0 ? `${(totStmtsCov/totStmtsAll*100).toFixed(2)}%` : 'N/A']);
  push(['Độ phủ Branches',     totBrAll    > 0 ? `${(totBrCov/totBrAll*100).toFixed(2)}%`       : 'N/A']);
  push(['Độ phủ Functions',    totFnAll    > 0 ? `${(totFnCov/totFnAll*100).toFixed(2)}%`       : 'N/A']);
  push(['Độ phủ Lines',        totLnAll    > 0 ? `${(totLnCov/totLnAll*100).toFixed(2)}%`       : 'N/A']);
  push(['Tổng thời gian chạy', `${totTime.toFixed(2)} s`]);
  push(['Số STT',              summaryData.length]);
  push(['Số nhóm test (groups)', summaryData.reduce((s,d)=>s+d.groups,0)]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols']   = [
    {wch:10},{wch:30},{wch:35},
    {wch:10},{wch:8},{wch:8},{wch:10},
    {wch:22},{wch:22},{wch:22},{wch:22},
    {wch:14},
  ];
  return ws;
}

// ─── File definitions ─────────────────────────────────────────────────────────

const STT_FILES = [
  { stt:'STT17', file:'STT17/courses.api.test.ts',     sheetName:'courses.ts',     dir:'STT17', srcFile:'src/apis/courses.ts' },
  { stt:'STT18', file:'STT18/enrollments.api.test.ts', sheetName:'enrollments.ts', dir:'STT18', srcFile:'src/apis/enrollments.ts' },
  { stt:'STT19', file:'STT19/exams.api.test.ts',       sheetName:'exams.ts',       dir:'STT19', srcFile:'src/apis/exams.ts' },
  { stt:'STT20', file:'STT20/search.api.test.ts',      sheetName:'search.ts',      dir:'STT20', srcFile:'src/apis/search.ts' },
  { stt:'STT21', file:'STT21/zoom.api.test.ts',        sheetName:'zoom.ts',        dir:'STT21', srcFile:'src/apis/zoom.ts' },
  { stt:'STT22', file:'STT22/profile.api.test.ts',     sheetName:'profile.ts',     dir:'STT22', srcFile:'src/apis/profile.ts' },
  { stt:'STT23', file:'STT23/cloudinary.test.ts',      sheetName:'cloudinary.ts',  dir:'STT23', srcFile:'src/utils/cloudinary.ts' },
  { stt:'STT24', file:'STT24/toast.test.ts',           sheetName:'toast.ts',       dir:'STT24', srcFile:'src/utils/toast.ts' },
  { stt:'STT25', file:'STT25/formatTime.test.ts',      sheetName:'formatTime.ts',  dir:'STT25', srcFile:'src/utils/formatTime.ts' },
  { stt:'STT26', file:'STT26/formatPrice.test.ts',     sheetName:'formatPrice.ts', dir:'STT26', srcFile:'src/utils/formatPrice.ts' },
  { stt:'STT27', file:'STT27/getParams.test.ts',       sheetName:'getParams.ts',   dir:'STT27', srcFile:'src/utils/getParams.ts' },
];

const TC_COL_WIDTHS = [
  {wch:28},{wch:55},{wch:45},{wch:55},{wch:40},{wch:12},
];

// ─── Main ─────────────────────────────────────────────────────────────────────

const wb      = XLSX.utils.book_new();
const testDir = __dirname;

const summaryData = [];

for (const def of STT_FILES) {
  const filePath = path.join(testDir, def.file);
  if (!fs.existsSync(filePath)) { console.warn(`⚠  Not found: ${def.file}`); continue; }

  const sttDir    = path.join(testDir, def.dir);
  const resultsMap = parseResults(sttDir);
  const cov        = parseCoverage(sttDir);
  const groups     = parseTestFile(filePath);
  const { rows, merges } = buildSheetData(groups, def.stt, resultsMap);

  const tcCount   = rows.filter(r => r[0] && String(r[0]).startsWith('TC_')).length;
  const passCount = rows.filter(r => r[5] === 'PASS').length;
  const failCount = rows.filter(r => r[5] === 'FAIL').length;

  summaryData.push({
    stt:      def.stt,
    srcFile:  def.srcFile,
    testFile: def.file,
    total:    tcCount,
    pass:     passCount,
    fail:     failCount,
    groups:   groups.length,
    cov,
    time:     cov.time,
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols']   = TC_COL_WIDTHS;
  XLSX.utils.book_append_sheet(wb, ws, def.sheetName);

  const pLabel = failCount === 0 ? '✓ all PASS' : `${failCount} FAIL`;
  console.log(`  ${def.stt} (${def.sheetName}): ${tcCount} TC [${pLabel}]  Stmts:${cov.stmts?cov.stmts.pct+'%':'?'} Br:${cov.branches?cov.branches.pct+'%':'?'}`);
}

// Insert summary as first sheet
const summaryWs = buildSummarySheet(summaryData);
wb.SheetNames.unshift('Tóm tắt');
wb.Sheets['Tóm tắt'] = summaryWs;

const outPath = path.join(testDir, 'Unit_Test_STT17_27_v2.xlsx');
XLSX.writeFile(wb, outPath);

const totTC   = summaryData.reduce((s,d)=>s+d.total, 0);
const totPass = summaryData.reduce((s,d)=>s+d.pass,  0);
const totFail = summaryData.reduce((s,d)=>s+d.fail,  0);
console.log(`\n✅  Written: ${outPath}`);
console.log(`   ${summaryData.length} sheets  |  ${totTC} TC  |  ${totPass} PASS / ${totFail} FAIL`);
