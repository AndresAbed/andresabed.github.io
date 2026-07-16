import {
  getAdjudicationColumns,
  getAdjudicationMonths,
  getAdjudicationYears,
  getFaqCategories,
  loadAdjudicationsForPeriod,
  loadFaq,
  normalizeInternalTarget,
  withSiteBasePath,
} from "../data/api.js?v=20260715-2";
import {
  createAdjudicationDrawSummary,
  createAdjudicationsTable,
  createFinalHelpCta,
  createMonthYearSelector,
  createSectionHeader,
} from "../components/info-components.js?v=20260715-2";
import { clear, el, qs } from "../utils/dom.js";
import { initScrollSpy } from "../utils/scroll-spy.js?v=20260715-1";

const GUIDE_ALERT_IMAGE = withSiteBasePath("/assets/img/how-it-works-alert.svg");
const GUIDE_STEP_IMAGES = [
  withSiteBasePath("/assets/img/how-it-works-step-plan.svg"),
  withSiteBasePath("/assets/img/how-it-works-step-valor-nominal.svg"),
  withSiteBasePath("/assets/img/how-it-works-step-cuotas.svg"),
  withSiteBasePath("/assets/img/how-it-works-step-sorteos.svg"),
];
const GUIDE_STEP_DIMENSIONS = [
  { width: 1168, height: 896 },
  { width: 1136, height: 928 },
  { width: 1168, height: 896 },
  { width: 1152, height: 912 },
];

function latestMonth(months = []) {
  return months.length ? Math.max(...months.map(Number)) : null;
}

function latestPublishedMonth(months = [], year) {
  const today = new Date();
  const isCurrentYear = Number(year) === today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const defaultMonth = isCurrentYear && currentMonth > 1 ? currentMonth - 1 : latestMonth(months);
  return months.includes(defaultMonth) ? defaultMonth : latestMonth(months);
}

function createSummaryIntro(text = "") {
  const highlight = "mientras el título esté vigente y al día";
  const [before, after] = String(text).split(highlight);

  if (after === undefined) {
    return el("p", { text });
  }

  return el("p", {
    children: [
      before ? document.createTextNode(before) : null,
      el("strong", { text: highlight }),
      after ? document.createTextNode(after) : null,
    ],
  });
}

function createGuideOverview(summary = {}) {
  return el("section", {
    className: "system-guide-panel system-guide-overview",
    attrs: { id: "plan-330", "aria-labelledby": "system-guide-overview-title" },
    children: [
      el("div", {
        className: "system-guide-overview__copy",
        children: [
          el("h2", { text: summary.title, attrs: { id: "system-guide-overview-title" } }),
          createSummaryIntro(summary.intro),
          el("dl", {
            className: "system-guide-reading-list",
            children: [
              el("div", {
                children: [
                  el("dt", { text: "Qué representa" }),
                  el("dd", { text: "Un título de capitalización y ahorro asociado a un valor nominal." }),
                ],
              }),
              el("div", {
                children: [
                  el("dt", { text: "Qué no es" }),
                  el("dd", { text: "No es un préstamo, una rifa, una compra en cuotas ni un sistema de licitación." }),
                ],
              }),
              el("div", {
                children: [
                  el("dt", { text: "Qué conviene revisar" }),
                  el("dd", { text: "Valor nominal, cuota, endosos, sorteo, rescate y documentación vigente." }),
                ],
              }),
            ],
          }),
        ],
      }),
      el("aside", {
        className: "system-guide-overview__aside",
        attrs: { "aria-label": "Resumen del Plan 330" },
        children: [
          el("span", { className: "system-guide-overview__label", text: "Plan" }),
          el("strong", { text: "330" }),
          el("p", { text: "Un título de capitalización y ahorro organizado en cuotas mensuales." }),
          el("div", {
            className: "system-guide-overview__facts",
            children: [
              el("div", { children: [el("span", { text: "Sistema" }), el("b", { text: "Capitalización y ahorro" })] }),
              el("div", { children: [el("span", { text: "Participación" }), el("b", { text: "Sorteo mensual al día" })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createMisconceptions(misconceptions = {}) {
  const adjudication = misconceptions.adjudication || {};

  return el("section", {
    className: "system-guide-section-block system-guide-misconceptions",
    attrs: { id: "que-es-y-que-no", "aria-labelledby": "system-guide-misconceptions-title" },
    children: [
      createSectionHeader({
        title: misconceptions.title || "Qué es y con qué no hay que confundirlo",
        intro: misconceptions.intro,
        id: "system-guide-misconceptions-title",
      }),
      el("div", {
        className: "system-guide-misconceptions__layout",
        children: [
          el("div", {
            className: "system-guide-misconceptions__list",
            children: (misconceptions.items || []).map((item, index) =>
              el("article", {
                className: "system-guide-misconception",
                children: [
                  el("span", {
                    className: "system-guide-misconception__index",
                    text: String(index + 1).padStart(2, "0"),
                    attrs: { "aria-hidden": "true" },
                  }),
                  el("div", {
                    children: [el("h3", { text: item.title }), el("p", { text: item.text })],
                  }),
                ],
              }),
            ),
          }),
          el("aside", {
            className: "system-guide-adjudication-callout",
            attrs: { "aria-labelledby": "system-guide-adjudication-title" },
            children: [
              el("span", { className: "system-guide-adjudication-callout__eyebrow", text: adjudication.eyebrow || "Si resultás adjudicado" }),
              el("h3", { text: adjudication.title || "Podés elegir cómo seguir", attrs: { id: "system-guide-adjudication-title" } }),
              el("p", { text: adjudication.body }),
              adjudication.note ? el("small", { text: adjudication.note }) : null,
            ],
          }),
        ],
      }),
    ],
  });
}

function createGuideJourney(steps = []) {
  return el("section", {
    className: "system-guide-section-block system-guide-journey",
    attrs: { id: "recorrido-paso-a-paso", "aria-labelledby": "system-guide-journey-title" },
    children: [
      createSectionHeader({
        title: "El recorrido, paso a paso",
        intro: "Descubrí el recorrido desde que elegís un plan hasta tu participación mensual.",
        id: "system-guide-journey-title",
      }),
      el("ol", {
        className: "system-guide-steps",
        children: steps.map((step, index) =>
          el("li", {
            className: "system-guide-step",
            children: [
              el("span", { className: "system-guide-step__number", text: String(index + 1).padStart(2, "0") }),
              GUIDE_STEP_IMAGES[index]
                ? el("img", {
                    className: "system-guide-step__image",
                    attrs: {
                      src: GUIDE_STEP_IMAGES[index],
                      alt: "",
                      width: String(GUIDE_STEP_DIMENSIONS[index].width),
                      height: String(GUIDE_STEP_DIMENSIONS[index].height),
                      loading: "lazy",
                      decoding: "async",
                      "aria-hidden": "true",
                    },
                  })
                : null,
              el("div", {
                className: "system-guide-step__copy",
                children: [el("h3", { text: step.title }), el("p", { text: step.body })],
              }),
            ],
          }),
        ),
      }),
    ],
  });
}

function createKeyConcepts(keyConcepts = {}) {
  return el("section", {
    className: "system-guide-section-block system-guide-concepts",
    attrs: { id: "puntos-clave", "aria-labelledby": "system-guide-concepts-title" },
    children: [
      createSectionHeader({
        title: keyConcepts.title,
        intro: keyConcepts.intro,
        id: "system-guide-concepts-title",
      }),
      el("div", {
        className: "system-concept-grid",
        children: (keyConcepts.items || []).map((item, index) =>
          el("article", {
            className: "system-concept",
            children: [
              el("span", { className: "system-concept__index", text: String(index + 1).padStart(2, "0"), attrs: { "aria-hidden": "true" } }),
              el("div", {
                children: [el("h3", { text: item.label }), el("p", { text: item.text })],
              }),
            ],
          }),
        ),
      }),
    ],
  });
}

function createImportantNotes(notes = {}) {
  return el("section", {
    className: "system-guide-section-block system-guide-notes",
    attrs: { id: "antes-de-avanzar", "aria-labelledby": "system-guide-notes-title" },
    children: [
      el("div", {
        className: "system-guide-notes__intro",
        children: [
          el("img", {
            className: "system-guide-notes__icon",
            attrs: {
              src: GUIDE_ALERT_IMAGE,
              alt: "",
              width: "501",
              height: "601",
              loading: "lazy",
              decoding: "async",
              "aria-hidden": "true",
            },
          }),
          el("span", { text: "Aclaraciones importantes" }),
          el("h2", { text: notes.title || "Aclaraciones importantes", attrs: { id: "system-guide-notes-title" } }),
          el("p", {
            text: "Puntos breves para distinguir lo que muestra el catálogo de lo que define el título y su documentación.",
          }),
        ],
      }),
      el("ol", {
        className: "system-guide-notes__body",
        children: (notes.items || []).map((item, index) =>
          el("li", {
            className: "system-guide-note",
            children: [
              el("span", { className: "system-guide-note__number", text: String(index + 1).padStart(2, "0"), attrs: { "aria-hidden": "true" } }),
              el("p", { text: item }),
            ],
          }),
        ),
      }),
    ],
  });
}

function createContractResource(contract = {}) {
  const path = normalizeInternalTarget(contract.path || "");
  return el("section", {
    className: "system-guide-section-block system-contract",
    attrs: { id: "contrato-plan-330", "aria-labelledby": "system-contract-title" },
    children: [
      el("div", {
        className: "system-contract__copy",
        children: [
          createSectionHeader({
            title: contract.title || "Contrato y condiciones",
            intro: contract.intro,
            id: "system-contract-title",
          }),
          el("div", {
            className: "system-contract__actions",
            children: [
              el("a", {
                className: "button button--primary",
                text: contract.openLabel || "Abrir PDF",
                attrs: { href: path, target: "_blank", rel: "noopener noreferrer" },
              }),
              el("a", {
                className: "button button--secondary",
                text: contract.downloadLabel || "Descargar contrato",
                attrs: { href: path, download: "" },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function flattenFaqItems(categories = []) {
  return categories.flatMap((category) =>
    (category.items || []).map((item) => ({
      ...item,
      categorySlug: category.slug,
      categoryTitle: category.title,
    })),
  );
}

const FAQ_CATEGORY_SUMMARIES = {
  "funcionamiento-general": "Qué es el sistema, cómo leer el plazo, el valor nominal y las condiciones generales.",
  "sorteos-y-adjudicacion": "Cómo se participa, qué pasa ante una adjudicación y qué condiciones deben cumplirse.",
  "cuotas-rescate-y-gestiones": "Cuotas, endosos, rescate y gestiones habituales del título.",
};

function createFaqDetails(item, { featured = false } = {}) {
  return el("details", {
    className: featured ? "system-guide-featured-question" : "system-guide-topic-question",
    children: [
      el("summary", {
        children: [
          featured ? el("span", { className: "system-guide-featured-question__topic", text: item.categoryTitle }) : null,
          el("span", { className: "system-guide-question-text", text: item.question }),
        ],
      }),
      el("p", { text: item.answer }),
    ],
  });
}

function createFeaturedFaqs(categories = [], featuredIds = []) {
  const itemsById = new Map(flattenFaqItems(categories).map((item) => [item.id, item]));
  const selected = featuredIds.map((id) => itemsById.get(id)).filter(Boolean);
  const items = selected.length ? selected : flattenFaqItems(categories).slice(0, 4);

  return el("section", {
    className: "system-guide-section-block system-guide-featured-faq",
    attrs: { id: "preguntas-clave", "aria-labelledby": "system-guide-featured-faq-title" },
    children: [
      el("div", {
        className: "system-guide-subsection-head",
        children: [
          el("span", { text: "Para ubicarse rápido" }),
          el("h3", { text: "Preguntas clave", attrs: { id: "system-guide-featured-faq-title" } }),
          el("p", { text: "Las dudas que conviene resolver primero antes de seguir leyendo el resto." }),
        ],
      }),
      el("div", { className: "system-guide-featured-faq__list", children: items.map((item) => createFaqDetails(item, { featured: true })) }),
    ],
  });
}

function createSystemFaq(categories, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const visibleCategories = categories
    .map((category) => ({
      ...category,
      items: (category.items || []).filter((item) => !excluded.has(item.id)),
    }))
    .filter((category) => category.items.length);

  return el("section", {
    className: "system-guide-section-block system-guide-faq",
    attrs: { "aria-labelledby": "system-guide-faq-title" },
    children: [
      el("div", {
        className: "system-guide-subsection-head",
        children: [
          el("span", { text: "Consulta por tema" }),
          el("h3", { text: "Más respuestas", attrs: { id: "system-guide-faq-title" } }),
          el("p", { text: "El resto de la información está agrupada para que puedas ir directo al tema que necesitás revisar." }),
        ],
      }),
      el("div", {
        className: "system-guide-faq__layout",
        children: [
          el("nav", {
            className: "system-guide-faq-topics",
            attrs: { "aria-label": "Temas de preguntas frecuentes" },
            children: visibleCategories.map((category) =>
              el("a", {
                attrs: { href: `#faq-${category.slug}` },
                children: [
                  el("span", { text: category.title }),
                  el("small", { text: `${category.items.length} respuestas` }),
                ],
              }),
            ),
          }),
          el("div", {
            className: "system-guide-faq__topics",
            children: visibleCategories.map((category) =>
              el("section", {
                className: "system-guide-faq-category",
                attrs: { id: `faq-${category.slug}`, "aria-labelledby": `faq-${category.slug}-title` },
                children: [
                  el("header", {
                    className: "system-guide-faq-category__head",
                    children: [
                      el("h4", { text: category.title, attrs: { id: `faq-${category.slug}-title` } }),
                      el("p", { text: FAQ_CATEGORY_SUMMARIES[category.slug] || "Respuestas agrupadas para consultar este tema." }),
                    ],
                  }),
                  el("div", {
                    className: "system-guide-topic-list",
                    children: category.items.map((item) => createFaqDetails(item)),
                  }),
                ],
              }),
            ),
          }),
        ],
      }),
    ],
  });
}

function createFaqZone(categories = [], featuredIds = []) {
  return el("section", {
    className: "system-guide-faq-zone",
    attrs: { id: "preguntas-frecuentes", "aria-labelledby": "system-guide-faq-zone-title" },
    children: [
      el("div", {
        className: "system-guide-faq-zone__head",
        children: [
          el("h2", { text: "Preguntas frecuentes", attrs: { id: "system-guide-faq-zone-title" } }),
          el("p", { text: "Una guía de consulta rápida para entender conceptos, sorteos, cuotas, rescate y gestiones del sistema." }),
        ],
      }),
      createFeaturedFaqs(categories, featuredIds),
      createSystemFaq(categories, featuredIds),
    ],
  });
}

async function renderAdjudicationSelection(target, selectedYear, selectedMonth) {
  const years = getAdjudicationYears();
  const year = selectedYear || years[0];
  const monthsByYear = Object.fromEntries(years.map((availableYear) => [String(availableYear), getAdjudicationMonths(availableYear).months || []]));
  const monthInfo = { months: monthsByYear[String(year)] || [] };
  const months = monthInfo.months || [];
  const month = selectedMonth || latestPublishedMonth(months, year);
  const adjudications = await loadAdjudicationsForPeriod(year, month);
  const rows = adjudications.rows || [];
  const columns = adjudications.columns || getAdjudicationColumns();

  const selector = createMonthYearSelector({
    years,
    selectedYear: year,
    months,
    selectedMonth: month,
    monthsByYear,
    onChange: (newYear, newMonth) => renderAdjudicationSelection(target, newYear, newMonth),
  });

  clear(target);
  target.append(
    el("div", {
      className: "adjudications-shell",
      children: [
        el("section", {
          className: "adjudications-control-panel",
          attrs: { "aria-labelledby": "adjudications-filter-title" },
          children: [
            el("div", {
              className: "adjudications-control-panel__head",
              children: [
                el("span", { className: "adjudications-kicker", text: "Consulta por periodo" }),
                el("h2", { id: "adjudications-filter-title", text: "Filtrar adjudicados" }),
                el("p", { text: "Seleccioná mes y año para consultar los resultados correspondientes." }),
              ],
            }),
            selector,
          ],
        }),
        createAdjudicationDrawSummary({ draw: adjudications.draw }),
        el("section", {
          className: "adjudications-results",
          attrs: { "aria-label": "Listado de adjudicados" },
          children: [
            createAdjudicationsTable({ columns, rows }),
            el("p", {
              className: "adjudications-note",
              text: "* Los prenombrados quedan sujetos a la reglamentación vigente.",
            }),
          ],
        }),
      ],
    }),
  );
}

export async function initAdjudicationsPage() {
  const target = qs("[data-adjudications-page]");
  if (!target) return;

  clear(target);

  await renderAdjudicationSelection(target);
}

function scrollToCurrentGuideSection() {
  const sectionId = window.location.hash.slice(1);
  if (!sectionId) return;

  const section = document.getElementById(decodeURIComponent(sectionId));
  if (!section) return;

  window.requestAnimationFrame(() => {
    section.scrollIntoView({ block: "start" });
  });
}

export async function initSystemGuidePage() {
  const target = qs("[data-system-guide-page]");
  if (!target) return;

  const faq = await loadFaq();
  const categories = getFaqCategories(faq);
  const guide = faq.guide || {};

  clear(target);
  target.append(
    createGuideOverview(guide.summary),
    createGuideJourney(guide.summary?.steps || []),
    createMisconceptions(guide.misconceptions),
    createKeyConcepts(guide.keyConcepts),
    createImportantNotes(guide.importantNotes),
    createContractResource(guide.contract),
    createFaqZone(categories, faq.featuredFaqIds || []),
  );

  const faqNavigation = target.querySelector(".system-guide-faq-topics");
  const faqTopics = target.querySelector(".system-guide-faq__topics");
  initScrollSpy({
    navigation: faqNavigation,
    sections: target.querySelectorAll(".system-guide-faq-category"),
    region: faqTopics,
  });

  scrollToCurrentGuideSection();
  window.addEventListener("hashchange", scrollToCurrentGuideSection);
}
