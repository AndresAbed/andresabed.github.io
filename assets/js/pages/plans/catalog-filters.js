import { el, qs, qsa } from "../../utils/dom.js";
import { brandKey } from "./catalog-format.js";

const CATEGORY_FILTERS = Object.freeze([
  { value: "all", label: "Todos", detail: "Ver todo el catálogo" },
  { value: "autos", label: "Autos", detail: "Autos y utilitarios" },
  { value: "motos", label: "Motos", detail: "Opciones para moto" },
  { value: "dinero", label: "Dinero", detail: "Órdenes de compra" },
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

function brandName(plan) {
  return plan?.mediaMetadata?.brand?.name || "";
}

function createBrandFilters(items = []) {
  const brands = new Map();

  items.forEach((item) => {
    if (item.category !== "autos" && item.category !== "motos") return;
    const name = brandName(item);
    const value = brandKey({ name });
    const key = `${item.category}:${value}`;
    if (!name || !value) return;
    if (!brands.has(key)) {
      brands.set(key, {
        value,
        label: name,
        category: item.category,
      });
    }
  });

  return [
    { value: "all", label: "Todas" },
    ...[...brands.values()].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category, "es");
      return a.label.localeCompare(b.label, "es");
    }),
  ];
}

export function createFilters(items = []) {
  const brandFilters = createBrandFilters(items);

  return el("section", {
    className: "plans-catalog-filters",
    attrs: { "aria-labelledby": "plans-catalog-filter-title" },
    children: [
      el("div", {
        className: "plans-catalog-intro",
        children: [
          el("h1", { text: "Compará los planes disponibles", attrs: { id: "plans-catalog-filter-title" } }),
          el("p", {
            text: "Compará autos, motos y órdenes de compra para elegir la alternativa que mejor se ajuste a lo que buscás.",
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
                  el("span", { className: "visually-hidden", text: "Buscar por marca, modelo o código" }),
                  el("span", { className: "plans-catalog-search__icon", attrs: { "aria-hidden": "true" } }),
                  el("input", {
                    attrs: {
                      id: "plans-catalog-search",
                      type: "search",
                      placeholder: "Buscar marca, modelo o código",
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
              el("span", { className: "plans-catalog-filter-label", text: "Elegí una categoría" }),
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
                className: "plans-catalog-filter-group plans-catalog-filter-group--sub plans-catalog-filter-group--brand",
                attrs: { "data-brand-filters": "", "data-visible": "false", "data-filter-category": "", "aria-hidden": "true" },
                children: [
                  el("div", {
                    className: "plans-catalog-filterbar plans-catalog-filterbar--sub",
                    attrs: { "aria-label": "Filtrar por marca" },
                    children: brandFilters.map((filter) => {
                      const attrs = filter.category ? { "data-brand-category": filter.category } : {};
                      const button = createFilterButton(filter, "all", "brand");
                      Object.entries(attrs).forEach(([key, value]) => button.setAttribute(key, value));
                      return button;
                    }),
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
  const brandFilters = qs("[data-brand-filters]", root);
  const clearButton = qs("[data-plan-clear]", root);
  const empty = qs("[data-catalog-empty]", root);
  const state = {
    category: "all",
    brand: "all",
    query: "",
  };

  function setPressed(group, value) {
    qsa(`[data-filter-group="${group}"]`, root).forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.filterValue === value ? "true" : "false");
    });
  }

  function update() {
    let visible = 0;
    const showBrandFilters = state.category === "autos" || state.category === "motos";
    if (brandFilters) {
      brandFilters.dataset.visible = showBrandFilters ? "true" : "false";
      brandFilters.dataset.filterCategory = showBrandFilters ? state.category : "";
      brandFilters.setAttribute("aria-hidden", showBrandFilters ? "false" : "true");
      qsa("[data-filter-group]", brandFilters).forEach((button) => {
        const buttonCategory = button.dataset.brandCategory || "";
        const isVisible = showBrandFilters && (!buttonCategory || buttonCategory === state.category);
        button.hidden = !isVisible;
        button.tabIndex = isVisible ? 0 : -1;
      });
    }
    if (!showBrandFilters) state.brand = "all";

    cards.forEach((card) => {
      const matchesCategory = state.category === "all" || card.dataset.category === state.category;
      const matchesBrand = state.brand === "all" || card.dataset.brand === state.brand;
      const matchesQuery = !state.query || (card.dataset.search || "").includes(state.query);
      const show = matchesCategory && matchesBrand && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (result) result.textContent = `Resultados: ${visible}`;
    if (clearButton) {
      clearButton.disabled = state.category === "all" && state.brand === "all" && !state.query;
    }
    if (empty) empty.hidden = visible > 0;
    setPressed("category", state.category);
    setPressed("brand", state.brand);
  }

  qsa("[data-filter-group]", root).forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.filterGroup;
      const value = button.dataset.filterValue;
      if (group === "category") {
        state.category = value;
        state.brand = "all";
      }
      if (group === "brand") state.brand = value;
      update();
    });
  });

  search?.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    update();
  });

  clearButton?.addEventListener("click", () => {
    state.category = "all";
    state.brand = "all";
    state.query = "";
    if (search) search.value = "";
    update();
  });

  update();
}
