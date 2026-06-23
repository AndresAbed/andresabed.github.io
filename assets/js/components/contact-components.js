import { el } from "../utils/dom.js";
import { hasValue, isValidUrl } from "../utils/validators.js";
import { createButton, createCallout, createSectionHeader, formatMoneyARS } from "./plan-components.js";

export const CONTACT_STATES = Object.freeze({
  IDLE: "idle",
  VALIDATING: "validating",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
  UNAVAILABLE: "unavailable",
});

const INTENT_OPTIONS = [
  { value: "consulta", label: "Quiero consultar un plan" },
  { value: "iniciar_solicitud", label: "Quiero iniciar una solicitud" },
];

const INQUIRY_OPTIONS = [
  { value: "informacion_general", label: "Información general" },
  { value: "iniciar_solicitud", label: "Quiero avanzar con una solicitud" },
  { value: "contactarme", label: "Ya elegí una opción" },
  { value: "otra", label: "Otra consulta" },
];

function fieldId(name) {
  return `lead-${name}`;
}

function errorId(name) {
  return `${fieldId(name)}-error`;
}

function createField({ name, label, type = "text", required = false, placeholder = "", autocomplete = "", value = "" }) {
  return el("label", {
    attrs: { for: fieldId(name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("input", {
        attrs: {
          id: fieldId(name),
          name,
          type,
          required,
          placeholder,
          autocomplete,
          value,
          "aria-describedby": errorId(name),
        },
      }),
      el("small", { className: "field-error", attrs: { id: errorId(name), "aria-live": "polite" } }),
    ],
  });
}

function createSelect({ name, label, options, required = false, selected = "" }) {
  return el("label", {
    attrs: { for: fieldId(name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("select", {
        attrs: { id: fieldId(name), name, required, "aria-describedby": errorId(name) },
        children: options.map((option) =>
          el("option", {
            text: option.label,
            attrs: { value: option.value, selected: option.value === selected },
          }),
        ),
      }),
      el("small", { className: "field-error", attrs: { id: errorId(name), "aria-live": "polite" } }),
    ],
  });
}

function createTextarea({ name, label, placeholder = "" }) {
  return el("label", {
    attrs: { for: fieldId(name) },
    children: [
      el("span", { text: label }),
      el("textarea", {
        attrs: {
          id: fieldId(name),
          name,
          rows: 5,
          placeholder,
          "aria-describedby": errorId(name),
        },
      }),
      el("small", { className: "field-error", attrs: { id: errorId(name), "aria-live": "polite" } }),
    ],
  });
}

export function createContactMethods(config) {
  const whatsapp = config?.channels?.whatsapp;
  const email = config?.channels?.email;
  const methods = [
    {
      title: "WhatsApp",
      body:
        whatsapp?.enabled && isValidUrl(whatsapp.url)
          ? `Canal principal para consultas directas${whatsapp.displayPhone ? `: ${whatsapp.displayPhone}` : "."}`
          : "Canal en configuracion.",
      enabled: whatsapp?.enabled && isValidUrl(whatsapp.url),
      badge: whatsapp?.enabled && isValidUrl(whatsapp.url) ? "Principal" : "En configuracion",
      action: whatsapp?.enabled && isValidUrl(whatsapp.url) ? createButton({ label: "Hablar por WhatsApp", href: whatsapp.url, variant: "primary" }) : null,
    },
    {
      title: "Formulario",
      body: "Dejá tus datos y el plan de interés para recibir atención comercial.",
      enabled: config?.form?.enabled,
      badge: config?.form?.enabled ? "Recomendado" : "En configuracion",
      action: null,
    },
    {
      title: "Email",
      body: email?.enabled && hasValue(email.address) ? email.address : "Email comercial pendiente de configuracion.",
      enabled: email?.enabled && hasValue(email.address),
      badge: email?.enabled && hasValue(email.address) ? "Disponible" : "Opcional",
      action: email?.enabled && hasValue(email.address) ? createButton({ label: "Enviar email", href: `mailto:${email.address}`, variant: "secondary" }) : null,
    },
  ];

  return el("div", {
    className: "contact-method-grid",
    children: methods.map((method) =>
      el("article", {
        className: "contact-method",
        attrs: { "data-state": method.enabled ? "ready" : "disabled" },
        children: [
          el("span", { className: method.enabled ? "badge badge--neutral" : "badge badge--warning", text: method.badge }),
          el("h3", { text: method.title }),
          el("p", { text: method.body }),
          method.action,
        ],
      }),
    ),
  });
}

export function createProcessSteps() {
  const steps = [
    ["1. Dejas tus datos", "Indicas si miras auto, moto, dinero o si todavia no estas seguro."],
    ["2. Revisamos el plan", "Tomamos como referencia el rubro, valor nominal y cuota vigente."],
    ["3. Te contactamos", "Un asesor comercial continúa la atención por el canal elegido."],
    ["4. Avanzás con respaldo", "La solicitud formal se completa con la documentación correspondiente."],
  ];

  return el("div", {
    className: "steps-grid steps-grid--four",
    children: steps.map(([title, body]) => el("article", { className: "step-card", children: [el("h3", { text: title }), el("p", { text: body })] })),
  });
}

function compactOptionLabel(value, maxLength = 34) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

export function createLeadForm({ plans, defaults, onSubmit }) {
  const planOptions = [
    { value: "no_estoy_seguro", label: "No estoy seguro" },
    ...plans.map((plan) => {
      const cuota = Number(plan.cuota?.value);
      const price = Number.isFinite(cuota) ? ` | ${formatMoneyARS(cuota)}` : "";
      const category = plan.category ? `${plan.category}: ` : "";
      return {
        value: plan.contactPreset || plan.slug,
        label: compactOptionLabel(`${category}${plan.displayName || plan.name}${price}`),
      };
    }),
  ];

  const form = el("form", {
    className: "lead-form",
    attrs: { novalidate: true },
    children: [
      el("div", { className: "form-status", attrs: { "data-form-status": "", "aria-live": "polite" } }),
      el("div", { className: "form-error-summary", attrs: { tabindex: "-1", "aria-live": "assertive" } }),
      el("fieldset", {
        children: [
          el("legend", { text: "Tipo de contacto" }),
          createSelect({ name: "intent", label: "Quiero", options: INTENT_OPTIONS, required: true, selected: defaults.intent }),
          createSelect({ name: "inquiryType", label: "Tipo de consulta", options: INQUIRY_OPTIONS, required: true, selected: defaults.inquiryType }),
        ],
      }),
      el("fieldset", {
        children: [
          el("legend", { text: "Datos de contacto" }),
          el("div", {
            className: "form-grid",
            children: [
              createField({ name: "fullName", label: "Nombre y apellido", required: true, autocomplete: "name", placeholder: "Ej. Andres Abed" }),
              createField({ name: "phone", label: "Telefono / WhatsApp", required: true, autocomplete: "tel", placeholder: "Ej. 11 1234 5678" }),
              createField({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email", placeholder: "nombre@email.com" }),
              createField({ name: "province", label: "Provincia", required: true, autocomplete: "address-level1", placeholder: "Ej. Cordoba" }),
              createField({ name: "city", label: "Ciudad", autocomplete: "address-level2", placeholder: "Ej. San Jorge" }),
            ],
          }),
        ],
      }),
      el("fieldset", {
        children: [
          el("legend", { text: "Interes comercial" }),
          createSelect({ name: "planInterest", label: "Opcion del catalogo", options: planOptions, required: true, selected: defaults.plan }),
          createTextarea({ name: "message", label: "Comentarios o dudas", placeholder: "Ej. Estoy entre auto y dinero, quiero saber cuota aproximada y cómo funcionan los sorteos." }),
          el("label", {
            className: "checkbox-field",
            children: [
              el("input", { attrs: { type: "checkbox", name: "readInfo", value: "yes" } }),
              el("span", { text: "Quiero recibir informacion antes de avanzar con una solicitud formal." }),
            ],
          }),
        ],
      }),
      createCallout("El formulario inicia una consulta comercial. La contratación formal se completa con documentación y condiciones vigentes.", "warning"),
      el("div", {
        className: "cluster",
        children: [
          el("button", { className: "button button--primary", text: "Enviar consulta", attrs: { type: "submit" } }),
          el("button", { className: "button button--secondary", text: "Limpiar datos", attrs: { type: "reset" } }),
        ],
      }),
    ],
  });

  form.addEventListener("submit", onSubmit);
  return form;
}

export function setFormState(form, state, message) {
  const status = form.querySelector("[data-form-status]");
  const button = form.querySelector("button[type='submit']");
  if (status) {
    status.dataset.formStatus = state;
    status.textContent = message || "";
  }
  if (button) {
    button.disabled = state === CONTACT_STATES.SUBMITTING || state === CONTACT_STATES.VALIDATING;
    button.textContent = state === CONTACT_STATES.SUBMITTING ? "Preparando envío..." : "Enviar consulta";
  }
}

export function clearFieldErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
  const summary = form.querySelector(".form-error-summary");
  if (summary) {
    summary.textContent = "";
    summary.hidden = true;
  }
}

export function showFieldErrors(form, errors) {
  clearFieldErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    const error = form.querySelector(`#${errorId(name)}`);
    if (field) field.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  });

  const summary = form.querySelector(".form-error-summary");
  if (summary) {
    const count = Object.keys(errors).length;
    summary.hidden = false;
    summary.textContent = `Revisá ${count} ${count === 1 ? "campo" : "campos"} antes de enviar.`;
    summary.focus();
  }
}

export function createPayloadSummary(payload) {
  return el("article", {
    className: "data-status-banner",
    attrs: { "data-state": "partial" },
    children: [
      el("div", {
        className: "stack",
        children: [
          el("span", { className: "badge badge--warning", text: "Modo fallback" }),
          el("h3", { text: "Consulta preparada" }),
          el("p", { text: "El envío automático está en configuración. Estos son los datos preparados para integrar con un endpoint real:" }),
          el("ul", {
            children: [
              el("li", { text: `Nombre: ${payload.fullName}` }),
              el("li", { text: `Contacto: ${payload.phone} / ${payload.email}` }),
              el("li", { text: `Plan: ${payload.planInterest}` }),
              el("li", { text: `Intencion: ${payload.intent}` }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function createContactHero() {
  return el("section", {
    className: "plans-hub-hero",
    children: [
      el("div", {
        className: "plans-hub-hero__copy",
        children: [
          el("span", { className: "badge", text: "Contacto comercial" }),
          el("h2", { text: "Consultá por tu plan" }),
          el("p", {
            className: "home-hero__lead",
            text: "Dejá tus datos o escribinos por WhatsApp para continuar la atención comercial de planes Club San Jorge.",
          }),
        ],
      }),
      el("aside", {
        className: "hero-panel",
        children: [
          el("h3", { text: "Qué pasa después" }),
          el("p", { text: "Un asesor comercial continúa la consulta y te indica los pasos de presuscripción correspondientes." }),
        ],
      }),
    ],
  });
}

export { createSectionHeader };
