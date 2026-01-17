import { Platform } from "react-native";

const getApiUrl = () => {
  const isDevelopment = __DEV__;

  if (!isDevelopment) {
    return "https://your-backend-url.com/api";
  }

  // Development mode
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  } else if (Platform.OS === "ios") {
    return "http://localhost:5000/api";
  } else {
    return "http://localhost:5000/api";
  }
};

export const API_URL = getApiUrl();

export const APP_CONFIG = {
  appName: "TrackPay",
  version: "1.0.0",
  defaultCategories: [
    "Salary",
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
