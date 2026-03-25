import { API_BASE_URL } from "./config";

const AUTH_API_BASE_URL = `${API_BASE_URL}/auth`;

export const authService = {
  async login(email, password) {
    const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    const data = await response.json(); // AuthResponse { accessToken, refreshToken, user }
    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return await response.json();
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
      this.logout();
      return null;
    }

    const userData = await response.json();
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send reset email");
    }
    return await response.json();
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${AUTH_API_BASE_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reset password");
    }
    return await response.json();
  }
};
