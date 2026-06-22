import { hasValue, isMockStatus, isPendingStatus } from "./validators.js";

export const UI_STATES = Object.freeze({
  READY: "ready",
  PARTIAL: "partial",
  EMPTY: "empty",
  DISABLED: "disabled",
});

export const FALLBACK_TEXT = Object.freeze({
  updating: "Informacion en actualizacion",
  confirm: "A confirmar",
  unavailable: "Canal en configuracion",
});

export function normalizeStatus(status) {
  return status || "unknown";
}

export function resolveValueState(value, status) {
  if (!hasValue(value)) return UI_STATES.EMPTY;
  if (isMockStatus(status)) return UI_STATES.DISABLED;
  if (isPendingStatus(status)) return UI_STATES.PARTIAL;
  return UI_STATES.READY;
}

export function resolveActionState(target, status) {
  if (!hasValue(target)) return UI_STATES.DISABLED;
  if (isMockStatus(status) || isPendingStatus(status)) return UI_STATES.DISABLED;
  return UI_STATES.READY;
}

export function resolveListState(items) {
  if (!Array.isArray(items) || items.length === 0) return UI_STATES.EMPTY;
  const hasReadyItem = items.some((item) => !isMockStatus(item?.status));
  return hasReadyItem ? UI_STATES.READY : UI_STATES.EMPTY;
}

export function formatStatusFallback(state, fallback = FALLBACK_TEXT.updating) {
  if (state === UI_STATES.READY) return "";
  if (state === UI_STATES.PARTIAL) return fallback;
  if (state === UI_STATES.DISABLED) return FALLBACK_TEXT.unavailable;
  return FALLBACK_TEXT.updating;
}
