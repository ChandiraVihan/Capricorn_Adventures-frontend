import { API_BASE_URL } from "./config";

const parseJson = async (res) => {
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  return res.json();
};

const throwApiError = async (res, fallback) => {
  const payload = await parseJson(res);
  throw new Error(payload?.message || fallback);
};

export const carRentalService = {
  async searchCars() {
    return {
      cars: [
        { id: 1, name: "Toyota Prius", category: "Economy", price: 12000 },
        { id: 2, name: "Honda CRV", category: "SUV", price: 18000 },
        { id: 3, name: "BMW 3 Series", category: "Luxury", price: 35000 },
      ],
    };
  },
};