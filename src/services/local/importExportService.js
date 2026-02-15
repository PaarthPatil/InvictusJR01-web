import { localDb } from "./localDb";

const importExportService = {
  async importExcel(files) {
    return localDb.importExcel(files);
  },

  async exportInventory() {
    return localDb.exportInventory();
  },

  async exportConsumption() {
    return localDb.exportConsumption();
  },
};

export default importExportService;
