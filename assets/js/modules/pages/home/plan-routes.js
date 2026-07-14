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
    imageUrl: "/assets/img/plans/plan-auto-hilux-cronos-900.webp",
    imageSrcset: "/assets/img/plans/plan-auto-hilux-cronos-480.webp 480w, /assets/img/plans/plan-auto-hilux-cronos-900.webp 900w",
    imageSizes: "(max-width: 720px) calc(100vw - 72px), (max-width: 1040px) 46vw, 360px",
    imageWidth: 900,
    imageHeight: 442,
  },
  motos: {
    imageUrl: "/assets/img/plans/plan-moto-honda-xr-cb-900.webp",
    imageSrcset: "/assets/img/plans/plan-moto-honda-xr-cb-480.webp 480w, /assets/img/plans/plan-moto-honda-xr-cb-900.webp 900w",
    imageSizes: "(max-width: 720px) calc(100vw - 72px), (max-width: 1040px) 46vw, 360px",
    imageWidth: 900,
    imageHeight: 569,
  },
  dinero: {
    imageUrl: "/assets/img/plans/plan-dinero-billetes-900.webp",
    imageSrcset: "/assets/img/plans/plan-dinero-billetes-480.webp 480w, /assets/img/plans/plan-dinero-billetes-900.webp 900w",
    imageSizes: "(max-width: 720px) calc(100vw - 72px), (max-width: 1040px) 46vw, 360px",
    imageWidth: 900,
    imageHeight: 600,
  },
});
export function renderPlanRoutes(data) {
  const target = qs("[data-plan-routes]");
  if (!target) return;

  const preferredOrder = ["motos", "autos", "dinero"];
  const categories = [...getCatalogCategories(data.planCatalog)].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.slug);
    const bIndex = preferredOrder.indexOf(b.slug);
    return (aIndex === -1 ? preferredOrder.length : aIndex) - (bIndex === -1 ? preferredOrder.length : bIndex);
  });
  const copy = {
    autos: {
      title: "Autos",
      body: "Opciones para auto o utilitario, pensadas para quienes quieren planificar su próximo vehículo.",
      cta: "Ver planes",
    },
    motos: {
      title: "Motos",
      body: "Acercate a tu moto con una alternativa de ahorro clara, accesible y acompañada desde el primer paso.",
      cta: "Ver planes",
    },
    dinero: {
      title: "Órdenes de compra",
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
