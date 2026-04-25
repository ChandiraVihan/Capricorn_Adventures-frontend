const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8080';

// Real backend URL for OAuth and production
export const REAL_BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_BASE_URL).replace(/\/$/, '');

// In development, use same-origin proxy to avoid browser CORS issues.
export const BACKEND_BASE_URL = import.meta.env.DEV ? '' : REAL_BACKEND_BASE_URL;

export const API_BASE_URL = import.meta.env.DEV ? '/api' : `${REAL_BACKEND_BASE_URL}/api`;
