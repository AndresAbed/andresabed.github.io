import { normalizeInternalTarget } from "../data/api.js";
import { el } from "../utils/dom.js";
import { valueOrConfirm } from "../utils/formatters.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue, isPendingStatus, isValidUrl } from "../utils/validators.js";

export const PLAN_ROUTES = Object.freeze({
  "auto-330": "/planes/auto-330/",
  "moto-330": "/planes/moto-330/",
  dinero: "/planes/dinero/",
});

const PLAN_OBJECTIVES = Object.freeze({
  auto: "Evaluar una alternativa de ahorro orientada al rubro automotor.",
  moto: "Evaluar una alternativa de ahorro orientada al rubro motos.",
  dinero: "Evaluar una alternativa centrada en formar capital / dinero.",
});

const AMORTIZATION_LABELS = Object.freeze({
  non_amortizing: "No amortizante",
  amortizing: "Amortizante",
});

export function planRoute(slug) {
  return PLAN_ROUTES[slug] || "/planes/";
}

export function createButton({ label, href, variant = "primary" }) {
  const target = normalizeInternalTarget(href);
  const enabled = isValidUrl(target);

  return el("a", {
    className: `button button--${enabled ? variant : "disabled"}`,
    text: label,
    attrs: enabled ? { href: target } : { href: "#", "aria-disabled": "true", title: FALLBACK_TEXT.unavailable },
  });
}

export function createSectionHeader({ eyebrow, title, intro, id }) {
  return el("div", {
    className: "section-header",
    children: [
      eyebrow ? el("span", { className: "badge", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

export function createCallout(text, tone = "default") {
  return el("div", {
    className: tone === "warning" ? "callout callout--warning" : "callout",
    children: [el("p", { text })],
  });
}

export function formatField(field, formatter = (value) => value) {
  const state = resolveValueState(field?.value, field?.status);
  if (state !== UI_STATES.READY) return { value: FALLBACK_TEXT.confirm, state };
  return { value: formatter(field.value), state };
}

export function formatRescue(rescue) {
  const state = resolveValueState(rescue?.canRequestFromInstallment, rescue?.status);
  if (state !== UI_STATES.READY) return { value: FALLBACK_TEXT.confirm, state };
  return { value: `Desde cuota ${rescue.canRequestFromInstallment}`, state };
}

export function planObjective(plan) {
  return PLAN_OBJECTIVES[plan?.type] || "Consultar condiciones del plan antes de avanzar.";
}

export function planEndText(plan) {
  const verified = (plan?.whatYouGetAtEnd || []).find((item) => item.status === "verified" && item.text);
  const any = (plan?.whatYouGetAtEnd || []).find((item) => item.text);
  if (verified) return verified.text;
  if (any && !isPendingStatus(any.status)) return any.text;
  return "Consultar condiciones del plan para confirmar que se obtiene al finalizar.";
}

export function createMiniFact({ label, value, state = UI_STATES.READY }) {
  return el("div", {
    className: "mini-fact",
    attrs: { "data-state": state },
    children: [el("span", { text: label }), el("strong", { text: value })],
  });
}

export function createInfoList(items = []) {
  return el("div", {
    className: "info-list",
    children: items
      .filter((item) => item?.text)
      .map((item) =>
        el("article", {
          className: "info-list__item",
          attrs: { "data-state": item.status === "pending_validation" ? UI_STATES.PARTIAL : UI_STATES.READY },
          children: [
            el("span", { className: item.status === "pending_validation" ? "badge badge--warning" : "badge", text: item.status === "pending_validation" ? "A confirmar" : "Verificado" }),
            el("p", { text: item.status === "pending_validation" ? `${item.text} (${FALLBACK_TEXT.confirm})` : item.text }),
          ],
        }),
      ),
  });
}

export function createPlanAccessCard(plan, featuredSlug) {
  const isFeatured = plan.slug === featuredSlug;
  return el("article", {
    className: `plan-card ${isFeatured ? "plan-card--featured" : ""}`,
    children: [
      el("div", {
        className: "plan-card__top",
        children: [
          el("span", { className: isFeatured ? "badge" : "badge badge--warning", text: isFeatured ? "Prioritario" : "Alternativa" }),
          el("h3", { text: plan.name }),
        ],
      }),
      el("p", { text: plan.summary }),
      el("p", { className: "muted", text: planObjective(plan) }),
      createCallout(planEndText(plan)),
      el("div", {
        className: "cluster",
        children: [
          createButton({ label: "Ver detalle", href: planRoute(plan.slug), variant: isFeatured ? "primary" : "secondary" }),
          createButton({ label: "Consultar", href: `/contacto/?intent=asesoramiento&plan=${encodeURIComponent(plan.slug)}`, variant: "secondary" }),
        ],
      }),
    ],
  });
}

export function createPlanComparator(plans = []) {
  const rows = [
    {
      label: "Tipo",
      value: (plan) => plan.type === "dinero" ? "Capital / dinero" : `${plan.type || "Plan"} 330`,
    },
    {
      label: "Objetivo",
      value: (plan) => planObjective(plan),
    },
    {
      label: "Que obtenes al final",
      value: (plan) => planEndText(plan),
    },
    {
      label: "Plazo",
      value: (plan) => formatField(plan.termMonths, (value) => `${value} meses`).value,
      state: (plan) => formatField(plan.termMonths, (value) => `${value} meses`).state,
    },
    {
      label: "Tipo de titulo",
      value: (plan) => formatField(plan.amortizationType, (value) => AMORTIZATION_LABELS[value] || valueOrConfirm(value)).value,
      state: (plan) => formatField(plan.amortizationType, (value) => AMORTIZATION_LABELS[value] || valueOrConfirm(value)).state,
    },
    {
      label: "Consultar antes",
      value: () => "Documentacion, rescate, sorteos y continuidad del plan.",
    },
  ];

  return el("div", {
    className: "plan-comparator",
    children: plans.map((plan) =>
      el("article", {
        className: plan.featured ? "compare-card compare-card--featured" : "compare-card",
        children: [
          el("span", { className: plan.featured ? "badge" : "badge badge--warning", text: plan.shortLabel || plan.name }),
          el("h3", { text: plan.name }),
          ...rows.map((row) =>
            el("div", {
              className: "compare-row",
              attrs: { "data-state": row.state ? row.state(plan) : UI_STATES.READY },
              children: [el("span", { text: row.label }), el("strong", { text: row.value(plan) })],
            }),
          ),
        ],
      }),
    ),
  });
}

export function createFaqBlock(faqs = []) {
  if (!faqs.length) {
    return createCallout("Todavia no hay preguntas asociadas a este plan. Consultanos para revisar las condiciones.", "warning");
  }

  return el("div", {
    className: "accordion-shell plan-faq",
    children: faqs.map((item) =>
      el("details", {
        children: [el("summary", { text: item.question }), el("p", { text: item.answer })],
      }),
    ),
  });
}

export function createPlanCta(site, plan) {
  const cta = site?.cta?.primary;
  const href = `/contacto/?intent=asesoramiento&plan=${encodeURIComponent(plan.slug)}`;
  return el("article", {
    className: "final-cta plan-cta",
    children: [
      el("div", {
        className: "final-cta__copy",
        children: [
          el("span", { className: "badge", text: "Consulta asistida" }),
          el("h2", { text: "Antes de avanzar, revisemos si este plan aplica a tu objetivo" }),
          el("p", { text: "La idea es que entiendas condiciones, capital final, sorteos y decisiones posibles antes de iniciar una solicitud." }),
        ],
      }),
      el("div", {
        className: "final-cta__actions",
        children: [
          createButton({ label: cta?.label || "Quiero asesoramiento", href, variant: "primary" }),
          createButton({ label: "Comparar planes", href: "/planes/", variant: "secondary" }),
        ],
      }),
    ],
  });
}

export function createPlanFacts(plan) {
  const term = formatField(plan.termMonths, (value) => `${value} meses`);
  const amortization = formatField(plan.amortizationType, (value) => AMORTIZATION_LABELS[value] || value);
  const rescue = formatRescue(plan.rescue);

  return el("div", {
    className: "facts-row plan-facts",
    children: [
      createMiniFact({ label: "Orientacion", value: plan.type === "dinero" ? "Capital / dinero" : plan.type, state: UI_STATES.READY }),
      createMiniFact({ label: "Plazo", value: term.value, state: term.state }),
      createMiniFact({ label: "Titulo", value: amortization.value, state: amortization.state }),
      createMiniFact({ label: "Rescate", value: rescue.value, state: rescue.state }),
    ],
  });
}
