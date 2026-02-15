import { localDb } from "./localDb";

const productionService = {
  async list() {
    return localDb.listProductionEntries();
  },

  async create(payload) {
    return localDb.createProductionEntry(payload);
  },
};

export default productionService;
