import { API_BASE_URL } from "./config";

const parseJson = async (res) => {
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  return res.json();
};

export const recommendationService = {
  async getNearbyAdventures(lat, lng) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/recommendations/nearby?lat=${lat}&lng=${lng}`
      );

      if (!res.ok) throw new Error();

      return parseJson(res);
    } catch {
      // 🔥 MOCK fallback (IMPORTANT for your demo)
      return {
        adventures: [
          { id: 1, title: "Ella Hiking", distance: 5, rating: 4.7 },
          { id: 2, title: "Surfing in Weligama", distance: 12, rating: 4.5 },
          { id: 3, title: "Yala Safari", distance: 30, rating: 4.8 },
          { id: 4, title: "Sigiriya Climb", distance: 45, rating: 4.9 },
        ],
      };
    }
  },

  async getMoreInArea(adventureId, radius = 20) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/recommendations/${adventureId}?radius=${radius}`
      );

      if (!res.ok) throw new Error();

      return parseJson(res);
    } catch {
      // fallback mock
      if (radius === 20) return { adventures: [] };

      return {
        adventures: [
          { id: 10, title: "River Rafting", distance: 25 },
          { id: 11, title: "Jungle Trekking", distance: 40 },
        ],
      };
    }
  },
};