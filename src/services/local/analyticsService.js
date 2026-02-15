import { localDb } from "./localDb";

const analyticsService = {
  async getSummary() {
    return localDb.getDashboardSummary();
  },

  async getTopConsumed() {
    return localDb.getTopConsumed();
  },

  async getConsumptionHistory() {
    return localDb.getConsumptionHistory();
  },

  async getLowStockList() {
    return localDb.getLowStockComponents();
  },
};

export default analyticsService;
