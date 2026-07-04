import { el } from "../../utils/dom.js";
import { hasValue, isValidUrl } from "../../utils/validators.js";
import { formatMoneyARS } from "../../components/plan-components.js";

const ARGENTINA_PROVINCES = [
  { value: "", label: "Seleccioná una provincia" },
  { value: "CABA", label: "CABA" },
  { value: "Buenos Aires", label: "Buenos Aires" },
  { value: "Catamarca", label: "Catamarca" },
  { value: "Chaco", label: "Chaco" },
  { value: "Chubut", label: "Chubut" },
  { value: "Córdoba", label: "Córdoba" },
  { value: "Corrientes", label: "Corrientes" },
  { value: "Entre Ríos", label: "Entre Ríos" },
  { value: "Formosa", label: "Formosa" },
  { value: "Jujuy", label: "Jujuy" },
  { value: "La Pampa", label: "La Pampa" },
  { value: "La Rioja", label: "La Rioja" },
  { value: "Mendoza", label: "Mendoza" },
  { value: "Misiones", label: "Misiones" },
  { value: "Neuquén", label: "Neuquén" },
  { value: "Río Negro", label: "Río Negro" },
  { value: "Salta", label: "Salta" },
  { value: "San Juan", label: "San Juan" },
  { value: "San Luis", label: "San Luis" },
  { value: "Santa Cruz", label: "Santa Cruz" },
  { value: "Santa Fe", label: "Santa Fe" },
  { value: "Santiago del Estero", label: "Santiago del Estero" },
  { value: "Tierra del Fuego", label: "Tierra del Fuego" },
  { value: "Tucumán", label: "Tucumán" },
];

const FORM_STATES = Object.freeze({
  IDLE: "idle",
  VALIDATING: "validating",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
  UNAVAILABLE: "unavailable",
});

function fieldId(plan, name) {
  return `plan-${plan.article}-${name}`;
}

function errorId(plan, name) {
  return `${fieldId(plan, name)}-error`;
}

function createField(plan, { name, label, type = "text", required = false, autocomplete = "" }) {
  return el("label", {
    attrs: { for: fieldId(plan, name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("input", {
        attrs: {
          id: fieldId(plan, name),
          name,
          type,
          required,
          autocomplete,
          "aria-describedby": errorId(plan, name),
        },
      }),
      el("small", { className: "field-error", attrs: { id: errorId(plan, name), "aria-live": "polite" } }),
    ],
  });
}

function createProvinceSelect(plan) {
  return el("label", {
    attrs: { for: fieldId(plan, "province") },
    children: [
      el("span", { text: "Provincia *" }),
      el("select", {
        attrs: {
          id: fieldId(plan, "province"),
          name: "province",
          required: true,
          "aria-describedby": errorId(plan, "province"),
        },
        children: ARGENTINA_PROVINCES.map((option) => el("option", { text: option.label, attrs: { value: option.value } })),
      }),
      el("small", { className: "field-error", attrs: { id: errorId(plan, "province"), "aria-live": "polite" } }),
    ],
  });
}

function clearFieldErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function showFieldErrors(form, plan, errors) {
  clearFieldErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    const error = form.querySelector(`#${errorId(plan, name)}`);
    if (field) field.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  });
}

function setFormState(form, state, message = "") {
  const status = form.querySelector("[data-plan-form-status]");
  const button = form.querySelector("button[type='submit']");
  if (status) {
    status.dataset.planFormStatus = state;
    status.textContent = message;
  }
  if (button) {
    button.dataset.state = state;
    button.disabled = state === FORM_STATES.SUBMITTING || state === FORM_STATES.VALIDATING;
    button.textContent =
      state === FORM_STATES.SUBMITTING
        ? "Enviando..."
        : state === FORM_STATES.SUCCESS
          ? "Consulta enviada"
          : "Quiero que me contacten";
  }
}

function normalizePayload(form, plan) {
  const formData = new FormData(form);
  return {
    source: "catalogo_planes",
    createdAt: new Date().toISOString(),
    fullName: String(formData.get("fullName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    province: String(formData.get("province") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    planArticle: String(plan.article || ""),
    planName: plan.displayName,
    planCategory: plan.categoryLabel,
    planSubcategory: plan.subcategoryLabel || "",
    planMonthlyFee: plan.monthlyFee ? formatMoneyARS(plan.monthlyFee) : "",
    planNominalValue: plan.nominalValue ? formatMoneyARS(plan.nominalValue) : "",
    planPrizeChances: plan.prizeChances ? String(plan.prizeChances) : "",
    pageUrl: window.location.href,
  };
}

function validatePayload(payload) {
  const errors = {};
  if (!hasValue(payload.fullName)) errors.fullName = "Ingresá tu nombre y apellido.";
  if (!hasValue(payload.phone)) errors.phone = "Ingresá un teléfono o WhatsApp.";
  if (!hasValue(payload.province)) errors.province = "Seleccioná tu provincia.";
  if (hasValue(payload.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresá un email válido o dejá el campo vacío.";
  }
  return errors;
}

async function sendPlanInquiry(config, payload) {
  const formConfig = config?.planInquiryForm || config?.form || {};
  if (!formConfig.enabled || !formConfig.endpoint || !isValidUrl(formConfig.endpoint)) {
    return { state: FORM_STATES.UNAVAILABLE };
  }

  const response = await fetch(formConfig.endpoint, {
    method: formConfig.method || "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Plan inquiry failed: ${response.status}`);
  return { state: FORM_STATES.SUCCESS };
}

export function createPlanInquiryForm(plan, contactConfig) {
  const form = el("form", {
    className: "plan-inquiry-form",
    attrs: { novalidate: true },
    children: [
      el("div", { className: "plan-form-status", attrs: { "data-plan-form-status": "", "aria-live": "polite" } }),
      el("div", {
        className: "plan-inquiry-form__grid",
        children: [
          createField(plan, { name: "fullName", label: "Nombre y apellido", required: true, autocomplete: "name" }),
          createField(plan, { name: "phone", label: "Teléfono / WhatsApp", required: true, autocomplete: "tel" }),
          createProvinceSelect(plan),
          createField(plan, { name: "city", label: "Localidad", autocomplete: "address-level2" }),
          createField(plan, { name: "email", label: "Email", type: "email", autocomplete: "email" }),
        ],
      }),
      el("label", {
        attrs: { for: fieldId(plan, "message") },
        children: [
          el("span", { text: "Comentario" }),
          el("textarea", {
            attrs: {
              id: fieldId(plan, "message"),
              name: "message",
              rows: "3",
              placeholder: "Contanos si querés revisar cuota, valor nominal o cómo avanzar.",
            },
          }),
        ],
      }),
      el("p", {
        className: "plan-inquiry-form__notice",
        text:
          "Con estos datos podremos brindarte asesoramiento personalizado sobre el plan elegido. Recordá que desde la primera cuota podés participar de los sorteos mensuales si el título se encuentra vigente y al día.",
      }),
      el("button", { className: "button button--primary", text: "Quiero que me contacten", attrs: { type: "submit" } }),
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = normalizePayload(form, plan);
    setFormState(form, FORM_STATES.VALIDATING, "Revisando datos...");
    const errors = validatePayload(payload);

    if (Object.keys(errors).length) {
      showFieldErrors(form, plan, errors);
      setFormState(form, FORM_STATES.ERROR, "Revisá los campos marcados.");
      return;
    }

    clearFieldErrors(form);
    setFormState(form, FORM_STATES.SUBMITTING, "Enviando consulta...");
    sendPlanInquiry(contactConfig, payload)
      .then((result) => {
        if (result.state === FORM_STATES.UNAVAILABLE) {
          setFormState(form, FORM_STATES.UNAVAILABLE, "El envío automático todavía no está configurado.");
          return;
        }
        form.reset();
        setFormState(form, FORM_STATES.SUCCESS, "Consulta enviada. Vamos a contactarte para continuar.");
      })
      .catch(() => {
        setFormState(form, FORM_STATES.ERROR, "No pudimos enviar la consulta. Intentá nuevamente.");
      });
  });

  return form;
}
