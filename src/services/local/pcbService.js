import { localDb } from "./localDb";

const pcbService = {
  async list() {
    return localDb.listPcbs();
  },

  async getById(id) {
    return localDb.getPcbById(id);
  },

  async create(payload) {
    return localDb.createPcb(payload);
  },
};

export default pcbService;
