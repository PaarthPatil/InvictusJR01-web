import apiClient from "./client";

const pcbService = {
  async list() {
    const response = await apiClient.get("/pcbs");
    return response.data;
  },
  async getById(id) {
    const response = await apiClient.get(`/pcbs/${id}`);
    return response.data;
  },
  async create(payload) {
    const response = await apiClient.post("/pcbs", payload);
    return response.data;
  },
};

export default pcbService;
