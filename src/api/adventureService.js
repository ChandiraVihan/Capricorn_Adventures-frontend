import { API_BASE_URL } from './config';

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

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

export const adventureService = {
  async getCategories() {
    try {
      const url = `${API_BASE_URL}/adventure-categories`;
      console.log('Fetching categories from:', url);
      const response = await fetch(url);
      console.log('Categories response:', response.status, response.statusText);
      if (!response.ok) {
        await throwApiError(response, 'Failed to load categories');
      }
      const data = await parseJson(response);
      console.log('Categories data:', data);
      // Handle various response formats
      if (Array.isArray(data)) return data;
      if (data?.items) return data.items;
      if (data?.content) return data.content;
      if (data?.categories) return data.categories;
      return [];
    } catch (error) {
      console.error('❌ Error loading categories:', error.message);
      throw error;
    }
  },

  async browseAdventures(filters = {}) {
    try {
      const query = toQueryString(filters);
      const url = `${API_BASE_URL}/adventures${query ? `?${query}` : ''}`;
      console.log('Fetching adventures from:', url);
      const response = await fetch(url);
      console.log('Adventures response:', response.status, response.statusText);
      if (!response.ok) {
        await throwApiError(response, 'Failed to load adventures');
      }
      const data = await parseJson(response);
      console.log('Adventures data:', data);
      // Handle various response formats
      if (Array.isArray(data)) return data;
      if (data?.adventures) return data.adventures;
      if (data?.items) return data.items;
      if (data?.content) return data.content;
      return [];
    } catch (error) {
      console.error('❌ Error loading adventures:', error.message);
      throw error;
    }
  },

  async getAdventureDetails(adventureId, selectedFromDate, selectedToDate) {
    try {
      const query = toQueryString({ selectedFromDate, selectedToDate });
      const url = `${API_BASE_URL}/adventures/${adventureId}${query ? `?${query}` : ''}`;
      console.log('Fetching adventure details from:', url);
      const response = await fetch(url);
      console.log('Adventure details response:', response.status, response.statusText);
      if (!response.ok) {
        await throwApiError(response, 'Failed to load adventure details');
      }
      const data = await parseJson(response);
      console.log('Adventure details data:', data);
      // Handle nested response
      return data?.adventure || data;
    } catch (error) {
      console.error('❌ Error loading adventure details:', error.message);
      throw error;
    }
  },

  async validateBooking(adventureId, payload) {
    const response = await fetch(`${API_BASE_URL}/adventures/${adventureId}/booking-validation`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await parseJson(response);
    if (!response.ok) {
      const message = data?.message || data?.error || 'Adventure booking validation failed';
      throw new Error(message);
    }
    return data;
  },

  async startCheckout(payload) {
    const response = await fetch(`${API_BASE_URL}/adventure-checkout/start`, {
      method: 'POST',
      headers: { ...jsonHeaders(), ...authHeaders() },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to start checkout');
    }

    const data = await parseJson(response);
    return data?.id || data?.checkoutId || data;
  },

  async getCheckoutSummary(checkoutId) {
    const response = await fetch(`${API_BASE_URL}/adventure-checkout/${checkoutId}`, {
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to load checkout summary');
    }

    return parseJson(response);
  },

  async updateGuestDetails(checkoutId, payload) {
    const response = await fetch(`${API_BASE_URL}/adventure-checkout/${checkoutId}/guest`, {
      method: 'PUT',
      headers: { ...jsonHeaders(), ...authHeaders() },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to update guest details');
    }

    return parseJson(response);
  },

  async attachUser(checkoutId) {
    const response = await fetch(`${API_BASE_URL}/adventure-checkout/${checkoutId}/attach-user`, {
      method: 'POST',
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to attach signed-in user');
    }

    return parseJson(response);
  },

  async confirmCheckout(checkoutId, paymentSuccess) {
    const response = await fetch(`${API_BASE_URL}/adventure-checkout/${checkoutId}/confirm?paymentSuccess=${paymentSuccess}`, {
      method: 'POST',
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Payment confirmation failed');
    }

    return parseJson(response);
  },

  async getMyBookings(type) {
    const query = toQueryString({ type });
    const response = await fetch(`${API_BASE_URL}/my-bookings${query ? `?${query}` : ''}`, {
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to load bookings');
    }

    const data = await parseJson(response);
    return Array.isArray(data) ? data : data?.items || data?.content || [];
  },

  async getAdventureBookingDetails(bookingId) {
    const response = await fetch(`${API_BASE_URL}/my-bookings/adventure/${bookingId}`, {
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to load adventure booking details');
    }

    return parseJson(response);
  },

  async getAdventureRescheduleOptions(bookingId) {
    const response = await fetch(`${API_BASE_URL}/my-bookings/adventure/${bookingId}/reschedule-options`, {
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to load reschedule options');
    }

    return parseJson(response);
  },

  async rescheduleAdventureBooking(bookingId, newScheduleId) {
    const response = await fetch(`${API_BASE_URL}/my-bookings/adventure/${bookingId}/reschedule`, {
      method: 'PUT',
      headers: { ...jsonHeaders(), ...authHeaders() },
      body: JSON.stringify({ newScheduleId }),
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to reschedule booking');
    }

    return parseJson(response);
  },

  async cancelAdventureBooking(bookingId) {
    const response = await fetch(`${API_BASE_URL}/my-bookings/adventure/${bookingId}/cancel`, {
      method: 'POST',
      headers: { ...authHeaders() },
    });

    if (!response.ok) {
      await throwApiError(response, 'Unable to cancel booking');
    }

    return parseJson(response);
  },
};
