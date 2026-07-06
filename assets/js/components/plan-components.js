import { normalizeInternalTarget } from "../data/api.js";
import { el } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { isPendingStatus, isValidUrl } from "../utils/validators.js";

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

export function categoryHref(slug) {
  return `/planes/#${encodeURIComponent(slug)}`;
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

export function createMiniFact({ label, value, state = UI_STATES.READY }) {
  return el("div", {
    className: "mini-fact",
    attrs: { "data-state": state },
    children: [el("span", { text: label }), el("strong", { text: value })],
  });
}

export function formatField(field, formatter = (value) => value) {
  const state = resolveValueState(field?.value, field?.status);
  if (state !== UI_STATES.READY) return { value: field?.label || FALLBACK_TEXT.confirm, state };
  return { value: formatter(field.value), state };
}

export function formatMoneyARS(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return FALLBACK_TEXT.confirm;
  return `$${number.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
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
            el("span", {
              className: item.status === "pending_validation" ? "badge badge--warning" : "badge",
              text: item.status === "pending_validation" ? "A confirmar" : "Validado",
            }),
            el("p", { text: item.status === "pending_validation" ? `${item.text} (${FALLBACK_TEXT.confirm})` : item.text }),
          ],
        }),
      ),
  });
}

export function createSystemExplainer({ compact = false } = {}) {
  const steps = [
    {
      title: "1. Elegis una referencia",
      body: "Auto, moto o capital funcionan como orientacion comercial. Lo importante es revisar el Valor Nominal del Titulo y las condiciones.",
    },
    {
      title: "2. Pagas cuotas",
      body: "Las cuotas forman ahorro dentro del sistema. En planes 330, la cuota se calcula sobre el Valor Nominal segun la variante aplicable.",
    },
    {
      title: "3. Participas de sorteos",
      body: "Los sorteos son estimulos del sistema. Para recibir un beneficio, la cuota del mes debe estar al dia.",
    },
    {
      title: "4. Formas capital",
      body: "Al finalizar el plazo, el objeto es recibir el capital correspondiente al titulo suscripto, segun condiciones vigentes.",
    },
  ];

  return el("div", {
    className: compact ? "system-flow system-flow--compact" : "system-flow",
    children: steps.map((step) =>
      el("article", {
        className: "step-card",
        children: [el("h3", { text: step.title }), el("p", { text: step.body })],
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
      el("div", {
        className: "cluster",
        children: [
          createButton({ label: "Ver detalle", href: planRoute(plan.slug), variant: isFeatured ? "primary" : "secondary" }),
          createButton({ label: "Consultar", href: `/contacto/?intent=consulta&plan=${encodeURIComponent(plan.slug)}`, variant: "secondary" }),
        ],
      }),
    ],
  });
}

export function createPlanComparator(plans = []) {
  const rows = [
    {
      label: "Tipo",
      value: (plan) => plan.type === "dinero" ? "Capital / dinero" : plan.type || "Plan",
    },
    {
      label: "Objetivo",
      value: (plan) => planObjective(plan),
    },
    {
      label: "Finalidad",
      value: (plan) => planEndText(plan),
    },
    {
      label: "Plazo",
      value: (plan) => formatField(plan.termMonths, (value) => `${value} meses`).value,
      state: (plan) => formatField(plan.termMonths, (value) => `${value} meses`).state,
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
    return createCallout("Todavia no hay preguntas asociadas. Consultanos para revisar condiciones.", "warning");
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
  const href = `/contacto/?intent=consulta&plan=${encodeURIComponent(plan.slug)}`;
  return el("article", {
    className: "final-cta plan-cta",
    children: [
      el("div", {
        className: "final-cta__copy",
        children: [
          el("span", { className: "badge", text: "Consulta comercial" }),
          el("h2", { text: "Revisá esta opción con información clara" }),
          el("p", { text: "Consultá valor nominal, cuota, sorteos, rescate y documentacion antes de avanzar." }),
        ],
      }),
      el("div", {
        className: "final-cta__actions",
        children: [
          createButton({ label: cta?.label || "Consultar plan", href, variant: "primary" }),
          createButton({ label: "Ver catalogo", href: "/planes/", variant: "secondary" }),
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
