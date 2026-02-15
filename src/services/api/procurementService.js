import apiClient from "./client";

const procurementService = {
  async list(params = {}) {
    const response = await apiClient.get("/procurement-triggers", { params });
    return response.data;
  },

  async markFulfilled(triggerId, notes) {
    const response = await apiClient.patch(`/procurement-triggers/${triggerId}/fulfill`, {
      fulfillmentNotes: notes,
    });
    return response.data;
  },
};

export default procurementService;

