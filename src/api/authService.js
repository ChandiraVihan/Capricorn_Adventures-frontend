import { API_BASE_URL } from './config';

const AUTH_API_BASE_URL = `${API_BASE_URL}/auth`;

const safeParseResponse = async (response) => {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

const getErrorMessage = (payload, fallback) => {
  if (payload && typeof payload === "object") {
    return payload.error || payload.message || fallback;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
};

const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toUpperCase() : null);

const safeDecodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const extractRoleFromToken = (token) => {
  const payload = safeDecodeJwtPayload(token);
  if (!payload) return null;

  return normalizeRole(
    payload.role ||
    payload.roles?.[0] ||
    payload.authorities?.[0] ||
    payload.scope
  );
};

const sanitizeUser = (user, token) => {
  if (!user && !token) return null;
  const normalizedRole = normalizeRole(user?.role) || extractRoleFromToken(token);
  if (!user) {
    return normalizedRole ? { role: normalizedRole } : null;
  }

  return {
    ...user,
    role: normalizedRole,
  };
};


export const authService = {
  async login(email, password) {
    const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await safeParseResponse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, "Login failed"));
    }

    const data = payload || {}; // AuthResponse { accessToken, refreshToken, user }
    if (data.accessToken) {
      const safeUser = sanitizeUser(data.user, data.accessToken);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(safeUser));
      return { ...data, user: safeUser };
    }
    return data;
  },

  async register(firstName, lastName, email, password) {
    const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const payload = await safeParseResponse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, "Registration failed"));
    }

    return payload;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  async getUserInfo() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${AUTH_API_BASE_URL}/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        return null;
      }

      const fallbackUser = sanitizeUser(this.getCurrentUser(), token);
      if (fallbackUser) return fallbackUser;
      return null;
    }

    const userData = await response.json();
    const safeUser = sanitizeUser(userData, token);
    localStorage.setItem("user", JSON.stringify(safeUser));
    return safeUser;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    const token = this.getToken();
    const parsedUser = userStr ? JSON.parse(userStr) : null;
    return sanitizeUser(parsedUser, token);
  },

  getToken() {
    return localStorage.getItem("token");
  },

  async forgotPassword(email) {
    const response = await fetch(`${AUTH_API_BASE_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await safeParseResponse(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload, "Failed to send reset email"));
    }
    return payload;
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${AUTH_API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const payload = await safeParseResponse(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload, "Failed to reset password"));
    }
    return payload;
  }
};
