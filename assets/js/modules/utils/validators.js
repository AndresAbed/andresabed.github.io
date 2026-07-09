export function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function hasValue(value) {
  return !isBlank(value);
}

export function isValidUrl(value) {
  if (isBlank(value)) return false;

  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" || url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function isExternalUrl(value) {
  if (!isValidUrl(value)) return false;
  const url = new URL(value, window.location.origin);
  return url.origin !== window.location.origin;
}

export function isPendingStatus(status) {
  return status === "pending_validation";
}

export function isMockStatus(status) {
  return status === "mock" || status === "partial_mock";
}

export function hasRenderableUrl(item) {
  return Boolean(item && isValidUrl(item.url || item.target || item.href));
}
