import { el } from "../../utils/dom.js";
import { createCatalogGrid } from "./catalog-card.js?v=20260714-40";
import { initDetail } from "./catalog-detail.js?v=20260719-1";
import { createFilters, initFiltering } from "./catalog-filters.js";

export function createPlansCatalog(catalog, contactConfig) {
  const root = el("div", {
    className: "plans-catalog-page",
    children: [createFilters(catalog.items), createCatalogGrid(catalog.items)],
  });

  initFiltering(root);
  initDetail(root, catalog.items, contactConfig);
  return root;
}
