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
  createCallout,
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
      title: "Informacion disponible sin completar datos pendientes",
      intro: "Esta pagina centraliza lo que esta cargado en el data pack y aclara cuando los resultados estan en actualizacion.",
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
              body: "El data pack no trae resultados recientes completos. Por eso no se fuerza una tabla inventada.",
              state: UI_STATES.PARTIAL,
              action: createOfficialLink(resources, "adjudicados-oficial", "Consultar fuente oficial"),
            }),
      ],
    }),
    createCallout(
      "Consultar un resultado no reemplaza revisar condiciones del plan. Si tenes dudas sobre adjudicacion, continuidad o pago de cuotas, conviene consultar antes de tomar decisiones.",
      "warning",
    ),
    createFinalHelpCta({
      title: "¿Necesitas interpretar un sorteo?",
      body: "Podemos ayudarte a revisar que significa un resultado y que informacion conviene confirmar.",
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
      title: "Consulta por año y mes",
      intro: "Usamos la estructura del data pack sin inventar historicos. Los datos mock quedan ocultos como resultados reales.",
    }),
    selectorSlot,
    createCallout(
      "Esta seccion ayuda a consultar publicaciones disponibles. Ante una duda sobre un caso puntual, revisa la fuente oficial o consultanos con los datos del titulo.",
      "warning",
    ),
    createFinalHelpCta({
      title: "¿Tenes dudas sobre un adjudicado?",
      body: "Te orientamos para revisar la informacion disponible y contrastarla con documentacion oficial.",
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
      intro: "Priorizamos recursos verificados y marcamos los enlaces pendientes para no generar caminos rotos.",
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
      body: "Si falta un link o no estas seguro de que recurso usar, consultanos antes de avanzar.",
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
      title: "Primero, las dudas mas sensibles",
      intro: "Priorizamos las respuestas que evitan malentendidos sobre capital, sorteos, adjudicacion y solicitud asistida.",
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
      body: "La agencia puede ayudarte a revisar el plan, la documentacion y los proximos pasos sin apurarte a contratar.",
    }),
  );
}
