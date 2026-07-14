import { el } from "../../utils/dom.js";
import { getPlanMedia } from "./catalog-assets.js";
import { brandKey, categoryClass, moneyOrConfirm } from "./catalog-format.js";

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

function createMediaPlaceholder(plan) {
  return el("div", {
    className: "plan-list-card__media-placeholder",
    children: [
      el("span", { className: "plan-list-card__media-placeholder-label", text: "Imagen no disponible" }),
      el("small", { text: `Código ${plan.article || "-"}` }),
    ],
  });
}

function createMediaContent(plan, media) {
  const cardImage = media.cardImage || media.defaultImage;

  if (media.hasImage && cardImage) {
    const image = el("img", {
      attrs: {
        src: cardImage.src,
        alt: "",
        width: String(cardImage.width || 1200),
        height: String(cardImage.height || 750),
        loading: "lazy",
        decoding: "async",
      },
    });

    image.addEventListener("error", () => {
      image.replaceWith(createMediaPlaceholder(plan));
    });

    return image;
  }

  return createMediaPlaceholder(plan);
}

function mediaStyle(media) {
  const scale = media?.scale || {};
  const position = media?.position || {};
  const rules = [];
  if (scale.card) rules.push(`--plan-media-card-scale: ${scale.card}`);
  if (scale.cardHover) rules.push(`--plan-media-card-hover-scale: ${scale.cardHover}`);
  if (scale.featured) rules.push(`--plan-media-featured-scale: ${scale.featured}`);
  if (scale.featuredHover) rules.push(`--plan-media-featured-hover-scale: ${scale.featuredHover}`);
  if (position.cardX) rules.push(`--plan-media-card-x: ${position.cardX}`);
  if (position.cardY) rules.push(`--plan-media-card-y: ${position.cardY}`);
  if (position.cardHoverX) rules.push(`--plan-media-card-hover-x: ${position.cardHoverX}`);
  if (position.cardHoverY) rules.push(`--plan-media-card-hover-y: ${position.cardHoverY}`);
  if (position.featuredX) rules.push(`--plan-media-featured-x: ${position.featuredX}`);
  if (position.featuredY) rules.push(`--plan-media-featured-y: ${position.featuredY}`);
  if (position.featuredHoverX) rules.push(`--plan-media-featured-hover-x: ${position.featuredHoverX}`);
  if (position.featuredHoverY) rules.push(`--plan-media-featured-hover-y: ${position.featuredHoverY}`);
  return rules.join("; ");
}

function createPlanCard(plan) {
  const media = getPlanMedia(plan);
  const chanceCount = Number(plan.prizeChances);
  const hasFeaturedChances = chanceCount === 5;
  const brand = brandKey(media.brand);

  return el("article", {
    className: cardClass(plan),
    attrs: {
      "data-plan-card": "",
      "data-open-plan-card": plan.article,
      "data-article": plan.article,
      "data-category": plan.category,
      "data-brand": brand,
      "data-media-fit": media.fit || "",
      "data-has-media": media.hasImage ? "true" : "false",
      "data-subcategory": plan.subcategory || "",
      "data-search": plan.searchText,
      tabindex: "0",
      role: "button",
      "aria-haspopup": "dialog",
      "aria-label": `Abrir preinscripción para ${plan.displayName || "este plan"}`,
      style: mediaStyle(media),
    },
    children: [
      el("div", {
        className: "plan-list-card__media",
        children: [createMediaContent(plan, media)],
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
              el("span", {
                className: "button plan-list-card__action",
                text: "Preinscripción",
                attrs: { "aria-hidden": "true" },
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
      el("p", { text: "Probá cambiar la categoría, la búsqueda o la marca seleccionada." }),
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
