import apiClient from "./client";

const importExportService = {
  async importExcel(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await apiClient.post("/import-export/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },
  async exportInventory() {
    const response = await apiClient.get("/import-export/export/inventory", {
      responseType: "blob",
    });
    return response.data;
  },
  async exportConsumption() {
    const response = await apiClient.get("/import-export/export/consumption", {
      responseType: "blob",
    });
    return response.data;
  },
};

export default importExportService;
