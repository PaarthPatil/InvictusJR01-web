import { localDb } from "./localDb";

const analyticsService = {
  async getSummary() {
    return localDb.getDashboardSummary();
  },

  async getTopConsumed() {
    return localDb.getTopConsumed();
  },

  async getLowStockList() {
    return localDb.getLowStockComponents();
  },

  async getConsumptionTrends(limit = 10) {
    return localDb.getConsumptionTrends(limit);
  },

  async getLowStockTimeline(limit = 10) {
    return localDb.getLowStockTimeline(limit);
  },
};

export default analyticsService;
