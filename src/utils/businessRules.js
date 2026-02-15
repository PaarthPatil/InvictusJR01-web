export const LOW_STOCK_RATIO = 0.2;

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateLowStockThreshold(monthlyRequiredQty) {
  return toNumber(monthlyRequiredQty) * LOW_STOCK_RATIO;
}

export function isLowStockComponent(component) {
  const currentStockQty = toNumber(component.currentStockQty);
  const monthlyRequiredQty = toNumber(component.monthlyRequiredQty);
  const threshold = calculateLowStockThreshold(monthlyRequiredQty);
  return currentStockQty < threshold;
}

export function enrichComponent(component) {
  const monthlyRequiredQty = toNumber(component.monthlyRequiredQty);
  const currentStockQty = toNumber(component.currentStockQty);
  const lowStockThreshold = calculateLowStockThreshold(monthlyRequiredQty);

  return {
    ...component,
    monthlyRequiredQty,
    currentStockQty,
    lowStockThreshold,
    isLowStock: currentStockQty < lowStockThreshold,
  };
}

export function positiveNumberOrZero(value) {
  const num = toNumber(value);
  return num < 0 ? 0 : num;
}
