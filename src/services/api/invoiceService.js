import apiClient from "./client";

const invoiceService = {
    async getInvoiceData() {
        const response = await apiClient.get("/invoice/procurement-data");
        return response.data;
    },

    async generateInvoice(options = {}) {
        const response = await apiClient.post("/invoice/generate", options);
        return response.data;
    },
};

export default invoiceService;
