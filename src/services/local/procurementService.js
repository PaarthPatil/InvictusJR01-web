import { localDb } from "./localDb";

const procurementService = {
  async list(params = {}) {
    return localDb.listProcurementTriggers(params.status || "");
  },
};

export default procurementService;
