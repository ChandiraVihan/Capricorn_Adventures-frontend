import { API_BASE_URL } from './config';
import { authService } from './authService';

function toError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else if (contentType.includes('application/octet-stream') || contentType.includes('application/vnd')) {
    payload = await response.blob();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      `Request failed with status ${response.status}`;
    throw toError(message, response.status, payload);
  }

  return payload;
}

function withAuthHeaders(headers = {}) {
  const token = authService.getToken();
  if (!token) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    responseType = 'json',
    signal,
  } = options;

  const finalHeaders = withAuthHeaders({
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (responseType === 'blob') {
    if (!response.ok) {
      const payload = await parseResponse(response);
      throw toError('Failed to download file', response.status, payload);
    }
    return response.blob();
  }

  return parseResponse(response);
}

export function createQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const output = query.toString();
  return output ? `?${output}` : '';
}
