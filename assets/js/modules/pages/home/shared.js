import { normalizeInternalTarget, withSiteBasePath } from "../../data/api.js";
import { el } from "../../utils/dom.js";

export function getPrimaryCta(site) {
  const cta = site?.cta?.primary;
  return {
    label: cta?.label || "Hablar por WhatsApp",
    href: normalizeInternalTarget(cta?.target) || normalizeInternalTarget("/planes/"),
  };
}

export function createHomeSectionHeader({ eyebrow, title, intro, id, align = "start" }) {
  return el("div", {
    className: `home-section-header home-section-header--${align}`,
    children: [
      eyebrow ? el("span", { className: "home-eyebrow", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

export function createPlanVisual(item, className = "home-plan-visual") {
  if (!item?.imageUrl) return null;

  return el("img", {
    className,
    attrs: {
      src: withSiteBasePath(item.imageUrl),
      alt: item.imageAlt || item.displayName,
      loading: "lazy",
    },
  });
}
