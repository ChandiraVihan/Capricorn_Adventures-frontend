import { API_BASE_URL } from './config';

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getPayments = async (from, to) => {
  const response = await fetch(
    `${API_BASE_URL}/finance/payments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: { ...authHeaders() } }
  );
  if (!response.ok) throw new Error("Failed to fetch payments");
  const data = await response.json();
  return { data };
};

export const getInvoices = async (from, to) => {
  const response = await fetch(
    `${API_BASE_URL}/finance/invoices?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: { ...authHeaders() } }
  );
  if (!response.ok) throw new Error("Failed to fetch invoices");
  const data = await response.json();
  return { data };
};

export const markRefund = async (paymentId) => {
  const response = await fetch(
    `${API_BASE_URL}/finance/payments/${paymentId}/refund`,
    { method: "PUT", headers: { ...authHeaders() } }
  );
  if (!response.ok) throw new Error("Failed to process refund");
  const data = await response.json();
  return { data };
};

export const getPaymentByBooking = async (referenceId) => {
  const response = await fetch(
    `${API_BASE_URL}/finance/bookings/${referenceId}/payment`,
    { headers: { ...authHeaders() } }
  );
  if (!response.ok) throw new Error("Failed to fetch payment");
  const data = await response.json();
  return { data };
};

export const getInvoiceByBooking = async (referenceId) => {
  const response = await fetch(
    `${API_BASE_URL}/finance/bookings/${referenceId}/invoice`,
    { headers: { ...authHeaders() } }
  );
  if (!response.ok) throw new Error("Failed to fetch invoice");
  const data = await response.json();
  return { data };
};

export const syncPayments = async () => {
    const response = await fetch(`${API_BASE_URL}/finance/sync`, {
        method: "POST",
        headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error("Sync failed");
    return response.text();
};