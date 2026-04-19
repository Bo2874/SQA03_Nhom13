/**
 * Serve coverage HTML report via HTTP
 * Usage: node serve-coverage.js [port] [stt-number]
 * Example: node serve-coverage.js 8000 17
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2] || 8000);
const STT = process.argv[3] || '17';
const COVERAGE_DIR = path.join(__dirname, `STT${STT}_coverage`);

// Fallback to old path if new doesn't exist
const COVERAGE_PATH = fs.existsSync(COVERAGE_DIR)
  ? COVERAGE_DIR
  : path.join(__dirname, `STT${STT}`, 'coverage');

if (!fs.existsSync(COVERAGE_PATH)) {
  console.error(`❌ Coverage directory not found: ${COVERAGE_PATH}`);
  console.error(`Run: npm run coverage:${STT}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // Remove trailing slash
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/') pathname = '/index.html';

  const filepath = path.join(COVERAGE_PATH, pathname);

  // Security: prevent directory traversal
  if (!filepath.startsWith(COVERAGE_PATH)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Serve file
  fs.readFile(filepath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    // Guess content type
    const ext = path.extname(filepath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.info': 'text/plain',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, 'localhost', () => {
  const href = `http://localhost:${PORT}/index.html`;
  console.log(`\n✅ Coverage server running at: ${href}`);
  console.log(`\nPath: ${COVERAGE_PATH}`);
  console.log(`STT: ${STT}`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Auto-open browser on supported platforms
  try {
    const { exec } = require('child_process');
    const cmd = process.platform === 'win32'
      ? `start "${href}"`
      : process.platform === 'darwin'
      ? `open "${href}"`
      : `xdg-open "${href}"`;
    exec(cmd);
  } catch (e) {
    // ignore
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n\n✅ Server stopped.');
    process.exit(0);
  });
});
