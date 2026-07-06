import { getPlanMedia } from "./catalog-assets.js";
import { createPlanInquiryForm } from "./catalog-form.js";
import { clear, el, qs, qsa } from "../../utils/dom.js";
import { formatMoneyARS } from "../../components/plan-components.js";

const CATEGORY_FILTERS = Object.freeze([
  { value: "all", label: "Todos", detail: "Todas las opciones" },
  { value: "autos", label: "Autos", detail: "0 km y utilitarios" },
  { value: "motos", label: "Motos", detail: "Planes de motos" },
  { value: "dinero", label: "Dinero", detail: "Órdenes de compra" },
]);

const AUTO_SUBCATEGORY_FILTERS = Object.freeze([
  { value: "all", label: "Todos" },
  { value: "baja-gama", label: "Gama baja" },
  { value: "alta-gama", label: "Alta gama" },
  { value: "utilitarios", label: "Utilitarios" },
]);

function moneyOrConfirm(value) {
  return value ? formatMoneyARS(value) : "A confirmar";
}

function chanceLabel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "A confirmar";
  return `${number} ${number === 1 ? "chance" : "chances"}`;
}

function categoryClass(plan) {
  return `plan-category--${plan.category || "default"}`;
}

function cardClass(plan) {
  const classes = ["plan-list-card", `plan-list-card--${plan.category || "default"}`];
  if (Number(plan.prizeChances) === 5) classes.push("plan-list-card--featured");
  return classes.join(" ");
}

function createFilterButton(filter, activeValue, groupName) {
  return el("button", {
    className: `catalog-filter-chip catalog-filter-chip--${groupName}`,
    attrs: {
      type: "button",
      "data-filter-group": groupName,
      "data-filter-value": filter.value,
      "aria-pressed": filter.value === activeValue ? "true" : "false",
    },
    children: [
      el("span", { className: "catalog-filter-chip__mark", attrs: { "aria-hidden": "true" } }),
      el("span", {
        className: "catalog-filter-chip__copy",
        children: [
          el("strong", { text: filter.label }),
          filter.detail ? el("small", { text: filter.detail }) : null,
        ],
      }),
    ],
  });
}

function createFilters() {
  return el("section", {
    className: "plans-catalog-filters",
    attrs: { "aria-labelledby": "plans-catalog-filter-title" },
    children: [
      el("div", {
        className: "plans-catalog-intro",
        children: [
          el("h1", { text: "Conocé todos nuestros planes", attrs: { id: "plans-catalog-filter-title" } }),
          el("p", {
            text: "Compará opciones y elegí la mejor forma para llegar a tu 0 km o capital en dinero.",
          }),
        ],
      }),
      el("div", {
        className: "plans-catalog-panel",
        children: [
          el("div", {
            className: "plans-catalog-filters__surface",
            children: [
              el("label", {
                className: "plans-catalog-search",
                attrs: { for: "plans-catalog-search" },
                children: [
                  el("span", { className: "visually-hidden", text: "Buscar por modelo, código o categoría" }),
                  el("span", { className: "plans-catalog-search__icon", attrs: { "aria-hidden": "true" } }),
                  el("input", {
                    attrs: {
                      id: "plans-catalog-search",
                      type: "search",
                      placeholder: "Buscar modelo, código o categoría",
                      "data-plan-search": "",
                    },
                  }),
                ],
              }),
              el("button", {
                className: "plans-catalog-clear",
                text: "Limpiar",
                attrs: { type: "button", "data-plan-clear": "" },
              }),
            ],
          }),
          el("div", {
            className: "plans-catalog-filters__meta",
            children: [
              el("span", { className: "plans-catalog-filter-label", text: "Filtrar por tipo de plan" }),
              el("p", { className: "plans-catalog-result", text: "", attrs: { "data-plan-result": "", "aria-live": "polite" } }),
            ],
          }),
          el("div", {
            className: "plans-catalog-filter-groups",
            children: [
              el("div", {
                className: "plans-catalog-filter-group plans-catalog-filter-group--main",
                children: [
                  el("div", {
                    className: "plans-catalog-filterbar",
                    attrs: { "aria-label": "Filtrar por categoría" },
                    children: CATEGORY_FILTERS.map((filter) => createFilterButton(filter, "all", "category")),
                  }),
                ],
              }),
              el("div", {
                className: "plans-catalog-filter-group plans-catalog-filter-group--sub",
                attrs: { "data-auto-subfilters": "", "data-visible": "false", "aria-hidden": "true" },
                children: [
                  el("div", {
                    className: "plans-catalog-filterbar plans-catalog-filterbar--sub",
                    attrs: { "aria-label": "Filtrar autos por subcategoría" },
                    children: AUTO_SUBCATEGORY_FILTERS.map((filter) => createFilterButton(filter, "all", "subcategory")),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

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

function createCardPrice(plan) {
  return el("div", {
    className: "plan-list-card__price",
    children: [
      el("div", {
        className: "plan-list-card__price-main",
        children: [
          el("span", { className: "plan-list-card__price-label", text: "Cuota mensual" }),
          el("strong", { text: moneyOrConfirm(plan.monthlyFee) }),
        ],
      }),
      el("small", {
        className: "plan-list-card__nominal",
        children: [el("span", { text: "V.N. total" }), el("b", { text: moneyOrConfirm(plan.nominalValue) })],
      }),
    ],
  });
}

function createCategoryTag(plan) {
  return el("span", {
    className: `plan-list-card__tag ${categoryClass(plan)}`,
    children: [
      el("span", { className: "plan-list-card__tag-dot", attrs: { "aria-hidden": "true" } }),
      el("span", { text: plan.categoryLabel }),
    ],
  });
}

function createCardMeta(plan) {
  return el("div", {
    className: "plan-list-card__meta",
    children: [
      el("span", { className: "plan-list-card__code", text: `Código ${plan.article || "-"}` }),
      plan.subcategoryLabel ? el("span", { className: "plan-list-card__subcat", text: plan.subcategoryLabel }) : null,
    ],
  });
}

function createPlanCard(plan) {
  const media = getPlanMedia(plan);
  const chanceCount = Number(plan.prizeChances);
  const hasFeaturedChances = chanceCount === 5;

  return el("article", {
    className: cardClass(plan),
    attrs: {
      "data-plan-card": "",
      "data-article": plan.article,
      "data-category": plan.category,
      "data-subcategory": plan.subcategory || "",
      "data-search": plan.searchText,
    },
    children: [
      el("div", {
        className: "plan-list-card__media",
        children: [
          el("img", {
            attrs: {
              src: media.defaultImage.src,
              alt: plan.displayName,
              loading: "lazy",
            },
          }),
        ],
      }),
      !hasFeaturedChances ? createCardPrice(plan) : null,
      hasFeaturedChances
        ? el("span", {
            className: "plan-list-card__ribbon",
            children: [
              el("strong", { text: String(chanceCount) }),
              el("span", { text: chanceCount === 1 ? "chance de ganar" : "chances de ganar" }),
            ],
          })
        : null,
      el("div", {
        className: "plan-list-card__body",
        children: [
          el("div", {
            className: "plan-list-card__info",
            children: [
              el("h3", { text: plan.displayName }),
              hasFeaturedChances ? createCardPrice(plan) : null,
              el("div", {
                className: "plan-list-card__identity",
                children: [createCategoryTag(plan), createCardMeta(plan)],
              }),
              el("button", {
                className: "button plan-list-card__action",
                text: "Ver más",
                attrs: { type: "button", "data-open-plan": plan.article },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createEmptyState() {
  return el("article", {
    className: "plans-catalog-empty",
    attrs: { "data-catalog-empty": "", hidden: true },
    children: [
      el("h3", { text: "No se encontraron resultados" }),
      el("p", { text: "Probá cambiar la categoría, la búsqueda o la subcategoría seleccionada." }),
    ],
  });
}

function createDetailShell() {
  return el("section", {
    className: "plan-detail-drawer",
    attrs: {
      "data-plan-detail-drawer": "",
      hidden: true,
      "aria-modal": "true",
      role: "dialog",
      "aria-live": "polite",
    },
  });
}

function createCatalogGrid(items) {
  return el("section", {
    className: "plans-catalog-listing",
    attrs: { "aria-labelledby": "plans-catalog-list-title" },
    children: [
      el("h2", { className: "visually-hidden", text: "Listado de planes", attrs: { id: "plans-catalog-list-title" } }),
      createDetailShell(),
      el("div", {
        className: "plans-catalog-grid",
        attrs: { "data-plan-grid": "" },
        children: items.map(createPlanCard),
      }),
      createEmptyState(),
    ],
  });
}

function angleTabLabel(image) {
  const labels = {
    front_left: "Frente izq.",
    front: "Frente",
    front_right: "Frente der.",
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

function detailProductName(plan, brand) {
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

function createDetail(plan, contactConfig) {
  const media = getPlanMedia(plan);
  const productName = detailProductName(plan, media.brand);

  return el("article", {
    className: "plan-detail-card",
    attrs: { "data-plan-detail-card": "", tabindex: "-1", "aria-labelledby": `plan-detail-title-${plan.article}` },
    children: [
      el("div", {
        className: "plan-detail-card__top",
        children: [
          el("div", {
            className: "plan-detail-card__identity",
            children: [
              el("div", {
                className: media.brand ? "plan-detail-card__title-panel has-brand" : "plan-detail-card__title-panel",
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
              el("div", {
                className: "plan-detail-card__image",
                children: [
                  el("img", {
                    attrs: {
                      src: media.defaultImage.src,
                      alt: plan.displayName,
                      "data-plan-angle-image": "",
                    },
                  }),
                ],
              }),
              createAngleSelector(plan, media),
              el("span", { className: "plan-detail-card__image-note", text: "* Imagen ilustrativa" }),
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

function initFiltering(root) {
  const cards = qsa("[data-plan-card]", root);
  const result = qs("[data-plan-result]", root);
  const search = qs("[data-plan-search]", root);
  const subfilters = qs("[data-auto-subfilters]", root);
  const clearButton = qs("[data-plan-clear]", root);
  const empty = qs("[data-catalog-empty]", root);
  const state = {
    category: "all",
    subcategory: "all",
    query: "",
  };

  function setPressed(group, value) {
    qsa(`[data-filter-group="${group}"]`, root).forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.filterValue === value ? "true" : "false");
    });
  }

  function update() {
    let visible = 0;
    const showAutoSubfilters = state.category === "autos";
    if (subfilters) {
      subfilters.dataset.visible = showAutoSubfilters ? "true" : "false";
      subfilters.setAttribute("aria-hidden", showAutoSubfilters ? "false" : "true");
      qsa("[data-filter-group]", subfilters).forEach((button) => {
        button.tabIndex = showAutoSubfilters ? 0 : -1;
      });
    }
    if (!showAutoSubfilters) state.subcategory = "all";

    cards.forEach((card) => {
      const matchesCategory = state.category === "all" || card.dataset.category === state.category;
      const matchesSubcategory =
        state.subcategory === "all" || (card.dataset.category === "autos" && card.dataset.subcategory === state.subcategory);
      const matchesQuery = !state.query || (card.dataset.search || "").includes(state.query);
      const show = matchesCategory && matchesSubcategory && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (result) result.textContent = `Resultados: ${visible}`;
    if (clearButton) {
      clearButton.disabled = state.category === "all" && state.subcategory === "all" && !state.query;
    }
    if (empty) empty.hidden = visible > 0;
    setPressed("category", state.category);
    setPressed("subcategory", state.subcategory);
  }

  qsa("[data-filter-group]", root).forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.filterGroup;
      const value = button.dataset.filterValue;
      if (group === "category") state.category = value;
      if (group === "subcategory") state.subcategory = value;
      update();
    });
  });

  search?.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    update();
  });

  clearButton?.addEventListener("click", () => {
    state.category = "all";
    state.subcategory = "all";
    state.query = "";
    if (search) search.value = "";
    update();
  });

  update();
}

function initDetail(root, items, contactConfig) {
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
    button.addEventListener("click", () => openPlan(button.dataset.openPlan));
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

export function createPlansCatalog(catalog, contactConfig) {
  const root = el("div", {
    className: "plans-catalog-page",
    children: [createFilters(), createCatalogGrid(catalog.items)],
  });

  initFiltering(root);
  initDetail(root, catalog.items, contactConfig);
  return root;
}
