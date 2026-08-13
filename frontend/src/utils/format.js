export function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatSigned(n) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatNumber(n)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

export const ROLE_BADGE_CLASSES = {
  ADMIN: "bg-brass-500/15 text-brass-300 border-brass-600/40",
  BASE_COMMANDER: "bg-steel-500/15 text-steel-300 border-steel-600/40",
  LOGISTICS_OFFICER: "bg-moss-500/15 text-moss-400 border-moss-600/40",
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
