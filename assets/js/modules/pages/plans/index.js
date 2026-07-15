import { loadAgencyContact, normalizeInternalTarget } from "../../data/api.js";
import { clear, el, qs } from "../../utils/dom.js";
import { loadCatalogPlans } from "./catalog-api.js?v=20260714-40";
import { createPlansCatalog } from "./catalog-view.js?v=20260714-40";

function createCatalogError() {
  return el("section", {
    className: "plans-catalog-page plans-catalog-page--error",
    children: [
      el("article", {
        className: "plans-catalog-error",
        children: [
          el("span", { className: "badge badge--warning", text: "Catálogo no disponible" }),
          el("h1", { text: "No pudimos cargar los planes" }),
          el("p", {
            text:
              "Intentá recargar la página o consultanos por WhatsApp para revisar las opciones vigentes de autos, motos y dinero.",
          }),
          el("a", { className: "button button--primary", text: "Volver a intentar", attrs: { href: normalizeInternalTarget("/planes/") } }),
        ],
      }),
    ],
  });
}

export async function initPlansHub() {
  const target = qs("[data-plans-hub]");
  if (!target) return;

  try {
    const [catalog, contactConfig] = await Promise.all([loadCatalogPlans(), loadAgencyContact()]);
    clear(target);
    target.append(createPlansCatalog(catalog, contactConfig));
  } catch (error) {
    console.error(error);
    clear(target);
    target.append(createCatalogError());
  }
}
