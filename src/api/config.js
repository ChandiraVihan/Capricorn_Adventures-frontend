const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8080';

// Real backend URL for OAuth and production
export const REAL_BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_BASE_URL).replace(/\/$/, '');

export const BACKEND_BASE_URL = REAL_BACKEND_BASE_URL;

// Always use full URL for cross-origin requests to GitHub Codespaces backend
export const API_BASE_URL = `${REAL_BACKEND_BASE_URL}/api`;
