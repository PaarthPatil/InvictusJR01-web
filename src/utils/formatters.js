export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
}
