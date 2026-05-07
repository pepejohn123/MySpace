function getApiBaseUrl() {
  return String(window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

function getAuthHeaders(extraHeaders = {}) {
  const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('token');
  const headers = { ...extraHeaders };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.text().catch(() => '');

  if (!response.ok) {
    const message = (typeof data === 'object' ? (data.error || data.message) : data) || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function apiRequest(path, { method = 'GET', body, headers = {}, fallbackMessage = 'Error en la petición', retries = 3, backoff = 500 } = {}) {
  const startedAt = performance.now();
  const requestOptions = {
    method,
    headers: getAuthHeaders(headers)
  };

  if (body !== undefined) {
    requestOptions.headers['Content-Type'] = requestOptions.headers['Content-Type'] || 'application/json';
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const url = buildApiUrl(path);
  const debug = localStorage.getItem('myspaceDebug') !== 'false';

  if (debug) {
    console.debug('[MySpace API][request]', { method, path, url, body });
  }

  let response;
  let attempt = 0;

  while (true) {
    response = await fetch(url, requestOptions);

    if (response.status !== 429 || attempt >= retries) break;

    const wait = backoff * Math.pow(2, attempt);
    console.warn(`[MySpace API] 429 Throttling. Reintentando en ${wait}ms... (intento ${attempt + 1}/${retries})`);
    await new Promise(resolve => setTimeout(resolve, wait));
    attempt++;
  }

  if (response.status === 429) {
    throw Object.assign(
      new Error('El sistema está experimentando alta demanda. Por favor, intenta de nuevo en unos minutos.'),
      { status: 429 }
    );
  }

  const data = await parseApiResponse(response, fallbackMessage);

  if (debug) {
    console.debug('[MySpace API][response]', {
      method,
      path,
      url,
      status: response.status,
      elapsedMs: Math.round(performance.now() - startedAt),
      data
    });
  }

  return data;
}

function apiGet(path, fallbackMessage) {
  return apiRequest(path, { method: 'GET', fallbackMessage });
}

function apiPost(path, body, fallbackMessage) {
  return apiRequest(path, { method: 'POST', body, fallbackMessage });
}

function apiPatch(path, body, fallbackMessage) {
  return apiRequest(path, { method: 'PATCH', body, fallbackMessage });
}

function apiDelete(path, fallbackMessage) {
  return apiRequest(path, { method: 'DELETE', fallbackMessage });
}
