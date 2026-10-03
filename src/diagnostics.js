const BASE = (import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const nativeFetch = globalThis.fetch.bind(globalThis);
const sent = new Map();
let count = 0;
const ROUTE_PARTS = new Set('api diagnostics client-errors auth me logout login oauth success error oauth2 authorization code google admin members settings messages unread-count lesson-notices applied-schedule-item-ids applied-class-ids class-applications public schedules corkboard corkboards current archive notes events lessons applications teachers notices read privacy my-classes assets'.split(' '));

// Never collect messages, query strings, request/response bodies, storage or cookies.
export function safePath(value) {
  try {
    return new URL(value, 'https://local.invalid').pathname.split('/').map(part =>
      ROUTE_PARTS.has(part) ? part : part ? ':id' : ''
    ).join('/').slice(0, 200);
  } catch { return '/unknown'; }
}

export function safeFrames(stack) {
  return String(stack || '').split('\n').slice(1).map(line => {
    const match = line.match(/(?:\/|\\)([A-Za-z0-9_.-]+\.(?:jsx|tsx|js))(?:\?[^:\s)]*)?(?::(\d+))?(?::(\d+))?/);
    return match ? `${match[1]}:${match[2] || 0}:${match[3] || 0}` : '';
  }).filter(Boolean).slice(0, 12).join('\n');
}

export function reportError(kind, error, details = {}) {
  const eventId = globalThis.crypto?.randomUUID?.() || `event-${Date.now()}-${count}`;
  const payload = {
    eventId, kind,
    errorType: /^[A-Za-z][A-Za-z0-9]{0,60}$/.test(error?.name || '') ? error.name : 'Error',
    frames: safeFrames(error?.stack),
    page: safePath(globalThis.location?.href || '/'),
    endpoint: details.endpoint ? safePath(details.endpoint) : '',
    status: Number(details.status) || 0,
    requestId: /^[a-f0-9-]{36}$/.test(details.requestId || '') ? details.requestId : '',
    build: typeof __BUILD_VERSION__ === 'undefined' ? 'development' : __BUILD_VERSION__,
  };
  const key = JSON.stringify({ ...payload, eventId: '' });
  if (sent.has(key)) return sent.get(key);
  if (count >= 30) return eventId;
  sent.set(key, eventId); count += 1;
  nativeFetch(`${BASE}/api/diagnostics/client-errors`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'omit', keepalive: true, body: JSON.stringify(payload),
  }).catch(() => {}); // Reporting must never recurse or break the app.
  return eventId;
}

export function installDiagnostics() {
  globalThis.addEventListener('error', event => {
    if (event.error) reportError('javascript', event.error);
    else reportError('resource', { name: 'ResourceError', stack: `resource\n${event.target?.src || event.target?.href || ''}` });
  }, true);
  globalThis.addEventListener('unhandledrejection', event => reportError('promise', event.reason));
  for (const level of ['error', 'warn']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      original(...args);
      reportError('handled', args.find(value => value instanceof Error) || { name: level === 'warn' ? 'ConsoleWarning' : 'ConsoleError' });
    };
  }
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, globalThis.location.href);
    const isApi = url.origin === new URL(BASE || globalThis.location.origin, globalThis.location.href).origin && url.pathname.startsWith('/api/');
    try {
      const response = await nativeFetch(input, init);
      if (isApi && !response.ok) reportError('api', { name: 'HttpError' }, {
        endpoint: url.href, status: response.status, requestId: response.headers.get('X-Request-ID'),
      });
      if (isApi) {
        const readJson = response.json.bind(response);
        response.json = () => readJson().catch(error => {
          reportError('api', error, { endpoint: url.href, status: response.status, requestId: response.headers.get('X-Request-ID') });
          throw error;
        });
      }
      return response;
    } catch (error) {
      if (isApi && error?.name !== 'AbortError') reportError('network', error, { endpoint: url.href });
      throw error;
    }
  };
}

export function showRecovery(eventId) {
  const root = document.getElementById('root');
  if (!root) return;
  root.replaceChildren();
  const panel = document.createElement('div');
  panel.style.cssText = 'max-width:520px;margin:15vh auto;padding:24px;font-family:system-ui;line-height:1.7;overflow-wrap:anywhere';
  const text = document.createElement('p');
  text.textContent = `화면을 표시하는 중 오류가 발생했습니다. / Something went wrong. 오류 번호 / Error ID: ${eventId}`;
  const button = document.createElement('button');
  button.textContent = '다시 열기 / Reload';
  button.onclick = () => globalThis.location.reload();
  const link = document.createElement('a');
  link.href = '/'; link.textContent = ' 메인으로 / Home';
  panel.append(text, button, link); root.append(panel);
}
