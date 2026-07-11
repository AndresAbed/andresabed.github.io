import { clear, el, qs, qsa } from "../../utils/dom.js";
import { getPlanMedia } from "./catalog-assets.js";
import { createPlanInquiryForm } from "./catalog-form.js";
import { brandKey, categoryClass, chanceLabel, detailProductName, moneyOrConfirm } from "./catalog-format.js";

function chanceTooltipText(chances) {
  const count = Number(chances);
  if (!Number.isFinite(count) || count <= 1) return "";

  const endPosition = count === 3 ? "tercer" : count === 5 ? "quinto" : `${count}°`;
  return `Con tu mismo número tenés ${count} oportunidades distintas de ganar: desde el premio mayor de tu plan en el primer puesto, hasta importantes sumas de dinero en efectivo del segundo al ${endPosition} puesto.`;
}

function createMetric(label, value, tone = "", tooltipText = "") {
  const tooltipId = tooltipText
    ? `plan-metric-tooltip-${label.toLowerCase().replaceAll(" ", "-")}-${Math.random().toString(36).slice(2)}`
    : "";

  return el("div", {
    className: tone ? `plan-metric plan-metric--${tone}` : "plan-metric",
    children: [
      el("div", {
        className: "plan-metric__heading",
        children: [
          el("span", { className: "plan-metric__label", text: label }),
          tooltipText
            ? el("span", {
                className: "plan-metric__tooltip-wrap",
                children: [
                  el("button", {
                    className: "plan-metric__tooltip-trigger",
                    text: "i",
                    attrs: {
                      type: "button",
                      "aria-label": `Qué significa ${label.toLowerCase()}`,
                      "aria-describedby": tooltipId,
                    },
                  }),
                  el("span", {
                    className: "plan-metric__tooltip",
                    text: tooltipText,
                    attrs: { id: tooltipId, role: "tooltip" },
                  }),
                ],
              })
            : null,
        ].filter(Boolean),
      }),
      el("strong", { text: value }),
    ],
  });
}

function angleTabLabel(image) {
  const labels = {
    front_left: "Frente izq.",
    front: "Frente",
    front_right: "Frente der.",
    side: "Lateral",
    rear_right: "Atrás der.",
    rear: "Atrás",
  };
  return labels[image.id] || image.label;
}

function createAngleSelector(plan, media) {
  if (!media.images.length || media.images.length === 1) return null;

  const defaultIndex = Math.max(
    media.images.findIndex((image) => image.id === media.defaultAngle),
    0,
  );
  const defaultProgress = media.images.length > 1 ? (defaultIndex / (media.images.length - 1)) * 100 : 0;

  return el("div", {
    className: "plan-angle-tabs",
    attrs: { role: "group", "aria-label": `Vistas disponibles de ${plan.displayName}` },
    children: [
      ...media.images.map((image) =>
        el("button", {
          className: image.id === media.defaultAngle ? "plan-angle-tab is-active" : "plan-angle-tab",
          text: angleTabLabel(image),
          attrs: {
            type: "button",
            "data-angle-button": image.id,
            "data-angle-src": image.src,
            "data-angle-label": image.label,
            "data-angle-position": image.position,
            "aria-label": image.label,
            "aria-pressed": image.id === media.defaultAngle ? "true" : "false",
          },
        }),
      ),
      el("input", {
        className: "plan-angle-range",
        attrs: {
          type: "range",
          min: "0",
          max: "100",
          step: "0.1",
          value: String(defaultProgress),
          "data-angle-range": "",
          "aria-label": `Cambiar ángulo de ${plan.displayName}`,
        },
      }),
    ],
  });
}

function mediaStyle(media) {
  const scale = media?.scale || {};
  const position = media?.position || {};
  const rules = [];
  if (scale.detailWidth) rules.push(`--plan-media-detail-width: ${scale.detailWidth}`);
  if (scale.detailMaxHeight) rules.push(`--plan-media-detail-max-height: ${scale.detailMaxHeight}`);
  if (position.detailOffsetY) rules.push(`--plan-media-detail-offset-y: ${position.detailOffsetY}`);
  return rules.join("; ");
}

function createDetailImage(plan, media) {
  if (media.hasImage && media.defaultImage) {
    return el("div", {
      className: "plan-detail-card__image",
      attrs: { "data-image-position": media.defaultImage.position, "data-image-folder": media.folder },
      children: [
        el("img", {
          attrs: {
            src: media.defaultImage.src,
            alt: `Imagen ilustrativa de ${plan.displayName}`,
            "data-angle-position": media.defaultImage.position,
            "data-plan-angle-image": "",
          },
        }),
      ],
    });
  }

  return el("div", {
    className: "plan-detail-card__image plan-detail-card__image--placeholder",
    attrs: { "data-image-position": "placeholder", "data-image-folder": "" },
    children: [
      el("div", {
        className: "plan-detail-card__image-placeholder",
        attrs: { role: "img", "aria-label": `Imagen pendiente para ${plan.displayName}` },
        children: [
          el("span", { text: "Imagen pendiente" }),
          el("small", { text: `Código ${plan.article || "-"}` }),
        ],
      }),
    ],
  });
}

function createDetail(plan, contactConfig) {
  const media = getPlanMedia(plan);
  const productName = detailProductName(plan, media.brand);

  return el("article", {
    className: "plan-detail-card",
    attrs: {
      "data-plan-detail-card": "",
      "data-plan-article": plan.article,
      "data-image-folder": media.folder,
      "data-media-fit": media.fit || "",
      style: mediaStyle(media),
      tabindex: "-1",
      "aria-labelledby": `plan-detail-title-${plan.article}`,
    },
    children: [
      el("div", {
        className: "plan-detail-card__top",
        children: [
          el("div", {
            className: "plan-detail-card__identity",
            children: [
              el("div", {
                className: media.brand ? "plan-detail-card__title-panel has-brand" : "plan-detail-card__title-panel",
                attrs: media.brand ? { "data-brand-key": brandKey(media.brand) } : {},
                children: [
                  media.brand
                    ? el("div", {
                        className: "plan-detail-card__brand-panel",
                        attrs: {
                          role: "img",
                          "aria-label": media.brand.logoAlt,
                          style: `--brand-logo: url("${media.brand.logo}")`,
                        },
                        children: [el("span", { className: "plan-detail-card__brand-shape", attrs: { "aria-hidden": "true" } })],
                      })
                    : null,
                  el("div", {
                    className: "plan-detail-card__title-copy",
                    children: [
                      el("span", { className: `badge ${categoryClass(plan)}`, text: `${plan.categoryLabel}${plan.subcategoryLabel ? ` · ${plan.subcategoryLabel}` : ""}` }),
                      el("h2", { text: productName, attrs: { id: `plan-detail-title-${plan.article}` } }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          el("button", {
            className: "plan-detail-card__close",
            text: "Cerrar",
            attrs: { type: "button", "data-close-plan": "", "aria-label": "Cerrar detalle del plan" },
          }),
        ],
      }),
      el("div", {
        className: "plan-detail-card__layout",
        children: [
          el("div", {
            className: "plan-detail-card__visual",
            children: [
              createDetailImage(plan, media),
              createAngleSelector(plan, media),
              el("span", { className: "plan-detail-card__image-note", text: media.hasImage ? "* Imagen ilustrativa" : "Imagen pendiente de carga" }),
            ],
          }),
          el("div", {
            className: "plan-detail-card__content",
            children: [
              el("div", {
                className: "plan-detail-card__metrics",
                children: [
                  createMetric("Cuota mensual", moneyOrConfirm(plan.monthlyFee), "primary"),
                  createMetric("Valor nominal", moneyOrConfirm(plan.nominalValue)),
                  createMetric("Chances de premio", chanceLabel(plan.prizeChances), "", chanceTooltipText(plan.prizeChances)),
                  createMetric("Código", String(plan.article || "-")),
                ],
              }),
              el("section", {
                className: "plan-detail-card__form",
                attrs: { "aria-labelledby": `plan-form-title-${plan.article}` },
                children: [createPlanInquiryForm(plan, contactConfig)],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function updateUrlForPlan(plan) {
  const url = new URL(window.location.href);
  url.searchParams.set("plan", String(plan.article));
  window.history.pushState({ planArticle: plan.article }, "", url);
}

function clearPlanFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("plan");
  window.history.pushState({}, "", url);
}

function initAngleSelector(detail) {
  const image = qs("[data-plan-angle-image]", detail);
  const buttons = qsa("[data-angle-button]", detail);
  const range = qs("[data-angle-range]", detail);
  if (!image || !buttons.length) return;

  const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));
  const indexToProgress = (index) => (buttons.length > 1 ? (index / (buttons.length - 1)) * 100 : 0);
  const progressToIndex = (progress) =>
    Math.min(buttons.length - 1, Math.max(0, Math.round((clampProgress(progress) / 100) * (buttons.length - 1))));
  let currentIndex = -1;

  const setRangeProgress = (progress) => {
    if (!range) return;
    const safeProgress = clampProgress(progress);
    range.value = String(safeProgress);
  };

  const setActiveAngle = (button, index, { syncRange = true } = {}) => {
    if (index !== currentIndex) {
      image.src = button.dataset.angleSrc;
      image.alt = button.dataset.angleLabel || image.alt;
      image.dataset.anglePosition = button.dataset.anglePosition || "";
      buttons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      currentIndex = index;
    }

    if (range) {
      if (syncRange) setRangeProgress(indexToProgress(index));
      range.setAttribute("aria-valuetext", button.dataset.angleLabel || button.textContent.trim());
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => setActiveAngle(button, index));
  });

  if (range) {
    const updateFromRange = () => {
      const progress = clampProgress(range.value);
      const index = progressToIndex(progress);
      setRangeProgress(progress);
      setActiveAngle(buttons[index], index, { syncRange: false });
    };

    range.addEventListener("input", updateFromRange);
    range.addEventListener("change", updateFromRange);
  }

  const activeIndex = Math.max(
    buttons.findIndex((button) => button.classList.contains("is-active")),
    0,
  );
  setActiveAngle(buttons[activeIndex], activeIndex);
}

function hasInteractiveTarget(target, card) {
  if (!(target instanceof Element)) return false;
  const interactive = target.closest("a, button, input, select, textarea, label, [role='button'], [data-ignore-card-click]");
  return Boolean(interactive && interactive !== card && card.contains(interactive));
}

export function initDetail(root, items, contactConfig) {
  const drawer = qs("[data-plan-detail-drawer]", root);
  if (!drawer) return;

  if (drawer.parentElement !== document.body) {
    document.body.appendChild(drawer);
  }

  function openPlan(article, { pushUrl = true } = {}) {
    const plan = items.find((item) => String(item.article) === String(article));
    if (!plan) return;

    clear(drawer);
    drawer.hidden = false;
    drawer.append(
      el("button", {
        className: "plan-detail-drawer__backdrop",
        attrs: { type: "button", "data-close-plan": "", "aria-label": "Cerrar detalle del plan" },
      }),
      createDetail(plan, contactConfig),
    );
    drawer.dataset.open = "true";
    document.body.classList.add("plan-drawer-open");
    initAngleSelector(drawer);
    qsa("[data-close-plan]", drawer).forEach((button) => {
      button.addEventListener("click", () => closePlan({ pushUrl: true }));
    });
    if (pushUrl) updateUrlForPlan(plan);
    window.requestAnimationFrame(() => qs("[data-plan-detail-card]", drawer)?.focus({ preventScroll: true }));
  }

  function closePlan({ pushUrl = false } = {}) {
    drawer.dataset.open = "false";
    drawer.hidden = true;
    clear(drawer);
    document.body.classList.remove("plan-drawer-open");
    if (pushUrl) clearPlanFromUrl();
  }

  qsa("[data-open-plan]", root).forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openPlan(button.dataset.openPlan);
    });
  });

  qsa("[data-open-plan-card]", root).forEach((card) => {
    card.addEventListener("click", (event) => {
      if (hasInteractiveTarget(event.target, card)) return;
      openPlan(card.dataset.openPlanCard);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (hasInteractiveTarget(event.target, card)) return;
      event.preventDefault();
      openPlan(card.dataset.openPlanCard);
    });
  });

  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const article = params.get("plan");
    if (article) openPlan(article, { pushUrl: false });
    else closePlan();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.dataset.open === "true") {
      closePlan({ pushUrl: true });
    }
  });

  const initialArticle = new URLSearchParams(window.location.search).get("plan");
  if (initialArticle) openPlan(initialArticle, { pushUrl: false });
}
