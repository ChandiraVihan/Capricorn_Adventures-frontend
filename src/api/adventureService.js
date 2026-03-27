const API_BASE_URL = "http://localhost:8080/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const adventureService = {
  // Fetch all adventure categories for the category dropdown
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/adventure-categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  },

  // Create a new adventure category — requires ADMIN token
  async createCategory(category) {
    const response = await fetch(`${API_BASE_URL}/adventure-categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
    }
    return await response.json();
  },

  // Fetches all adventures from the public browse endpoint.
  // The backend returns { adventures: [...], ... } so we extract the list.
  async getAllAdventures() {
    const response = await fetch(`${API_BASE_URL}/adventures`);
    if (!response.ok) throw new Error("Failed to fetch adventures");
    const data = await response.json();
    // AdventureBrowseResponseDTO wraps the list inside an "adventures" field
    return Array.isArray(data) ? data : (data.adventures ?? []);
  },

  // Admin: create a new adventure — requires ADMIN token
  async createAdventure(adventure) {
    const response = await fetch(`${API_BASE_URL}/admin/adventures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(adventure),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create adventure");
    }
    return await response.json();
  },

  // Admin: update an existing adventure — requires ADMIN token
  async updateAdventure(id, adventure) {
    const response = await fetch(`${API_BASE_URL}/admin/adventures/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(adventure),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update adventure");
    }
    return await response.json();
  },

  // Admin: delete an adventure — requires ADMIN token
  async deleteAdventure(id) {
    const response = await fetch(`${API_BASE_URL}/admin/adventures/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error("Failed to delete adventure");
  },

  // Admin: create a schedule for an adventure.
  // Backend endpoint: POST /api/admin/adventures/schedules
  // Body must include adventureId, startDate (ISO datetime), endDate (ISO datetime), availableSlots.
  async createSchedule(adventureId, schedule) {
    const response = await fetch(`${API_BASE_URL}/admin/adventures/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ adventureId, ...schedule }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create schedule");
    }
    return await response.json();
  },

  async getAvailability(scheduleId, date) {
    const response = await fetch(`${API_BASE_URL}/adventures/schedules/${scheduleId}/availability?date=${date}`);
    if (!response.ok) throw new Error("Failed to fetch availability");
    return await response.json();
  },

  async createBooking(bookingRequest) {
    const response = await fetch(`${API_BASE_URL}/adventure-bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(bookingRequest),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create booking");
    }
    return await response.json();
  }
};
