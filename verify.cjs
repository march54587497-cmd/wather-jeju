const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('dist/app.js', 'utf8');
async function run() {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: id === 'temperature' ? '—' : '', value: '', classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, addEventListener(type, handler) { this[type] = handler; } });
    return nodes.get(id);
  };
  const storage = new Map([['jeju-weather-api-key', 'test-key']]);
  let requested;
  let failure = false;
  let delay = false;
  let release;
  const context = vm.createContext({ document: { getElementById: node, querySelector: node }, localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) }, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch: async url => {
    requested = new URL(url);
    if (delay) await new Promise(resolve => { release = resolve; });
    return { ok: !failure, json: async () => failure ? { error: { code: 2006 } } : { current: { temp_c: 18.5, humidity: 71, condition: { text: '대체로 맑음' }, last_updated: '2026-11-04 11:30' } } };
  } });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  assert.equal(requested.pathname, '/v1/current.json');
  assert.equal(requested.searchParams.get('lang'), 'ko');
  assert.equal(requested.searchParams.get('q'), '33.4996,126.5312');
  assert.equal(node('temperature').textContent, '18.5');
  assert.equal(node('humidity').textContent, 71);
  assert.equal(node('condition').textContent, '대체로 맑음');
  assert.match(node('updated').textContent, /11:30/);
  failure = true;
  await node('refresh').click();
  assert.match(node('status').textContent, /API 키를 확인/);
  assert.match(node('status').textContent, /이전에 불러온 날씨/);
  assert.equal(node('settings').open, true, 'Invalid keys must reopen settings');
  assert.equal(storage.get('jeju-weather-api-key'), 'test-key');
  failure = false;
  delay = true;
  const pending = node('refresh').click();
  node('forget').click();
  release();
  await pending;
  assert.equal(storage.size, 0);
  assert.equal(node('temperature').textContent, '—');
  await node('refresh').click();
  assert.equal(node('settings').open, true);
  assert.match(node('status').textContent, /API 키를 입력/);
  console.log('PASS: automatic loading, Korean request, weather display, refresh, invalid-key recovery, key deletion during request and empty-key guidance');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
