import {
  getAdjudicationColumns,
  getAdjudicationMonths,
  getAdjudicationYears,
  getAdjudicationsFor,
  getDrawStimuli,
  getFaqCategories,
  getFeaturedResources,
  getResourceById,
  getResourceGroups,
  loadAdjudications,
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
  safeRows,
} from "../components/info-components.js";
import { createButton, createMiniFact } from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue, isMockStatus } from "../utils/validators.js";

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

function renderAdjudicationSelection(target, data, resources, selectedYear, selectedMonth) {
  const years = getAdjudicationYears(data);
  const year = selectedYear || years[0];
  const monthInfo = getAdjudicationMonths(data, year);
  const months = monthInfo.months || [];
  const month = selectedMonth || latestMonth(months);
  const allRows = getAdjudicationsFor(data, year, month);
  const rows = safeRows(allRows);
  const columns = getAdjudicationColumns(data);
  const localState = isMockStatus(data.meta?.status) || isMockStatus(monthInfo.status) ? UI_STATES.PARTIAL : UI_STATES.READY;

  const selector = createMonthYearSelector({
    years,
    selectedYear: year,
    months,
    selectedMonth: month,
    onChange: (newYear, newMonth) => renderAdjudicationSelection(target, data, resources, newYear, newMonth),
  });

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Consulta por periodo",
      title: "Selecciona año y mes",
      intro: "La estructura soporta consulta por periodo. Si la carga local es mock o parcial, no se muestra como historico real.",
    }),
    selector,
    createDataStatusBanner({
      title: localState === UI_STATES.READY ? "Datos locales disponibles" : "Carga local en validacion",
      body:
        localState === UI_STATES.READY
          ? "El periodo seleccionado tiene datos listos para mostrarse."
          : "El data pack actual incluye estructura y datos mock/parciales. Se evita publicarlos como oficiales.",
      state: localState,
      action: createOfficialLink(resources, "adjudicados-oficial", "Ver adjudicados oficiales"),
    }),
    createAdjudicationsTable({ columns, rows }),
  );
}

export async function initAdjudicationsPage() {
  const target = qs("[data-adjudications-page]");
  if (!target) return;

  const [adjudications, resources] = await Promise.all([loadAdjudications(), loadResources()]);
  clear(target);

  const selectorSlot = el("div", { className: "stack" });
  target.append(
    createSectionHeader({
      eyebrow: "Adjudicados",
      title: "Consulta publicaciones de adjudicados",
      intro: "La seccion queda preparada para historico local y prioriza fuente oficial cuando falta carga validada.",
    }),
    selectorSlot,
    createFinalHelpCta({
      title: "¿Tenes dudas sobre un adjudicado?",
      body: "Te orientamos para revisar la publicacion disponible y entender el siguiente paso.",
    }),
  );

  renderAdjudicationSelection(selectorSlot, adjudications, resources);
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
      eyebrow: "FAQ general",
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
