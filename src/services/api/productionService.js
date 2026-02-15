import apiClient from "./client";

const productionService = {
  async list() {
    const response = await apiClient.get("/production");
    return response.data;
  },
  async create(payload) {
    const response = await apiClient.post("/production", payload);
    return response.data;
  },
};

export default productionService;
