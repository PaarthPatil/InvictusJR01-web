import seedData from "../../assets/seedData.json";
import {
  enrichComponent,
  isLowStockComponent,
  positiveNumberOrZero,
  toNumber,
} from "../../utils/businessRules";
import { emitDataChange } from "../../utils/dataEvents";

const DB_STORAGE_KEY = "inv_local_db";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeComponent(raw) {
  return enrichComponent({
    id: raw.id || generateId("cmp"),
    name: raw.name || "",
    partNumber: raw.partNumber || raw.name || "",
    currentStockQty: positiveNumberOrZero(raw.currentStockQty),
    monthlyRequiredQty: positiveNumberOrZero(raw.monthlyRequiredQty),
    createdAt: raw.createdAt || nowIso(),
    updatedAt: nowIso(),
  });
}

function normalizePcb(raw) {
  return {
    id: raw.id || generateId("pcb"),
    name: raw.name || "",
    components: (raw.components || []).map((item) => ({
      componentId: item.componentId,
      quantityPerComponent: positiveNumberOrZero(item.quantityPerComponent || 1),
    })),
    createdAt: raw.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function buildSeedPayload() {
  return {
    components: (seedData.components || []).map((component) => normalizeComponent(component)),
    pcbs: (seedData.pcbs || []).map((pcb) => normalizePcb(pcb)),
    productionEntries: seedData.productionEntries || [],
    procurementTriggers: seedData.procurementTriggers || [],
    consumptionHistory: seedData.consumptionHistory || [],
  };
}

function syncProcurementStateForCurrentStock(db) {
  db.components.forEach((component) => {
    const existingPending = db.procurementTriggers.find(
      (record) => record.componentId === component.id && record.status === "pending"
    );

    if (component.isLowStock && !existingPending) {
      db.procurementTriggers.push({
        id: generateId("prc"),
        componentId: component.id,
        componentName: component.name,
        partNumber: component.partNumber,
        currentStockQty: component.currentStockQty,
        monthlyRequiredQty: component.monthlyRequiredQty,
        lowStockThreshold: component.lowStockThreshold,
        triggeredAt: nowIso(),
        status: "pending",
        resolvedAt: null,
        snapshot: {
          stock: component.currentStockQty,
          monthlyRequired: component.monthlyRequiredQty,
          threshold: component.lowStockThreshold,
        },
      });
    }

    if (!component.isLowStock && existingPending) {
      existingPending.status = "resolved";
      existingPending.resolvedAt = nowIso();
    }
  });
}

function replaceDbWithSeedData(db) {
  const payload = buildSeedPayload();
  db.components = payload.components;
  db.pcbs = payload.pcbs;
  db.productionEntries = payload.productionEntries;
  db.procurementTriggers = payload.procurementTriggers;
  db.consumptionHistory = payload.consumptionHistory;
  db.importHistory = Array.isArray(db.importHistory) ? db.importHistory : [];

  syncProcurementStateForCurrentStock(db);
}

function seedDb() {
  const db = {
    components: [],
    pcbs: [],
    productionEntries: [],
    procurementTriggers: [],
    consumptionHistory: [],
    importHistory: [],
  };

  replaceDbWithSeedData(db);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  return db;
}

function getDb() {
  const raw = localStorage.getItem(DB_STORAGE_KEY);
  if (!raw) {
    return seedDb();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      components: (parsed.components || []).map((component) => normalizeComponent(component)),
      pcbs: parsed.pcbs || [],
      productionEntries: parsed.productionEntries || [],
      procurementTriggers: parsed.procurementTriggers || [],
      consumptionHistory: parsed.consumptionHistory || [],
      importHistory: parsed.importHistory || [],
    };
  } catch (_err) {
    return seedDb();
  }
}

function saveDb(db) {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
}

function withDb(mutator) {
  const db = getDb();
  const result = mutator(db);
  saveDb(db);
  return result;
}

function upsertProcurementTrigger(db, previousComponent, nextComponent, eventsCollector = []) {
  const wasLow = previousComponent ? isLowStockComponent(previousComponent) : false;
  const isLow = isLowStockComponent(nextComponent);

  const existingPending = db.procurementTriggers.find(
    (record) => record.componentId === nextComponent.id && record.status === "pending"
  );

  if (!wasLow && isLow && !existingPending) {
    const event = {
      id: generateId("prc"),
      componentId: nextComponent.id,
      componentName: nextComponent.name,
      partNumber: nextComponent.partNumber,
      currentStockQty: nextComponent.currentStockQty,
      monthlyRequiredQty: nextComponent.monthlyRequiredQty,
      lowStockThreshold: nextComponent.lowStockThreshold,
      triggeredAt: nowIso(),
      status: "pending",
      resolvedAt: null,
      snapshot: {
        stock: nextComponent.currentStockQty,
        monthlyRequired: nextComponent.monthlyRequiredQty,
        threshold: nextComponent.lowStockThreshold,
      },
    };

    db.procurementTriggers.push(event);
    eventsCollector.push({ type: "triggered", record: event });
  }

  if (wasLow && !isLow && existingPending) {
    existingPending.status = "resolved";
    existingPending.resolvedAt = nowIso();
    eventsCollector.push({ type: "resolved", record: existingPending });
  }
}

function listComponents(search = "") {
  const db = getDb();
  const term = String(search || "").trim().toLowerCase();

  const filtered = db.components.filter((component) => {
    if (!term) return true;
    return (
      component.name.toLowerCase().includes(term) ||
      component.partNumber.toLowerCase().includes(term)
    );
  });

  return deepClone(filtered);
}

function getComponentById(id) {
  const db = getDb();
  const component = db.components.find((item) => item.id === id);
  if (!component) {
    throw new Error("Component not found.");
  }
  return deepClone(component);
}

function createComponent(payload) {
  return withDb((db) => {
    const component = normalizeComponent({
      name: payload.name,
      partNumber: payload.partNumber,
      currentStockQty: payload.currentStockQty,
      monthlyRequiredQty: payload.monthlyRequiredQty,
    });

    const events = [];
    upsertProcurementTrigger(db, null, component, events);

    db.components.push(component);
    emitDataChange("component_created", { componentId: component.id });
    return deepClone({ component, procurementEvents: events });
  });
}

function updateComponent(id, payload) {
  return withDb((db) => {
    const index = db.components.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Component not found.");
    }

    const previous = db.components[index];
    const updated = normalizeComponent({
      ...previous,
      name: payload.name ?? previous.name,
      partNumber: payload.partNumber ?? previous.partNumber,
      currentStockQty:
        payload.currentStockQty !== undefined
          ? positiveNumberOrZero(payload.currentStockQty)
          : previous.currentStockQty,
      monthlyRequiredQty:
        payload.monthlyRequiredQty !== undefined
          ? positiveNumberOrZero(payload.monthlyRequiredQty)
          : previous.monthlyRequiredQty,
      createdAt: previous.createdAt,
    });

    const events = [];
    upsertProcurementTrigger(db, previous, updated, events);

    db.components[index] = updated;
    emitDataChange("component_updated", { componentId: updated.id });
    return deepClone({ component: updated, procurementEvents: events });
  });
}

function listPcbs() {
  const db = getDb();
  return deepClone(db.pcbs);
}

function getPcbById(id) {
  const db = getDb();
  const pcb = db.pcbs.find((item) => item.id === id);
  if (!pcb) {
    throw new Error("PCB not found.");
  }
  return deepClone(pcb);
}

function createPcb(payload) {
  return withDb((db) => {
    const pcb = normalizePcb({
      name: payload.name,
      components: payload.components,
    });

    db.pcbs.push(pcb);
    emitDataChange("pcb_created", { pcbId: pcb.id });
    return deepClone(pcb);
  });
}

function createProductionEntry(payload) {
  return withDb((db) => {
    const pcb = db.pcbs.find((item) => item.id === payload.pcbId);
    if (!pcb) {
      throw new Error("PCB not found.");
    }

    const quantityToProduce = positiveNumberOrZero(payload.quantityToProduce);
    if (quantityToProduce <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    const deductions = pcb.components.map((mapping) => {
      const component = db.components.find((item) => item.id === mapping.componentId);
      if (!component) {
        return {
          mapping,
          component: null,
          requiredQty: 0,
          insufficient: true,
        };
      }

      const requiredQty = toNumber(mapping.quantityPerComponent) * quantityToProduce;
      return {
        mapping,
        component,
        requiredQty,
        insufficient: component.currentStockQty < requiredQty,
      };
    });

    const insufficient = deductions.filter((item) => item.insufficient || !item.component);
    if (insufficient.length > 0) {
      const message = insufficient
        .map((item) => {
          const name = item.component?.name || "Unknown Component";
          const available = item.component?.currentStockQty ?? 0;
          return `${name} (required ${item.requiredQty}, available ${available})`;
        })
        .join(", ");

      const error = new Error(`Insufficient stock: ${message}`);
      error.code = "INSUFFICIENT_STOCK";
      throw error;
    }

    const procurementEvents = [];
    const updatedComponents = [];
    const now = nowIso();

    deductions.forEach((deduction) => {
      const componentIndex = db.components.findIndex((item) => item.id === deduction.component.id);
      const previous = db.components[componentIndex];
      const nextStock = previous.currentStockQty - deduction.requiredQty;

      if (nextStock < 0) {
        throw new Error("Negative inventory prevented by atomic validation.");
      }

      const next = normalizeComponent({
        ...previous,
        currentStockQty: nextStock,
        createdAt: previous.createdAt,
      });

      db.components[componentIndex] = next;
      updatedComponents.push(next);

      db.consumptionHistory.push({
        id: generateId("cons"),
        date: now,
        componentId: next.id,
        componentName: next.name,
        pcbId: pcb.id,
        pcbName: pcb.name,
        consumedQty: deduction.requiredQty,
      });

      upsertProcurementTrigger(db, previous, next, procurementEvents);
    });

    const entry = {
      id: generateId("prd"),
      pcbId: pcb.id,
      pcbName: pcb.name,
      quantityToProduce,
      createdAt: now,
      deductions: deductions.map((item) => ({
        componentId: item.component.id,
        componentName: item.component.name,
        quantityDeducted: item.requiredQty,
      })),
    };

    db.productionEntries.push(entry);
    emitDataChange("production_created", { productionId: entry.id, pcbId: pcb.id });

    return deepClone({
      entry,
      deductions: entry.deductions,
      updatedComponents,
      procurementEvents,
    });
  });
}

function listProductionEntries() {
  const db = getDb();
  return deepClone(db.productionEntries);
}

function listProcurementTriggers(status) {
  const db = getDb();
  const normalizedStatus = status ? String(status).toLowerCase() : "";

  const records = db.procurementTriggers
    .slice()
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .filter((item) => {
      if (!normalizedStatus || normalizedStatus === "all") return true;
      return item.status === normalizedStatus;
    });

  return deepClone(records);
}

function getTopConsumed() {
  const db = getDb();
  const grouped = db.consumptionHistory.reduce((acc, row) => {
    const key = row.componentName;
    acc[key] = (acc[key] || 0) + toNumber(row.consumedQty);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([componentName, consumedQty]) => ({ componentName, consumedQty }))
    .sort((a, b) => b.consumedQty - a.consumedQty)
    .slice(0, 10);
}

function getDashboardSummary() {
  const db = getDb();
  const lowStockCount = db.components.filter((item) => item.isLowStock).length;
  const pendingProcurementCount = db.procurementTriggers.filter(
    (item) => item.status === "pending"
  ).length;

  return {
    totalComponents: db.components.length,
    lowStockCount,
    totalProductionEntries: db.productionEntries.length,
    pendingProcurementCount,
  };
}

function getLowStockComponents() {
  const db = getDb();
  return deepClone(db.components.filter((item) => item.isLowStock));
}

function getConsumptionHistory() {
  const db = getDb();
  return deepClone(
    db.consumptionHistory
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
}

function importExcel(files) {
  return withDb((db) => {
    const allowed = ["xlsx", "xlsm"];
    const fileNames = files.map((file) => file.name);

    for (const file of files) {
      const extension = file.name.split(".").pop().toLowerCase();
      if (!allowed.includes(extension)) {
        throw new Error(`Unsupported file type for ${file.name}. Allowed: .xlsx, .xlsm`);
      }
    }

    replaceDbWithSeedData(db);

    const record = {
      id: generateId("imp"),
      files: fileNames,
      importedAt: nowIso(),
      mode: "local_seed_replace",
    };
    db.importHistory.push(record);
    emitDataChange("import_completed", {
      files: fileNames,
      recordsAffected: db.components.length + db.pcbs.length,
    });

    return {
      importedFiles: fileNames,
      recordsAffected: db.components.length + db.pcbs.length,
      message:
        "Imported successfully. Local mode loaded the full pre-analyzed workbook dataset and refreshed inventory, PCB mappings, and analytics.",
      importRecord: record,
    };
  });
}

function exportInventory() {
  const db = getDb();
  const rows = [
    ["Component Name", "Part Number", "Current Stock Quantity", "Monthly Required Quantity"],
    ...db.components.map((component) => [
      component.name,
      component.partNumber,
      component.currentStockQty,
      component.monthlyRequiredQty,
    ]),
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

function exportConsumption() {
  const db = getDb();
  const rows = [
    ["Date", "PCB", "Component", "Consumed Qty"],
    ...db.consumptionHistory.map((entry) => [
      entry.date,
      entry.pcbName,
      entry.componentName,
      entry.consumedQty,
    ]),
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

function resetDbFromSeed() {
  localStorage.removeItem(DB_STORAGE_KEY);
  const db = seedDb();
  emitDataChange("local_reset_seed", {});
  return db;
}

export const localDb = {
  listComponents,
  getComponentById,
  createComponent,
  updateComponent,
  listPcbs,
  getPcbById,
  createPcb,
  createProductionEntry,
  listProductionEntries,
  listProcurementTriggers,
  getDashboardSummary,
  getTopConsumed,
  getConsumptionHistory,
  getLowStockComponents,
  importExcel,
  exportInventory,
  exportConsumption,
  resetDbFromSeed,
};
