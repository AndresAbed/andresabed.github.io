import { normalizeInternalTarget } from "../data/api.js";
import { el } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES } from "../utils/status.js";
import { isValidUrl } from "../utils/validators.js";

export function categoryHref(slug) {
  return `/planes/#${encodeURIComponent(slug)}`;
}

export function createButton({ label, href, variant = "primary" }) {
  const target = normalizeInternalTarget(href);
  const enabled = isValidUrl(target);

  return el("a", {
    className: `button button--${enabled ? variant : "disabled"}`,
    text: label,
    attrs: enabled ? { href: target } : { href: "#", "aria-disabled": "true", title: FALLBACK_TEXT.unavailable },
  });
}

export function createSectionHeader({ eyebrow, title, intro, id }) {
  return el("div", {
    className: "section-header",
    children: [
      eyebrow ? el("span", { className: "badge", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

export function createCallout(text, tone = "default") {
  return el("div", {
    className: tone === "warning" ? "callout callout--warning" : "callout",
    children: [el("p", { text })],
  });
}

export function createMiniFact({ label, value, state = UI_STATES.READY }) {
  return el("div", {
    className: "mini-fact",
    attrs: { "data-state": state },
    children: [el("span", { text: label }), el("strong", { text: value })],
  });
}

export function formatMoneyARS(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return FALLBACK_TEXT.confirm;
  return `$${number.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}
