import { normalizeInternalTarget } from "../data/api.js";
import { classifyLinkItem } from "../data/validators.js";
import { el } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue, isMockStatus } from "../utils/validators.js";
import { createButton, createCallout, createMiniFact, createSectionHeader } from "./plan-components.js";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthName(month) {
  return MONTHS[Number(month) - 1] || `Mes ${month}`;
}

export function createDataStatusBanner({ title, body, state = UI_STATES.PARTIAL, action } = {}) {
  return el("article", {
    className: "data-status-banner",
    attrs: { "data-state": state },
    children: [
      el("div", {
        className: "stack",
        children: [
          el("span", { className: state === UI_STATES.READY ? "badge" : "badge badge--warning", text: state === UI_STATES.READY ? "Informacion disponible" : "Informacion en actualizacion" }),
          el("h3", { text: title }),
          el("p", { text: body }),
        ],
      }),
      action,
    ],
  });
}

export function createDrawSummary(draws) {
  const lastState = resolveValueState(draws?.lastDraw?.date, draws?.lastDraw?.status);
  const nextState = resolveValueState(draws?.nextDraw?.date, draws?.nextDraw?.status);
  const stimuli = [...(draws?.stimuli || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const renderableStimuli = stimuli.filter((item) => hasValue(item.winningNumber));

  return el("div", {
    className: "info-page-grid",
    children: [
      el("article", {
        className: "home-panel stack",
        children: [
          createSectionHeader({
            eyebrow: "Sorteo actual",
            title: "Estado disponible",
            intro: "Mostramos solo datos presentes y confiables del data pack.",
          }),
          el("div", {
            className: "facts-row",
            children: [
              createMiniFact({ label: "Ultimo sorteo", value: draws?.lastDraw?.date || FALLBACK_TEXT.updating, state: lastState }),
              createMiniFact({ label: "Proximo sorteo", value: draws?.nextDraw?.date || FALLBACK_TEXT.updating, state: nextState }),
            ],
          }),
        ],
      }),
      el("article", {
        className: "home-panel stack",
        children: [
          createSectionHeader({
            eyebrow: "Estimulos",
            title: "Numeros destacados",
            intro: renderableStimuli.length ? "Numeros cargados en el data pack." : "Los numeros se publicaran cuando esten validados.",
          }),
          renderableStimuli.length
            ? el("div", {
                className: "stimuli-grid",
                children: renderableStimuli.map((item) => createMiniFact({ label: item.label, value: item.winningNumber })),
              })
            : createDataStatusBanner({
                title: "Resultados pendientes de carga",
                body: "No hay numeros validados en el data pack. No se genera una tabla inventada.",
                state: UI_STATES.PARTIAL,
              }),
        ],
      }),
    ],
  });
}

export function createMonthYearSelector({ years, selectedYear, months, selectedMonth, monthsByYear = {}, onChange }) {
  const yearSelect = el("select", {
    attrs: { id: "adjudication-year", name: "year" },
    children: years.map((year) => el("option", { text: String(year), attrs: { value: year, selected: Number(year) === Number(selectedYear) } })),
  });

  const monthSelect = el("select", {
    attrs: { id: "adjudication-month", name: "month" },
  });

  function updateMonthOptions(year, preferredMonth) {
    const availableMonths = monthsByYear[String(year)] || months;
    const selected = availableMonths.includes(Number(preferredMonth)) ? Number(preferredMonth) : availableMonths[availableMonths.length - 1];

    monthSelect.replaceChildren(
      ...availableMonths.map((month) =>
        el("option", { text: monthName(month), attrs: { value: month, selected: Number(month) === Number(selected) } }),
      ),
    );
  }

  updateMonthOptions(selectedYear, selectedMonth);

  yearSelect.addEventListener("change", () => {
    updateMonthOptions(Number(yearSelect.value), monthSelect.value);
  });

  const form = el("form", {
    className: "filter-panel adjudications-filter",
    attrs: { "aria-label": "Seleccionar periodo de adjudicados" },
    children: [
      el("label", { children: [el("span", { text: "Mes" }), monthSelect] }),
      el("label", { children: [el("span", { text: "Año" }), yearSelect] }),
      el("button", {
        className: "button button--primary adjudications-filter__submit",
        text: "Filtrar",
        attrs: { type: "submit" },
      }),
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onChange(Number(yearSelect.value), Number(monthSelect.value));
  });

  return form;
}

export function createAdjudicationsTable({ columns, rows }) {
  if (!rows.length) {
    return el("div", {
      className: "table-shell adjudications-table adjudications-table--empty",
      children: [
        el("div", {
          className: "adjudications-empty",
          children: [
            el("h3", { text: "Sin adjudicados para este periodo" }),
            el("p", { text: "Probá con otro mes o año para revisar las publicaciones disponibles." }),
          ],
        }),
      ],
    });
  }

  return el("div", {
    className: "table-shell adjudications-table",
    children: [
      el("table", {
        children: [
          el("thead", {
            children: [el("tr", { children: columns.map((column) => el("th", { text: column.label })) })],
          }),
          el("tbody", {
            children: rows.map((row) =>
              el("tr", {
                children: columns.map((column) => el("td", { text: row[column.key] || FALLBACK_TEXT.confirm })),
              }),
            ),
          }),
        ],
      }),
    ],
  });
}

export function createResourceCard(item) {
  const state = classifyLinkItem(item);
  const ready = state === UI_STATES.READY;

  return el("article", {
    className: "resource-card",
    attrs: { "data-state": ready ? UI_STATES.READY : UI_STATES.PARTIAL },
    children: [
      el("div", {
        className: "stack",
        children: [
          el("span", { className: ready ? "badge" : "badge badge--warning", text: ready ? "Disponible" : FALLBACK_TEXT.updating }),
          el("h3", { text: item.title }),
          el("p", { text: item.description }),
          el("p", { className: "muted", text: `Tipo: ${item.type || "recurso"}` }),
        ],
      }),
      ready
        ? el("a", {
            className: "button button--secondary",
            text: "Abrir recurso",
            attrs: { href: normalizeInternalTarget(item.url), target: "_blank", rel: "noopener noreferrer" },
          })
        : el("span", { className: "badge badge--warning", text: "Link pendiente" }),
    ],
  });
}

export function createResourceGroup(group) {
  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": `resource-${group.slug}` },
    children: [
      createSectionHeader({
        eyebrow: "Recursos",
        title: group.title,
        id: `resource-${group.slug}`,
        intro: "Los accesos con URL validada se muestran como enlaces. Los pendientes quedan señalados sin romper la experiencia.",
      }),
      el("div", { className: "resource-grid resource-grid--wide", children: (group.items || []).map(createResourceCard) }),
    ],
  });
}

export function createFinalHelpCta({ title = "¿Seguís con dudas?", body, label = "Ver planes", href = "/planes/" } = {}) {
  return el("article", {
    className: "final-cta",
    children: [
      el("div", {
        className: "final-cta__copy",
        children: [
          el("span", { className: "badge", text: "Ayuda de agencia" }),
          el("h2", { text: title }),
          el("p", { text: body || "Te ayudamos a revisar la informacion y entender el proceso antes de avanzar." }),
        ],
      }),
      el("div", {
        className: "final-cta__actions",
        children: [createButton({ label, href, variant: "primary" })],
      }),
    ],
  });
}

export function safeRows(rows = []) {
  return rows.filter((row) => row && !isMockStatus(row.status));
}

export { createCallout, createSectionHeader };
