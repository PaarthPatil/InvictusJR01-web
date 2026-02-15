import { localDb } from "./localDb";
import { generateInvoiceHTML } from "../../utils/invoiceGenerator";

const invoiceService = {
    async getInvoiceData() {
        const procurementItems = localDb.getProcurementInvoiceData();
        return procurementItems;
    },

    async generateInvoice(options = {}) {
        const procurementItems = localDb.getProcurementInvoiceData();

        if (procurementItems.length === 0) {
            throw new Error("No pending procurement items to generate invoice.");
        }

        const html = generateInvoiceHTML(procurementItems, options);
        return { html, itemCount: procurementItems.length };
    },
};

export default invoiceService;
