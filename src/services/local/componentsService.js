import { localDb } from "./localDb";

const componentsService = {
  async list(params = {}) {
    return localDb.listComponents(params.search || "");
  },

  async getById(id) {
    return localDb.getComponentById(id);
  },

  async create(payload) {
    const response = localDb.createComponent(payload);
    return response.component;
  },

  async update(id, payload) {
    const response = localDb.updateComponent(id, payload);
    return response.component;
  },

  async getLowStock() {
    return localDb.getLowStockComponents();
  },
};

export default componentsService;
