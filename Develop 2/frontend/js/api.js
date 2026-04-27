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

async function apiRequest(path, { method = 'GET', body, headers = {}, fallbackMessage = 'Error en la petición' } = {}) {
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

  if (localStorage.getItem('myspaceDebug') !== 'false') {
    console.debug('[MySpace API][request]', { method, path, url, body });
  }

  const response = await fetch(url, requestOptions);
  const data = await parseApiResponse(response, fallbackMessage);

  if (localStorage.getItem('myspaceDebug') !== 'false') {
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
