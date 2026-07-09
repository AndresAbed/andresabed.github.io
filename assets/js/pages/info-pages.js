import {
  getAdjudicationColumns,
  getAdjudicationMonths,
  getAdjudicationYears,
  getDrawStimuli,
  getFaqCategories,
  getFeaturedResources,
  getResourceById,
  getResourceGroups,
  loadAdjudicationsForPeriod,
  loadDraws,
  loadFaq,
  loadResources,
} from "../data/api.js";
import {
  createAdjudicationsTable,
  createDataStatusBanner,
  createDrawSummary,
  createFaqGroup,
  createFinalHelpCta,
  createMonthYearSelector,
  createResourceCard,
  createResourceGroup,
  createSectionHeader,
} from "../components/info-components.js";
import { createButton, createMiniFact } from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue } from "../utils/validators.js";

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

function createOfficialLink(resources, id, label) {
  const item = getResourceById(resources, id);
  return item?.url ? createButton({ label, href: item.url, variant: "secondary" }) : null;
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
          el("p", { text: summary.intro }),
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
                  el("dd", { text: "No es una compra directa ni una entrega automática por pagar cierta cantidad de cuotas." }),
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

function createGuideJourney(steps = []) {
  return el("section", {
    className: "system-guide-section-block system-guide-journey",
    attrs: { "aria-labelledby": "system-guide-journey-title" },
    children: [
      createSectionHeader({
        title: "El recorrido, paso a paso",
        intro: "Una forma simple de leer qué sucede desde que elegís un plan hasta la participación mensual.",
        id: "system-guide-journey-title",
      }),
      el("ol", {
        className: "system-guide-steps",
        children: steps.map((step, index) =>
          el("li", {
            className: "system-guide-step",
            children: [
              el("span", { className: "system-guide-step__number", text: String(index + 1).padStart(2, "0") }),
              el("div", {
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
  const path = contract.path || "";
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
      categoryTitle: category.title,
    })),
  );
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
          el("h3", { text: "Preguntas clave", attrs: { id: "system-guide-featured-faq-title" } }),
          el("p", { text: "Las respuestas más útiles para ubicarse rápido dentro del sistema." }),
        ],
      }),
      el("div", {
        className: "system-guide-featured-faq__grid",
        children: items.map((item) =>
          el("details", {
            className: "system-guide-featured-question",
            children: [
              el("summary", {
                children: [
                  el("span", { className: "system-guide-featured-question__topic", text: item.categoryTitle }),
                  el("strong", { text: item.question }),
                ],
              }),
              el("p", { text: item.answer }),
            ],
          }),
        ),
      }),
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
          el("h3", { text: "Respuestas por tema", attrs: { id: "system-guide-faq-title" } }),
          el("p", { text: "Cuotas, sorteos, endosos, rescate y gestiones, organizados para consultar por partes." }),
        ],
      }),
      ...visibleCategories.map((category) => createFaqGroup(category)),
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
          el("p", { text: "Respuestas puntuales sobre conceptos, sorteos, cuotas y documentación del sistema." }),
        ],
      }),
      createFeaturedFaqs(categories, featuredIds),
      createSystemFaq(categories, featuredIds),
    ],
  });
}

export async function initDrawsPage() {
  const target = qs("[data-draws-page]");
  if (!target) return;

  const [draws, resources] = await Promise.all([loadDraws(), loadResources()]);
  const stimuli = getDrawStimuli(draws);
  const hasNumbers = stimuli.some((item) => hasValue(item.winningNumber));

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Sorteos y resultados",
      title: "Segui los sorteos del sistema",
      intro: "Centralizamos regla de sorteo, fechas disponibles y accesos utiles para interpretar resultados.",
    }),
    createDrawSummary(draws),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "recent-draws-title" },
      children: [
        createSectionHeader({
          eyebrow: "Historial",
          title: "Resultados recientes",
          id: "recent-draws-title",
          intro: hasNumbers ? "Numeros cargados en el data pack." : "Todavia no hay historial validado para renderizar como tabla.",
        }),
        hasNumbers
          ? el("div", {
              className: "resource-grid",
              children: stimuli
                .filter((item) => hasValue(item.winningNumber))
                .map((item) => createMiniFact({ label: item.label, value: item.winningNumber })),
            })
          : createDataStatusBanner({
              title: "Historial en actualizacion",
              body: "Todavia no hay resultados recientes completos en la carga local. Cuando esten validados, se publican aca.",
              state: UI_STATES.PARTIAL,
              action: createOfficialLink(resources, "adjudicados-oficial", "Consultar fuente oficial"),
            }),
      ],
    }),
    createFinalHelpCta({
      title: "¿Necesitas interpretar un sorteo?",
      body: "Podemos ayudarte a revisar que significa un resultado y como se conecta con tu titulo, cuota y plan.",
    }),
  );
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
  const columns = getAdjudicationColumns();

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

export async function initResourcesPage() {
  const target = qs("[data-resources-page]");
  if (!target) return;

  const resources = await loadResources();
  const groups = getResourceGroups(resources);
  const featured = getFeaturedResources(resources);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Gestiones utiles",
      title: "Accesos para pagos, boletas e informacion oficial",
      intro: "Recursos para pagar, consultar boletas, revisar el sistema y acceder a informacion oficial.",
    }),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "featured-resources-title" },
      children: [
        createSectionHeader({
          eyebrow: "Prioritarios",
          title: "Recursos mas consultados",
          id: "featured-resources-title",
        }),
        el("div", { className: "resource-grid resource-grid--wide", children: featured.map(createResourceCard) }),
      ],
    }),
    ...groups.map(createResourceGroup),
    createFinalHelpCta({
      title: "¿No encontraste la gestion?",
      body: "Si no estas seguro de que recurso usar, la agencia puede orientarte.",
    }),
  );
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
    createKeyConcepts(guide.keyConcepts),
    createImportantNotes(guide.importantNotes),
    createContractResource(guide.contract),
    createFaqZone(categories, faq.featuredFaqIds || []),
  );
}
