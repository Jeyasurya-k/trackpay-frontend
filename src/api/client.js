import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/constants";

console.log("🌐 Initializing API Client with URL:", API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log("📤 API Request:", config.method.toUpperCase(), config.url);
    console.log("📦 Request data:", config.data);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 Token added to request");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log("📥 API Response:", response.status, response.config.url);
    console.log("📦 Response data:", response.data);
    return response;
  },
  async (error) => {
    console.error("❌ API Error:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
    }

    const errorMessage =
      error.response?.data?.error || error.message || "Network error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

export const authAPI = {
  login: (data) => {
    console.log("🔐 Calling login API");
    return apiClient.post("/auth/login", data);
  },
  signup: (data) => {
    console.log("📝 Calling signup API");
    return apiClient.post("/auth/signup", data);
  },
  getCurrentUser: () => {
    console.log("👤 Calling getCurrentUser API");
    return apiClient.get("/auth/me");
  },
};

export const transactionAPI = {
  getAll: (params) => apiClient.get("/transactions", { params }),
  create: (data) => apiClient.post("/transactions", data),
  update: (id, data) => apiClient.put(`/transactions/${id}`, data),
  delete: (id) => apiClient.delete(`/transactions/${id}`),
  getSummary: (params) => apiClient.get("/transactions/summary", { params }),
};

export const customerAPI = {
  getAll: () => apiClient.get("/customers"),
  getOne: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post("/customers", data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
  addPurchase: (id, data) => apiClient.post(`/customers/${id}/purchases`, data),
  updatePurchase: (customerId, purchaseId, data) =>
    apiClient.put(`/customers/${customerId}/purchases/${purchaseId}`, data),
};

export default apiClient;
