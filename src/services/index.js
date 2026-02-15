import { DATA_MODE } from "./config";

import apiAuthService from "./api/authService";
import apiComponentsService from "./api/componentsService";
import apiPcbService from "./api/pcbService";
import apiProductionService from "./api/productionService";
import apiAnalyticsService from "./api/analyticsService";
import apiProcurementService from "./api/procurementService";
import apiImportExportService from "./api/importExportService";
import apiInvoiceService from "./api/invoiceService";

import localAuthService from "./local/authService";
import localComponentsService from "./local/componentsService";
import localPcbService from "./local/pcbService";
import localProductionService from "./local/productionService";
import localAnalyticsService from "./local/analyticsService";
import localProcurementService from "./local/procurementService";
import localImportExportService from "./local/importExportService";
import localInvoiceService from "./local/invoiceService";

const isApiMode = DATA_MODE === "api";

const services = {
  mode: DATA_MODE,
  authService: isApiMode ? apiAuthService : localAuthService,
  componentsService: isApiMode ? apiComponentsService : localComponentsService,
  pcbService: isApiMode ? apiPcbService : localPcbService,
  productionService: isApiMode ? apiProductionService : localProductionService,
  analyticsService: isApiMode ? apiAnalyticsService : localAnalyticsService,
  procurementService: isApiMode ? apiProcurementService : localProcurementService,
  importExportService: isApiMode ? apiImportExportService : localImportExportService,
  invoiceService: isApiMode ? apiInvoiceService : localInvoiceService,
};

export default services;
