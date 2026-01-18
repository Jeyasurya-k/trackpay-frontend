import { Platform } from "react-native";

const getApiUrl = () => {
  // Your Live Render URL
  // Note: Ensure your backend is actually running on Render!
  return "https://trackpay-backend.onrender.com/api";
};

export const API_URL = getApiUrl();

export const APP_CONFIG = {
  appName: "TrackPay",
  version: "1.0.0",
  defaultCategories: [
    "Customer Payment",
    "Freelance",
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other",
  ],
};

console.log("🌐 API URL:", API_URL);
console.log(
  "🔧 Environment:",
  __DEV__ ? "Development (Forcing Production API)" : "Production",
);
