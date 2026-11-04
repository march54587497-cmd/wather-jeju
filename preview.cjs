const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const fixture = url.pathname.startsWith('/test/');
  const name = url.pathname.split('/').pop() || 'index.html';
  if (fixture && name === 'current.json') {
    const key = url.searchParams.get('key');
    res.setHeader('Content-Type', 'application/json');
    if (key === 'invalid-test-key') { res.statusCode = 401; res.end(JSON.stringify({ error: { code: 2006 } })); return; }
    res.end(JSON.stringify({ current: { temp_c: 18.5, humidity: 71, condition: { text: '대체로 맑음' }, last_updated: '2026-11-04 11:30' } }));
    return;
  }
  if (!['index.html', 'style.css', 'app.js'].includes(name)) { res.statusCode = 404; res.end(); return; }
  let body = fs.readFileSync(path.join(root, name), 'utf8');
  if (fixture && name === 'app.js') body = body.replace('https://api.weatherapi.com/v1/current.json', '/test/current.json');
  res.setHeader('Content-Type', name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}).listen(8765, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:8765; fixture tests: /test/'));
