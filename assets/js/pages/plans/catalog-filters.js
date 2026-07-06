import { el, qs, qsa } from "../../utils/dom.js";

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

export function createFilters() {
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

export function initFiltering(root) {
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
