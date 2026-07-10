import { el } from "../../utils/dom.js";
import { normalizeInternalTarget } from "../../data/api.js";
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

const FORM_TYPES = Object.freeze({
  PREINQUIRY: "preinscripcion",
  ENROLLMENT: "inscripcion",
});

const ENABLE_ENROLLMENT_FORM = false;

const FORM_COPY = Object.freeze({
  [FORM_TYPES.PREINQUIRY]: {
    tab: "Preinscripción",
    title: "Preinscripción",
    description:
      "Completá tus datos y un asesor comercial te contactará para revisar la opción elegida, resolver tus dudas y orientarte con una propuesta acorde a lo que estás buscando.",
    source: "catalogo_planes_preinscripcion",
    submit: "Enviar",
    submitting: "Enviando...",
    success: "Consulta enviada",
    successMessage: "Consulta enviada. Vamos a contactarte para continuar.",
    unavailable: "El envío automático de preinscripción todavía no está configurado.",
  },
  [FORM_TYPES.ENROLLMENT]: {
    tab: "Inscripción",
    title: "Iniciá tu inscripción",
    description:
      "Usá este formulario cuando ya quieras avanzar con la inscripción del plan. Cargá los datos del titular para preparar la solicitud y revisar la información antes de continuar con la confirmación final.",
    source: "catalogo_planes_inscripcion",
    submit: "Enviar inscripción",
    submitting: "Enviando...",
    success: "Inscripción enviada",
    successMessage: "Solicitud de inscripción enviada. Vamos a revisar los datos para continuar.",
    unavailable: "La inscripción online todavía no está configurada.",
  },
});

function fieldId(plan, formType, name) {
  return `plan-${plan.article}-${formType}-${name}`;
}

function errorId(plan, formType, name) {
  return `${fieldId(plan, formType, name)}-error`;
}

function createField(plan, formType, { name, label, type = "text", required = false, autocomplete = "", attrs = {} }) {
  return el("label", {
    attrs: { for: fieldId(plan, formType, name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("input", {
        attrs: {
          id: fieldId(plan, formType, name),
          name,
          type,
          required,
          autocomplete,
          "aria-describedby": errorId(plan, formType, name),
          ...attrs,
        },
      }),
      el("small", { className: "field-error", attrs: { id: errorId(plan, formType, name), "aria-live": "polite" } }),
    ],
  });
}

function createProvinceSelect(plan, formType) {
  return el("label", {
    attrs: { for: fieldId(plan, formType, "province") },
    children: [
      el("span", { text: "Provincia *" }),
      el("select", {
        attrs: {
          id: fieldId(plan, formType, "province"),
          name: "province",
          required: true,
          "aria-describedby": errorId(plan, formType, "province"),
        },
        children: ARGENTINA_PROVINCES.map((option) => el("option", { text: option.label, attrs: { value: option.value } })),
      }),
      el("small", { className: "field-error", attrs: { id: errorId(plan, formType, "province"), "aria-live": "polite" } }),
    ],
  });
}

function clearFieldErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function showFieldErrors(form, plan, formType, errors) {
  clearFieldErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    const error = form.querySelector(`#${errorId(plan, formType, name)}`);
    if (field) field.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  });
}

function setFormState(form, state, message = "") {
  const status = form.querySelector("[data-plan-form-status]");
  const button = form.querySelector("button[type='submit']");
  const defaultText = button?.dataset.defaultText || "Enviar";
  const submittingText = button?.dataset.submittingText || "Enviando...";
  const successText = button?.dataset.successText || defaultText;
  if (status) {
    status.dataset.planFormStatus = state;
    status.textContent = message;
  }
  if (button) {
    button.dataset.state = state;
    button.disabled = state === FORM_STATES.SUBMITTING || state === FORM_STATES.VALIDATING;
    button.textContent =
      state === FORM_STATES.SUBMITTING
        ? submittingText
        : state === FORM_STATES.SUCCESS
          ? successText
          : defaultText;
  }
}

function normalizePayload(form, plan, formType) {
  const formData = new FormData(form);
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const soldBySeller = formData.get("soldBySeller") === "yes";
  const sellerSelect = form.querySelector("[data-seller-select]");
  const sellerOptionsAvailable = sellerSelect ? Array.from(sellerSelect.options).some((option) => option.value) : false;

  return {
    source: FORM_COPY[formType].source,
    formType,
    createdAt: new Date().toISOString(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    dni: String(formData.get("dni") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    province: String(formData.get("province") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    contactConsent: formData.get("contactConsent") === "yes",
    contactConsentText: CONTACT_CONSENT_TEXT,
    soldBySeller,
    sellerOptionsAvailable,
    sellerCode: soldBySeller ? String(formData.get("sellerCode") || "").trim() : "",
    planCode: String(plan.article || ""),
    interestedPlanName: plan.displayName,
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
  if (!hasValue(payload.firstName)) errors.firstName = "Ingresá tu nombre.";
  if (!hasValue(payload.lastName)) errors.lastName = "Ingresá tu apellido.";
  if (!hasValue(payload.dni)) errors.dni = "Ingresá tu DNI.";
  if (!hasValue(payload.address)) errors.address = "Ingresá tu dirección.";
  if (!hasValue(payload.phone)) errors.phone = "Ingresá un teléfono o WhatsApp.";
  if (!hasValue(payload.province)) errors.province = "Seleccioná tu provincia.";
  if (!hasValue(payload.city)) errors.city = "Ingresá tu localidad.";
  if (!hasValue(payload.email)) {
    errors.email = "Ingresá tu email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresá un email válido.";
  }
  if (!payload.contactConsent) {
    errors.contactConsent = "Necesitamos tu autorización para contactarte por este plan.";
  }
  if (
    payload.formType === FORM_TYPES.ENROLLMENT &&
    payload.soldBySeller &&
    payload.sellerOptionsAvailable &&
    !hasValue(payload.sellerCode)
  ) {
    errors.sellerCode = "Seleccioná el vendedor que realizó la venta.";
  }
  return errors;
}

function createContactConsent(plan, formType) {
  const checkboxId = fieldId(plan, formType, "contactConsent");

  return el("label", {
    className: "plan-inquiry-form__consent",
    attrs: { for: checkboxId },
    children: [
      el("input", {
        attrs: {
          id: checkboxId,
          type: "checkbox",
          name: "contactConsent",
          value: "yes",
          required: true,
          "aria-describedby": errorId(plan, formType, "contactConsent"),
        },
      }),
      el("span", {
        children: [
          "Acepto que me contacten para recibir asesoramiento sobre este plan y que mis datos sean tratados según la ",
          el("a", { text: "política de privacidad", attrs: { href: normalizeInternalTarget("/privacidad/") } }),
          ".",
        ],
      }),
      el("small", {
        className: "field-error",
        attrs: { id: errorId(plan, formType, "contactConsent"), "aria-live": "polite" },
      }),
    ],
  });
}

async function sendPlanInquiry(config, payload, formType) {
  const formConfig =
    formType === FORM_TYPES.ENROLLMENT
      ? config?.planEnrollmentForm || {}
      : config?.planInquiryForm || config?.form || {};
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

function getSellers(contactConfig) {
  const sellers = contactConfig?.salesTeam?.sellers;
  if (!Array.isArray(sellers)) return [];

  return sellers
    .map((seller) => ({
      name: String(seller.name || "").trim(),
      code: String(seller.code || "").trim(),
    }))
    .filter(
      (seller) =>
        seller.name &&
        seller.code &&
        seller.name.toLowerCase() !== "nombre vendedor" &&
        seller.code.toLowerCase() !== "codigo_interno",
    );
}

function createSellerControls(plan, formType, sellers) {
  const checkboxId = fieldId(plan, formType, "soldBySeller");
  const selectId = fieldId(plan, formType, "sellerCode");

  return el("div", {
    className: "plan-inquiry-form__seller",
    children: [
      el("label", {
        className: "plan-inquiry-form__seller-toggle",
        attrs: { for: checkboxId },
        children: [
          el("input", {
            attrs: {
              id: checkboxId,
              name: "soldBySeller",
              type: "checkbox",
              value: "yes",
              "data-seller-toggle": "",
            },
          }),
          el("span", { text: "La inscripción la está realizando un vendedor" }),
        ],
      }),
      el("label", {
        attrs: { for: selectId },
        children: [
          el("span", { text: "Vendedor" }),
          el("select", {
            attrs: {
              id: selectId,
              name: "sellerCode",
              disabled: true,
              "aria-describedby": errorId(plan, formType, "sellerCode"),
              "data-seller-select": "",
            },
            children: [
              el("option", { text: "Seleccioná un vendedor", attrs: { value: "" } }),
              ...sellers.map((seller) => el("option", { text: seller.name, attrs: { value: seller.code } })),
            ],
          }),
          el("small", { className: "field-error", attrs: { id: errorId(plan, formType, "sellerCode"), "aria-live": "polite" } }),
        ],
      }),
    ],
  });
}

function createPlanForm(plan, contactConfig, formType) {
  const copy = FORM_COPY[formType];
  const isEnrollment = formType === FORM_TYPES.ENROLLMENT;
  const sellers = getSellers(contactConfig);

  const form = el("form", {
    className: "plan-inquiry-form",
    attrs: {
      id: `plan-form-panel-${plan.article}-${formType}`,
      novalidate: true,
      role: "tabpanel",
      "data-plan-form": formType,
    },
    children: [
      el("div", { className: "plan-form-status", attrs: { "data-plan-form-status": "", "aria-live": "polite" } }),
      el("div", {
        className: "plan-inquiry-form__grid",
        children: [
          createField(plan, formType, { name: "firstName", label: "Nombre", required: true, autocomplete: "given-name" }),
          createField(plan, formType, { name: "lastName", label: "Apellido", required: true, autocomplete: "family-name" }),
          createField(plan, formType, { name: "dni", label: "DNI", required: true, attrs: { inputmode: "numeric" } }),
          createField(plan, formType, { name: "address", label: "Dirección", required: true, autocomplete: "street-address" }),
          createProvinceSelect(plan, formType),
          createField(plan, formType, { name: "city", label: "Localidad", required: true, autocomplete: "address-level2" }),
          createField(plan, formType, { name: "phone", label: "Teléfono / WhatsApp", required: true, autocomplete: "tel" }),
          createField(plan, formType, { name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
        ],
      }),
      isEnrollment && sellers.length ? createSellerControls(plan, formType, sellers) : null,
      !isEnrollment
        ? el("label", {
            attrs: { for: fieldId(plan, formType, "message") },
            children: [
              el("span", { text: "Comentarios" }),
              el("textarea", {
                attrs: {
                  id: fieldId(plan, formType, "message"),
                  name: "message",
                  rows: "3",
                  placeholder: "Contanos si querés revisar cuota, valor nominal o cómo avanzar.",
                },
              }),
            ],
          })
        : null,
      createContactConsent(plan, formType),
      el("p", {
        className: "plan-inquiry-form__notice",
        text:
          isEnrollment
            ? "Este formulario prepara la solicitud de inscripción del plan elegido. La lógica de pago y validación final se configurará en una etapa posterior."
            : "Esta preinscripción no finaliza la operación: nos permite preparar una consulta personalizada sobre el plan. Si el título está vigente y la cuota se encuentra al día, podés participar de los sorteos mensuales desde la primera cuota.",
      }),
      el("button", {
        className: "button button--primary",
        text: copy.submit,
        attrs: {
          type: "submit",
          "data-default-text": copy.submit,
          "data-submitting-text": copy.submitting,
          "data-success-text": copy.success,
        },
      }),
    ],
  });

  const sellerToggle = form.querySelector("[data-seller-toggle]");
  const sellerSelect = form.querySelector("[data-seller-select]");
  sellerToggle?.addEventListener("change", () => {
    const enabled = sellerToggle.checked;
    sellerSelect.disabled = !sellerToggle.checked;
    sellerSelect.required = enabled;
    if (!sellerToggle.checked) sellerSelect.value = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = normalizePayload(form, plan, formType);
    setFormState(form, FORM_STATES.VALIDATING, "Revisando datos...");
    const errors = validatePayload(payload);

    if (Object.keys(errors).length) {
      showFieldErrors(form, plan, formType, errors);
      setFormState(form, FORM_STATES.ERROR, "Revisá los campos marcados.");
      return;
    }

    clearFieldErrors(form);
    setFormState(form, FORM_STATES.SUBMITTING, "Enviando datos...");
    sendPlanInquiry(contactConfig, payload, formType)
      .then((result) => {
        if (result.state === FORM_STATES.UNAVAILABLE) {
          setFormState(form, FORM_STATES.UNAVAILABLE, copy.unavailable);
          return;
        }
        form.reset();
        sellerSelect?.setAttribute("disabled", "");
        sellerSelect.required = false;
        setFormState(form, FORM_STATES.SUCCESS, copy.successMessage);
      })
      .catch(() => {
        setFormState(form, FORM_STATES.ERROR, "No pudimos enviar los datos. Intentá nuevamente.");
      });
  });

  return form;
}

export function createPlanInquiryForm(plan, contactConfig) {
  const preForm = createPlanForm(plan, contactConfig, FORM_TYPES.PREINQUIRY);
  const enrollmentForm = createPlanForm(plan, contactConfig, FORM_TYPES.ENROLLMENT);
  const headingId = `plan-form-title-${plan.article}`;
  const descriptionId = `plan-form-description-${plan.article}`;
  const tabs = [
    { type: FORM_TYPES.PREINQUIRY, label: FORM_COPY[FORM_TYPES.PREINQUIRY].tab, panel: preForm },
    { type: FORM_TYPES.ENROLLMENT, label: FORM_COPY[FORM_TYPES.ENROLLMENT].tab, panel: enrollmentForm },
  ];

  enrollmentForm.hidden = true;
  preForm.setAttribute(
    "aria-labelledby",
    ENABLE_ENROLLMENT_FORM ? `plan-form-tab-${plan.article}-${FORM_TYPES.PREINQUIRY}` : headingId,
  );
  enrollmentForm.setAttribute("aria-labelledby", `plan-form-tab-${plan.article}-${FORM_TYPES.ENROLLMENT}`);

  const tabList = el("div", {
    className: "plan-form-tabs",
    attrs: { role: "tablist", "aria-label": "Tipo de formulario del plan" },
    children: tabs.map((tab, index) =>
      el("button", {
        className: index === 0 ? "plan-form-tab is-active" : "plan-form-tab",
        text: tab.label,
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": index === 0 ? "true" : "false",
          "aria-controls": `plan-form-panel-${plan.article}-${tab.type}`,
          id: `plan-form-tab-${plan.article}-${tab.type}`,
          "data-plan-form-tab": tab.type,
        },
      }),
    ),
  });

  const formHead = el("div", {
    className: "plan-detail-card__form-head",
    attrs: { "aria-live": "polite" },
    children: [
      el("h3", { text: FORM_COPY[FORM_TYPES.PREINQUIRY].title, attrs: { id: headingId } }),
      el("p", { text: FORM_COPY[FORM_TYPES.PREINQUIRY].description, attrs: { id: descriptionId } }),
    ],
  });

  const wrapper = el("div", {
    className: "plan-form-panel",
    children: ENABLE_ENROLLMENT_FORM ? [tabList, formHead, preForm, enrollmentForm] : [formHead, preForm, enrollmentForm],
  });

  if (ENABLE_ENROLLMENT_FORM) {
    tabList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-plan-form-tab]");
      if (!button) return;

      const activeType = button.dataset.planFormTab;
      const activeCopy = FORM_COPY[activeType];
      const title = formHead.querySelector("h3");
      const description = formHead.querySelector("p");
      if (title) title.textContent = activeCopy.title;
      if (description) description.textContent = activeCopy.description;

      tabs.forEach((tab) => {
        const isActive = tab.type === activeType;
        const tabButton = tabList.querySelector(`[data-plan-form-tab="${tab.type}"]`);
        tab.panel.hidden = !isActive;
        tab.panel.setAttribute("aria-labelledby", `plan-form-tab-${plan.article}-${tab.type}`);
        tabButton?.classList.toggle("is-active", isActive);
        tabButton?.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    });
  }

  return wrapper;
}
