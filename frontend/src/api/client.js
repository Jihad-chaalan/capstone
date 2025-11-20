import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // REMOVE withCredentials: true
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Keep the token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
