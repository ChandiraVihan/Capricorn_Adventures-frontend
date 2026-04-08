import { API_BASE_URL } from './config';

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return response.json();
};

const throwApiError = async (response, fallbackMessage) => {
  const payload = await parseJson(response);
  const text = payload?.message || payload?.error || fallbackMessage;
  throw new Error(text);
};

export const bookingService = {
  /**
   * Fetches detailed information for a single room booking.
   */
  async getRoomBookingDetails(bookingId) {
    const response = await fetch(`${API_BASE_URL}/v1/bookings/${bookingId}/details`, {
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to load booking details');
    }

    return parseJson(response);
  },

  /**
   * Requests a refund for a room booking.
   */
  async requestRoomRefund(bookingId, reason) {
    const response = await fetch(`${API_BASE_URL}/refunds/room/${bookingId}`, {
      method: 'POST',
      headers: { ...jsonHeaders(), ...authHeaders() },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to process refund request');
    }

    return parseJson(response);
  },
};
