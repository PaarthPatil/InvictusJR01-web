import apiClient from "./client";

const componentsService = {
  async list(params = {}) {
    const response = await apiClient.get("/components", { params });
    return response.data;
  },
  async getById(id) {
    const response = await apiClient.get(`/components/${id}`);
    return response.data;
  },
  async create(payload) {
    const response = await apiClient.post("/components", payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await apiClient.put(`/components/${id}`, payload);
    return response.data;
  },
  async getLowStock() {
    const response = await apiClient.get("/components/low-stock");
    return response.data;
  },
};

export default componentsService;
