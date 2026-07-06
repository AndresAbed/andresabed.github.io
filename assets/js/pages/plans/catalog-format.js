import { formatMoneyARS } from "../../components/plan-components.js";

export function moneyOrConfirm(value) {
  return value ? formatMoneyARS(value) : "A confirmar";
}

export function chanceLabel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "A confirmar";
  return `${number} ${number === 1 ? "chance" : "chances"}`;
}

export function categoryClass(plan) {
  return `plan-category--${plan.category || "default"}`;
}

export function brandKey(brand) {
  return (brand?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function detailProductName(plan, brand) {
  const displayName = plan.displayName || "Plan a confirmar";
  const brandName = brand?.name;
  if (!brandName) return displayName;

  const aliases = {
    Fiat: ["Fiat", "F."],
    Volkswagen: ["Volkswagen", "VW", "VW."],
  };
  const brandAliases = aliases[brandName] || [brandName];
  const escapedAliases = brandAliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`^(${escapedAliases.join("|")})\\s+`, "i");
  const withoutBrand = displayName.replace(pattern, "").trim();
  return withoutBrand || displayName;
}
