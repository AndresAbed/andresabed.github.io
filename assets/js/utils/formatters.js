import { isBlank } from "./validators.js";
import { FALLBACK_TEXT } from "./status.js";

export function textOrFallback(value, fallback = FALLBACK_TEXT.updating) {
  return isBlank(value) ? fallback : String(value).trim();
}

export function valueOrConfirm(value) {
  return textOrFallback(value, FALLBACK_TEXT.confirm);
}

export function joinNonBlank(values, separator = " | ") {
  return values.filter((value) => !isBlank(value)).join(separator);
}

export function titleFromSlug(slug) {
  if (isBlank(slug)) return "";
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
