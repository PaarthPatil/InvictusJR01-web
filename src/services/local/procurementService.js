import { localDb } from "./localDb";

const procurementService = {
  async list(params = {}) {
    const status = params.status || "all";
    const allTriggers = localDb.listProcurementTriggers();

    if (status === "all") {
      return allTriggers;
    }

    return allTriggers.filter((t) => t.status === status);
  },

  async markFulfilled(triggerId, notes) {
    return localDb.markProcurementFulfilled(triggerId, notes);
  },
};

export default procurementService;
