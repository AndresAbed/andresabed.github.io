import { hasValue, isMockStatus, isPendingStatus, isValidUrl } from "../utils/validators.js";
import { UI_STATES } from "../utils/status.js";

export function classifyDataItem(item, requiredKeys = []) {
  if (!item) return UI_STATES.EMPTY;
  if (isMockStatus(item.status)) return UI_STATES.DISABLED;

  const hasRequiredValues = requiredKeys.every((key) => hasValue(item[key]));
  if (!hasRequiredValues) return UI_STATES.PARTIAL;
  if (isPendingStatus(item.status)) return UI_STATES.PARTIAL;

  return UI_STATES.READY;
}

export function classifyLinkItem(item) {
  if (!item) return UI_STATES.EMPTY;
  if (!isValidUrl(item.url || item.href || item.target)) return UI_STATES.DISABLED;
  if (isMockStatus(item.status) || isPendingStatus(item.status)) return UI_STATES.PARTIAL;
  return UI_STATES.READY;
}

export function filterReadyLinks(items = []) {
  return items.filter((item) => classifyLinkItem(item) === UI_STATES.READY);
}
