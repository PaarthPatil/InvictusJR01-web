import apiClient from "./client";

const analyticsService = {
  async getSummary() {
    const response = await apiClient.get("/analytics/summary");
    return response.data;
  },
  async getTopConsumed() {
    const response = await apiClient.get("/analytics/top-consumed");
    return response.data;
  },
  async getConsumptionHistory() {
    const response = await apiClient.get("/analytics/consumption-history");
    return response.data;
  },
  async getLowStockList() {
    const response = await apiClient.get("/analytics/low-stock");
    return response.data;
  },
};

export default analyticsService;
