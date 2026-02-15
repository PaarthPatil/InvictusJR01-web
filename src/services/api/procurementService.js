import apiClient from "./client";

const procurementService = {
  async list(params = {}) {
    const response = await apiClient.get("/procurement-triggers", { params });
    return response.data;
  },
};

export default procurementService;
