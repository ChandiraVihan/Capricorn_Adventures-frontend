import { API_BASE_URL } from './config';

const parseJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json();
};

const throwApiError = async (response, fallbackMessage) => {
  const payload = await parseJson(response);
  const text = payload?.message || payload?.error || fallbackMessage;
  throw new Error(text);
};

export const nearbyPoiService = {
  /**
   * Fetch nearby POIs for an adventure.
   * @param {string|number} adventureId
   * @param {string|null} category  Optional filter: RESTAURANT | VIEWPOINT | PARKING | PETROL_STATION
   */
  async getNearbyPois(adventureId, category = null) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const query = params.toString();

    const url = `${API_BASE_URL}/adventures/${adventureId}/nearby-pois${query ? `?${query}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      await throwApiError(response, 'Failed to load nearby points of interest');
    }

    return parseJson(response);
  },
};
