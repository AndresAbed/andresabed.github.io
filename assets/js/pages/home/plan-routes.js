import { getCatalogCategories, getCatalogItemsByCategory } from "../../data/api.js";
import { categoryHref, createButton } from "../../components/plan-components.js";
import { clear, el, qs } from "../../utils/dom.js";
import { createHomeSectionHeader, createPlanVisual } from "./shared.js";

function getCategoryStats(planCatalog, category) {
  const items = getCatalogItemsByCategory(planCatalog, category.slug);
  const leadItem = items.find((item) => item.imageUrl) || items[0];

  return {
    items,
    leadItem,
  };
}
const CATEGORY_CARD_IMAGES = Object.freeze({
  autos: {
    imageUrl: "/assets/img/plans/plan-auto-hilux-cronos.webp",
    imageAlt: "Auto y camioneta disponibles en planes Club San Jorge",
  },
  motos: {
    imageUrl: "/assets/img/plans/plan-moto-honda-xr-cb.webp",
    imageAlt: "Motos disponibles en planes Club San Jorge",
  },
  dinero: {
    imageUrl: "/assets/img/plans/plan-dinero-billetes.webp",
    imageAlt: "Billetes representando capital en dinero",
  },
});
export function renderPlanRoutes(data) {
  const target = qs("[data-trust-section]");
  if (!target) return;

  const preferredOrder = ["motos", "autos", "dinero"];
  const categories = [...getCatalogCategories(data.planCatalog)].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.slug);
    const bIndex = preferredOrder.indexOf(b.slug);
    return (aIndex === -1 ? preferredOrder.length : aIndex) - (bIndex === -1 ? preferredOrder.length : bIndex);
  });
  const copy = {
    autos: {
      title: "Plan Auto",
      body: "Opciones para auto o utilitario, pensadas para quienes quieren planificar su próximo vehículo.",
      cta: "Ver planes",
    },
    motos: {
      title: "Plan Moto",
      body: "Acercate a tu moto con una alternativa de ahorro clara, accesible y acompañada desde el primer paso.",
      cta: "Ver planes",
    },
    dinero: {
      title: "Plan Dinero",
      body: "Formá capital para tus proyectos con opciones pensadas para ahorrar de manera ordenada.",
      cta: "Ver planes",
    },
  };

  clear(target);
  target.append(
    createHomeSectionHeader({
      eyebrow: "Con nosotros podés",
      title: "Elegí el plan a tu medida",
      id: "category-entry-title",
      intro: "Conocé todas las opciones que Club San Jorge tiene para vos.",
      align: "center",
    }),
    el("div", {
      className: "home-plan-routes",
      children: categories.map((category) => {
        const stats = getCategoryStats(data.planCatalog, category);
        const content = copy[category.slug] || {
          title: category.label,
          body: category.summary || category.description,
          cta: "Ver planes",
        };
        const image = CATEGORY_CARD_IMAGES[category.slug] || stats.leadItem;

        return el("article", {
          className: `home-route-card home-route-card--${category.theme || "default"}`,
          children: [
            el("div", {
              className: "home-route-card__media",
              children: [createPlanVisual(image, "home-route-card__image")],
            }),
            el("div", {
              className: "home-route-card__body",
              children: [
                el("h3", { text: content.title }),
                el("p", { text: content.body }),
                el("div", {
                  className: "home-route-card__action",
                  children: [
                    createButton({ label: content.cta, href: categoryHref(category.slug), variant: "secondary" }),
                  ],
                }),
              ],
            }),
          ],
        });
      }),
    }),
  );
}
