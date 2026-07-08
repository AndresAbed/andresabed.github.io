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

const PRIORITY_FAQ_IDS = [
  "que-se-obtiene-al-final-del-plan-330",
  "como-se-realizan-los-sorteos-mensuales",
  "si-salgo-adjudicado-debo-seguir-pagando",
  "si-mi-numero-sale-otra-vez-que-pasa",
  "la-inscripcion-se-hace-online",
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

function createOfficialLink(resources, id, label) {
  const item = getResourceById(resources, id);
  return item?.url ? createButton({ label, href: item.url, variant: "secondary" }) : null;
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
        el("p", {
          className: "adjudications-note",
          text: "Los prenombrados deberán estar encuadrados dentro de la reglamentación vigente.",
        }),
        el("section", {
          className: "adjudications-results",
          attrs: { "aria-label": "Listado de adjudicados" },
          children: [createAdjudicationsTable({ columns, rows })],
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

export async function initFaqPage() {
  const target = qs("[data-faq-page]");
  if (!target) return;

  const faq = await loadFaq();
  const categories = getFaqCategories(faq);
  const priorityItems = PRIORITY_FAQ_IDS.map((id) => categories.flatMap((category) => category.items || []).find((item) => item.id === id)).filter(Boolean);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Preguntas frecuentes",
      title: "Respuestas claras para entender el sistema",
      intro: "Priorizamos capital, sorteos, adjudicacion, pagos y proceso comercial.",
    }),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "priority-faq-title" },
      children: [
        createSectionHeader({ eyebrow: "Prioritarias", title: "Leer antes de avanzar", id: "priority-faq-title" }),
        el("div", {
          className: "accordion-shell faq-home",
          children: priorityItems.map((item) =>
            el("details", {
              attrs: { open: true },
              children: [el("summary", { text: item.question }), el("p", { text: item.answer })],
            }),
          ),
        }),
      ],
    }),
    ...categories.map((category) => createFaqGroup(category, PRIORITY_FAQ_IDS)),
    createFinalHelpCta({
      title: "¿Tu duda no quedo resuelta?",
      body: "La agencia puede ayudarte a revisar categoria, opcion de catalogo y proximos pasos.",
    }),
  );
}
