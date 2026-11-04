'use strict';
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'jeju-weather-api-key';
if (typeof location !== 'undefined' && location.protocol === 'file:') {
  $('file-help').hidden = false;
}
let apiKey = '';
let activeRequest = null;
try { apiKey = (localStorage.getItem(STORAGE_KEY) || '').trim(); } catch { /* Storage can be unavailable in private contexts. */ }
$('api-key').value = apiKey;
$('settings').open = !apiKey;

function setStatus(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

function resetWeather() {
  $('temperature').textContent = '—';
  $('humidity').textContent = '—';
  $('updated').textContent = '아직 업데이트 전';
  $('condition').textContent = '날씨를 불러올 준비가 되었어요';
  $('badge').textContent = '연결 대기';
  $('badge').classList.remove('live');
}

async function loadWeather() {
  if (!apiKey) {
    setStatus('날씨를 확인하려면 API 키를 입력해 주세요.');
    $('settings').open = true;
    return;
  }
  if (activeRequest) activeRequest.abort();
  const controller = new AbortController();
  activeRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 15000);
  $('refresh').disabled = true;
  document.querySelector('.weather-card').setAttribute('aria-busy', 'true');
  setStatus('제주의 현재 날씨를 불러오는 중이에요…');
  try {
    const params = new URLSearchParams({ key: apiKey, q: '33.4996,126.5312', lang: 'ko', aqi: 'no' });
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?${params}`, { signal: controller.signal, cache: 'no-store' });
    let data;
    try { data = await response.json(); }
    catch { throw new Error(`날씨 서버에서 올바른 응답을 받지 못했어요 (HTTP ${response.status}). 잠시 후 다시 시도해 주세요.`); }
    if (activeRequest !== controller) return;
    if (!response.ok || data.error) {
      const code = data.error?.code;
      if ([1002, 2006, 2008].includes(code)) {
        $('settings').open = true;
        $('api-key').setAttribute('aria-invalid', 'true');
        throw new Error(`API 키를 확인해 주세요 (오류 ${code}). WeatherAPI.com 계정의 API Key를 복사해 아래에 다시 입력해 주세요.`);
      }
      if (code === 2007) throw new Error('WeatherAPI의 이번 달 요청 한도를 초과했어요 (오류 2007).');
      if (code === 2009) throw new Error('이 API 키에 현재 날씨 조회 권한이 없어요 (오류 2009). WeatherAPI 요금제와 권한을 확인해 주세요.');
      throw new Error(`날씨 요청에 실패했어요 (${code ? `오류 ${code}` : `HTTP ${response.status}`}). 잠시 후 다시 시도해 주세요.`);
    }
    const current = data.current;
    if (!current || !Number.isFinite(current.temp_c) || !Number.isFinite(current.humidity) || !current.condition?.text || !current.last_updated) {
      throw new Error('날씨 데이터가 올바르지 않아요. 다시 시도해 주세요.');
    }
    $('temperature').textContent = current.temp_c.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
    $('humidity').textContent = current.humidity;
    $('condition').textContent = current.condition.text;
    // WeatherAPI returns the requested location's local time (Jeju: KST).
    $('updated').textContent = current.last_updated.replace(/^(\d{4})-(\d{2})-(\d{2}) /, '$1. $2. $3.  ');
    $('badge').textContent = '● 현재 날씨';
    $('badge').classList.add('live');
    $('api-key').setAttribute('aria-invalid', 'false');
    let saved = true;
    try { localStorage.setItem(STORAGE_KEY, apiKey); } catch { saved = false; }
    setStatus(saved ? '방금 날씨를 불러왔어요.' : '날씨를 불러왔어요. 브라우저가 키 저장을 차단해 다음에 다시 입력해야 해요.');
    $('settings').open = false;
  } catch (error) {
    if (activeRequest !== controller) return;
    setStatus(error.name === 'AbortError' ? '15초 동안 응답이 없어요. 인터넷 연결을 확인하고 새로고침해 주세요.' : error instanceof TypeError ? 'WeatherAPI에 연결하지 못했어요. 인터넷 연결, 광고 차단 확장 기능 또는 네트워크 차단 여부를 확인해 주세요.' : error.message, true);
    $('badge').textContent = '업데이트 실패';
    $('badge').classList.remove('live');
    if ($('temperature').textContent !== '—') setStatus($('status').textContent + ' 이전에 불러온 날씨를 표시하고 있어요.', true);
  } finally {
    clearTimeout(timeout);
    if (activeRequest === controller) {
      activeRequest = null;
      $('refresh').disabled = false;
      document.querySelector('.weather-card').setAttribute('aria-busy', 'false');
    }
  }
}

$('refresh').addEventListener('click', loadWeather);
$('key-form').addEventListener('submit', (event) => {
  event.preventDefault();
  apiKey = $('api-key').value.trim();
  if (!apiKey) { setStatus('API 키를 입력해 주세요.', true); return; }
  loadWeather();
});
$('forget').addEventListener('click', () => {
  if (activeRequest) { activeRequest.abort(); activeRequest = null; }
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Continue clearing session state. */ }
  apiKey = '';
  $('api-key').value = '';
  $('refresh').disabled = false;
  document.querySelector('.weather-card').setAttribute('aria-busy', 'false');
  resetWeather();
  setStatus('저장된 API 키를 삭제했어요.');
  $('settings').open = true;
});
loadWeather();

