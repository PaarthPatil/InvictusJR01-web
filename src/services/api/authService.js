import apiClient from "./client";

const authService = {
  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return response.data;
  },
  async getMe() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
  async logout() {
    return Promise.resolve();
  },
};

export default authService;
