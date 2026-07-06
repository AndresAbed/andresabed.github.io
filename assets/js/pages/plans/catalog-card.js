import { el } from "../../utils/dom.js";
import { getPlanMedia } from "./catalog-assets.js";
import { categoryClass, moneyOrConfirm } from "./catalog-format.js";

function cardClass(plan) {
  const classes = ["plan-list-card", `plan-list-card--${plan.category || "default"}`];
  if (Number(plan.prizeChances) === 5) classes.push("plan-list-card--featured");
  return classes.join(" ");
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

function createCardHeading(plan) {
  return el("div", {
    className: "plan-list-card__heading",
    children: [el("h3", { text: plan.displayName || "Plan a confirmar" })],
  });
}

function createChanceRibbon(chanceCount) {
  return el("span", {
    className: "plan-list-card__ribbon",
    children: [
      el("strong", { text: String(chanceCount) }),
      el("span", { text: chanceCount === 1 ? "chance de ganar" : "chances de ganar" }),
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
      hasFeaturedChances ? createChanceRibbon(chanceCount) : null,
      el("div", {
        className: "plan-list-card__body",
        children: [
          el("div", {
            className: "plan-list-card__info",
            children: [
              createCardHeading(plan),
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

export function createDetailShell() {
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

export function createCatalogGrid(items) {
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
