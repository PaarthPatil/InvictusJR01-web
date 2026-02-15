import axios from "axios";
import { API_BASE_URL, AUTH_STORAGE_KEY } from "../config";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const authRaw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (authRaw) {
    try {
      const session = JSON.parse(authRaw);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch (_err) {
      // Ignore parse error and continue request.
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
