import { API_BASE_URL } from './config';

export const getProfitAndLoss = async (month = "") => {
  // If month is provided, append it. Otherwise, get Month-to-Date.
  const query = month ? `?month=${month}` : "";
  const response = await fetch(`${API_BASE_URL}/finance/pnl${query}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch P&L data");
  }
  return response.json();
};

export const downloadExport = (month = "") => {
  const query = month ? `?month=${month}` : "";
  window.location.href = `${API_BASE_URL}/finance/pnl/export${query}`;
};