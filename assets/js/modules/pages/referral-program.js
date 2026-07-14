import { loadReferralProgram, normalizeInternalTarget } from "../data/api.js";
import { ARGENTINA_PROVINCES } from "../utils/argentina.js";
import { clear, el, qs } from "../utils/dom.js";
import { downloadReferralReceiptPdf } from "../utils/referral-receipt-pdf.js?v=20260714-23";
import { hasValue, isValidUrl } from "../utils/validators.js";

const FORM_STATES = Object.freeze({
  IDLE: "idle",
  VALIDATING: "validating",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
  UNAVAILABLE: "unavailable",
});

const PARTICIPATION_NUMBER_PATTERN = /^RYG-\d{6,}$/;
const DEFAULT_RELATIONSHIP_OPTIONS = [
  "Familiar",
  "Amigo/a",
  "Compañero/a de trabajo o estudio",
  "Vecino/a",
  "Conocido/a",
  "Cliente/a",
  "Otro vínculo",
];
let referralSequence = 0;

const REGISTRATION_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function setRegistrationDate(panel, date) {
  const dateElement = panel.querySelector("[data-registration-date]");
  if (!dateElement) return;

  const label = dateElement.dataset.label || "Fecha de registro";
  dateElement.dateTime = date.toISOString();
  dateElement.textContent = `${label}: ${REGISTRATION_DATE_FORMATTER.format(date)}`;
}

function fieldErrorId(fieldId) {
  return `${fieldId}-error`;
}

function createTextField({ id, name, label, type = "text", required = false, autocomplete = "", inputmode = "", maxlength = "", help = "", attrs = {} }) {
  const describedBy = [help ? `${id}-help` : "", fieldErrorId(id)].filter(Boolean).join(" ");

  return el("label", {
    className: "referral-field",
    attrs: { for: id },
    children: [
      el("span", {
        className: "referral-field__label",
        children: [document.createTextNode(label), required ? el("span", { text: " *", attrs: { "aria-hidden": "true" } }) : null],
      }),
      el("input", {
        attrs: {
          id,
          name,
          type,
          required,
          autocomplete,
          inputmode,
          maxlength,
          "aria-describedby": describedBy,
          ...attrs,
        },
      }),
      help ? el("small", { className: "referral-field__help", text: help, attrs: { id: `${id}-help` } }) : null,
      el("small", { className: "field-error", attrs: { id: fieldErrorId(id), "aria-live": "polite" } }),
    ],
  });
}

function createProvinceField({ id, name, label = "Provincia", required = true, dataField = "" }) {
  return el("label", {
    className: "referral-field",
    attrs: { for: id },
    children: [
      el("span", {
        className: "referral-field__label",
        children: [document.createTextNode(label), required ? el("span", { text: " *", attrs: { "aria-hidden": "true" } }) : null],
      }),
      el("select", {
        attrs: {
          id,
          name,
          required,
          autocomplete: "address-level1",
          "aria-describedby": fieldErrorId(id),
          "data-referral-field": dataField || null,
        },
        children: ARGENTINA_PROVINCES.map((option) => el("option", { text: option.label, attrs: { value: option.value } })),
      }),
      el("small", { className: "field-error", attrs: { id: fieldErrorId(id), "aria-live": "polite" } }),
    ],
  });
}

function createRelationshipField({ id, name, options = DEFAULT_RELATIONSHIP_OPTIONS }) {
  const relationshipOptions = Array.isArray(options) && options.length ? options : DEFAULT_RELATIONSHIP_OPTIONS;

  return el("label", {
    className: "referral-field",
    attrs: { for: id },
    children: [
      el("span", {
        className: "referral-field__label",
        children: [document.createTextNode("Vínculo"), el("span", { text: " *", attrs: { "aria-hidden": "true" } })],
      }),
      el("select", {
        attrs: {
          id,
          name,
          required: true,
          autocomplete: "off",
          "aria-describedby": fieldErrorId(id),
          "data-referral-field": "vinculo",
        },
        children: [
          el("option", { text: "Seleccioná una opción", attrs: { value: "" } }),
          ...relationshipOptions.map((option) => el("option", { text: option, attrs: { value: option } })),
        ],
      }),
      el("small", { className: "field-error", attrs: { id: fieldErrorId(id), "aria-live": "polite" } }),
    ],
  });
}

function normalizeSellerOptions(options) {
  if (!Array.isArray(options)) return [];

  return options.map((option) => {
    if (typeof option === "string") {
      const value = option.trim();
      return { value, label: value };
    }

    const value = String(option?.value || option?.code || "").trim();
    const label = String(option?.label || option?.name || value).trim();
    return { value, label };
  }).filter((option) => option.value && option.label);
}

function createSellerField({ options, help = "" }) {
  const sellerOptions = normalizeSellerOptions(options);
  const helpText = sellerOptions.length ? help : "";
  const describedBy = [helpText ? "referral-seller-code-help" : "", fieldErrorId("referral-seller-code")].filter(Boolean).join(" ");

  return el("label", {
    className: "referral-field",
    attrs: { for: "referral-seller-code" },
    children: [
      el("span", { className: "referral-field__label", text: "Código de vendedor" }),
      el("select", {
        attrs: {
          id: "referral-seller-code",
          name: "sellerCode",
          "aria-describedby": describedBy,
        },
        children: [
          el("option", { text: sellerOptions.length ? "Seleccioná una opción" : "", attrs: { value: "" } }),
          ...sellerOptions.map((option) => el("option", { text: option.label, attrs: { value: option.value } })),
        ],
      }),
      helpText ? el("small", { className: "referral-field__help", text: helpText, attrs: { id: "referral-seller-code-help" } }) : null,
      el("small", { className: "field-error", attrs: { id: fieldErrorId("referral-seller-code"), "aria-live": "polite" } }),
    ],
  });
}

function createReferralFieldset(formContent) {
  referralSequence += 1;
  const key = referralSequence;
  const fieldset = el("fieldset", {
    className: "referral-person",
    attrs: { "data-referral": "", "data-referral-key": key },
    children: [
      el("legend", { text: "Referido" }),
      el("button", {
        className: "referral-person__remove",
        text: formContent.removeReferralLabel || "Quitar",
        attrs: { type: "button", "data-remove-referral": "", "aria-label": "Quitar este referido" },
      }),
      el("div", {
        className: "referral-person__grid",
        children: [
          createTextField({
            id: `referral-${key}-name`,
            name: `referralName-${key}`,
            label: "Nombre",
            required: true,
            autocomplete: "off",
            maxlength: "80",
            attrs: { "data-referral-field": "nombre" },
          }),
          createTextField({
            id: `referral-${key}-last-name`,
            name: `referralLastName-${key}`,
            label: "Apellido",
            required: true,
            autocomplete: "off",
            maxlength: "80",
            attrs: { "data-referral-field": "apellido" },
          }),
          createTextField({
            id: `referral-${key}-phone`,
            name: `referralPhone-${key}`,
            label: "Teléfono",
            type: "tel",
            required: true,
            autocomplete: "off",
            inputmode: "tel",
            maxlength: "30",
            attrs: { "data-referral-field": "telefono" },
          }),
          createRelationshipField({
            id: `referral-${key}-relationship`,
            name: `referralRelationship-${key}`,
            options: formContent.relationshipOptions,
          }),
          createTextField({
            id: `referral-${key}-city`,
            name: `referralCity-${key}`,
            label: "Ciudad",
            required: true,
            autocomplete: "off",
            maxlength: "80",
            attrs: { "data-referral-field": "ciudad" },
          }),
          createProvinceField({
            id: `referral-${key}-province`,
            name: `referralProvince-${key}`,
            dataField: "provincia",
          }),
        ],
      }),
    ],
  });

  return fieldset;
}

function phoneIsValid(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  return /^[+\d\s()\-.]+$/.test(raw) && digits.length >= 8 && digits.length <= 15;
}

function dniIsValid(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  return /^[\d.\s]+$/.test(raw) && digits.length >= 7 && digits.length <= 9;
}

function emailIsValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function clearFieldError(field) {
  if (!field) return;
  field.removeAttribute("aria-invalid");
  const error = document.getElementById(fieldErrorId(field.id));
  if (error) error.textContent = "";
}

function setFieldError(field, message) {
  if (!field) return;
  field.setAttribute("aria-invalid", "true");
  const error = document.getElementById(fieldErrorId(field.id));
  if (error) error.textContent = message;
}

function clearAllErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => clearFieldError(field));
}

function normalizePayload(form, formContent) {
  const formData = new FormData(form);
  const referidos = [...form.querySelectorAll("[data-referral]")].map((block) => ({
    nombre: String(block.querySelector("[data-referral-field='nombre']")?.value || "").trim(),
    apellido: String(block.querySelector("[data-referral-field='apellido']")?.value || "").trim(),
    telefono: String(block.querySelector("[data-referral-field='telefono']")?.value || "").trim(),
    vinculo: String(block.querySelector("[data-referral-field='vinculo']")?.value || "").trim(),
    ciudad: String(block.querySelector("[data-referral-field='ciudad']")?.value || "").trim(),
    provincia: String(block.querySelector("[data-referral-field='provincia']")?.value || "").trim(),
  }));

  return {
    source: "recomenda_y_gana_web",
    formType: "referral_program",
    createdAt: new Date().toISOString(),
    participante: {
      nombre: String(formData.get("participantName") || "").trim(),
      apellido: String(formData.get("participantLastName") || "").trim(),
      dni: String(formData.get("participantDni") || "").trim(),
      telefono: String(formData.get("participantPhone") || "").trim(),
      email: String(formData.get("participantEmail") || "").trim().toLowerCase(),
      codigoVendedor: String(formData.get("sellerCode") || "").trim(),
    },
    referidos,
    consentimiento: formData.get("consent") === "yes",
    textoConsentimiento: formContent.consentText || "",
    pagina: window.location.href,
    website: String(formData.get("website") || ""),
  };
}

function validatePayload(form, payload) {
  const errors = [];
  const participantFields = {
    nombre: form.elements.participantName,
    apellido: form.elements.participantLastName,
    dni: form.elements.participantDni,
    telefono: form.elements.participantPhone,
    email: form.elements.participantEmail,
  };

  if (!hasValue(payload.participante.nombre)) errors.push([participantFields.nombre, "Ingresá tu nombre."]);
  if (!hasValue(payload.participante.apellido)) errors.push([participantFields.apellido, "Ingresá tu apellido."]);
  if (!hasValue(payload.participante.dni)) {
    errors.push([participantFields.dni, "Ingresá tu DNI."]);
  } else if (!dniIsValid(payload.participante.dni)) {
    errors.push([participantFields.dni, "Ingresá un DNI válido, sin letras."]);
  }
  if (!hasValue(payload.participante.telefono)) {
    errors.push([participantFields.telefono, "Ingresá tu teléfono."]);
  } else if (!phoneIsValid(payload.participante.telefono)) {
    errors.push([participantFields.telefono, "Ingresá un teléfono válido con código de área."]);
  }
  if (!hasValue(payload.participante.email)) {
    errors.push([participantFields.email, "Ingresá tu email."]);
  } else if (!emailIsValid(payload.participante.email)) {
    errors.push([participantFields.email, "Ingresá un email válido."]);
  }

  const blocks = [...form.querySelectorAll("[data-referral]")];
  if (!blocks.length) {
    errors.push([form.querySelector("[data-add-referral]"), "Agregá al menos un referido."]);
  }

  blocks.forEach((block, index) => {
    const referral = payload.referidos[index];
    const fields = {
      nombre: block.querySelector("[data-referral-field='nombre']"),
      apellido: block.querySelector("[data-referral-field='apellido']"),
      telefono: block.querySelector("[data-referral-field='telefono']"),
      vinculo: block.querySelector("[data-referral-field='vinculo']"),
      ciudad: block.querySelector("[data-referral-field='ciudad']"),
      provincia: block.querySelector("[data-referral-field='provincia']"),
    };
    if (!hasValue(referral.nombre)) errors.push([fields.nombre, "Ingresá el nombre de la persona."]);
    if (!hasValue(referral.apellido)) errors.push([fields.apellido, "Ingresá el apellido de la persona."]);
    if (!hasValue(referral.telefono)) {
      errors.push([fields.telefono, "Ingresá su teléfono."]);
    } else if (!phoneIsValid(referral.telefono)) {
      errors.push([fields.telefono, "Ingresá un teléfono válido con código de área."]);
    }
    if (!hasValue(referral.vinculo)) errors.push([fields.vinculo, "Seleccioná qué vínculo tenés con la persona."]);
    if (!hasValue(referral.ciudad)) errors.push([fields.ciudad, "Ingresá su ciudad."]);
    if (!hasValue(referral.provincia)) errors.push([fields.provincia, "Seleccioná su provincia."]);
  });

  if (!payload.consentimiento) {
    errors.push([form.elements.consent, "Necesitamos tu autorización para registrar la participación."]);
  }

  return errors;
}

function payloadToSearchParams(payload, config) {
  const params = new URLSearchParams();
  params.set("form", config.formType || payload.formType);
  params.set("formType", payload.formType);
  params.set("source", payload.source);
  params.set("createdAt", payload.createdAt);
  params.set("participante", JSON.stringify(payload.participante));
  params.set("referidos", JSON.stringify(payload.referidos));
  params.set("consentimiento", payload.consentimiento ? "true" : "");
  params.set("textoConsentimiento", payload.textoConsentimiento);
  params.set("pagina", payload.pagina);
  params.set("website", payload.website);
  return params;
}

async function sendReferralProgram(config, payload) {
  const response = await fetch(config.endpoint, {
    method: config.method || "POST",
    headers: { Accept: "application/json" },
    body: payloadToSearchParams(payload, config),
  });

  if (!response.ok) throw new Error(`Referral endpoint failed: ${response.status}`);
  const result = await response.json();
  const participationNumber = String(result.numeroParticipacion || result.numero || result.participationNumber || "").trim();

  if (result.ok !== true || !PARTICIPATION_NUMBER_PATTERN.test(participationNumber)) {
    throw new Error("Referral endpoint returned an invalid response");
  }

  return participationNumber;
}

function createSuccessPanel(successContent) {
  const panel = el("section", {
    className: "referral-success",
    attrs: { hidden: true, tabindex: "-1", "data-referral-success": "", "aria-labelledby": "referral-success-title" },
    children: [
      el("div", { className: "referral-success__mark", attrs: { "aria-hidden": "true" } }),
      el("p", { className: "referral-success__label", text: successContent.label || "Participación registrada" }),
      el("h2", { attrs: { id: "referral-success-title" }, text: successContent.title || "¡Gracias por participar!" }),
      el("p", { className: "referral-success__body", text: successContent.body || "Tu participación fue registrada correctamente." }),
      el("div", {
        className: "referral-success__number",
        children: [
          el("span", { text: successContent.numberLabel || "Número de participación" }),
          el("strong", { attrs: { "data-participation-number": "" }, text: "RYG-000000" }),
          el("time", {
            className: "referral-success__date",
            text: `${successContent.dateLabel || "Fecha de registro"}: --/--/----`,
            attrs: {
              "data-registration-date": "",
              "data-label": successContent.dateLabel || "Fecha de registro",
            },
          }),
        ],
      }),
      el("p", { className: "referral-success__proof", text: successContent.proofNote || "Conservá este número como comprobante de participación." }),
      el("p", { className: "referral-success__next", text: successContent.nextStep || "Podremos contactar a tus referidos por los datos que compartiste." }),
      el("button", {
        className: "button button--secondary referral-success__download",
        text: successContent.downloadLabel || "Descargar comprobante en PDF",
        attrs: { type: "button", "data-download-referral-pdf": "" },
      }),
    ],
  });

  panel.querySelector("[data-download-referral-pdf]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const defaultLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Preparando comprobante…";

    try {
      await downloadReferralReceiptPdf({
        element: panel,
        participationNumber: panel.querySelector("[data-participation-number]")?.textContent,
      });
    } catch (error) {
      console.error("No se pudo generar el comprobante en PDF.", error);
      window.alert("No pudimos generar el comprobante. Intentá nuevamente.");
    } finally {
      button.disabled = false;
      button.textContent = defaultLabel;
    }
  });

  return panel;
}

function createReferralForm(program, config) {
  const formContent = program.form || {};
  const successPanel = createSuccessPanel(program.success || {});
  const referralList = el("div", { className: "referral-list", attrs: { "data-referral-list": "" } });
  const addButton = el("button", {
    className: "button button--secondary referral-form__add",
    attrs: { type: "button", "data-add-referral": "" },
    children: [
      el("span", { text: "+", attrs: { "aria-hidden": "true" } }),
      document.createTextNode(formContent.addReferralLabel || "Agregar otro referido"),
    ],
  });
  const active = Boolean(config?.enabled && config?.status === "active" && config?.endpoint && isValidUrl(config.endpoint));
  const status = el("div", {
    className: "referral-form__status",
    attrs: { "data-referral-form-status": active ? FORM_STATES.IDLE : FORM_STATES.UNAVAILABLE, "aria-live": "polite" },
    text: active ? "" : formContent.unavailableMessage,
  });
  const submitButton = el("button", {
    className: "button button--primary referral-form__submit",
    text: formContent.submitLabel || "Registrar mi participación",
    attrs: {
      type: "submit",
      disabled: active ? null : true,
      "data-default-text": formContent.submitLabel || "Registrar mi participación",
      "data-submitting-text": formContent.submittingLabel || "Registrando participación…",
      "data-retry-text": formContent.retryLabel || "Intentar nuevamente",
    },
  });
  const form = el("form", {
    className: "lead-form referral-form",
    attrs: { novalidate: true, "data-referral-form": "" },
    children: [
      status,
      el("fieldset", {
        className: "referral-form__participant",
        children: [
          el("legend", { text: formContent.participantTitle || "Tus datos" }),
          el("p", { className: "referral-form__section-intro", text: formContent.participantIntro }),
          el("div", {
            className: "referral-form__participant-grid",
            children: [
              createTextField({ id: "referral-participant-name", name: "participantName", label: "Nombre", required: true, autocomplete: "given-name", maxlength: "80" }),
              createTextField({ id: "referral-participant-last-name", name: "participantLastName", label: "Apellido", required: true, autocomplete: "family-name", maxlength: "80" }),
              createTextField({ id: "referral-participant-dni", name: "participantDni", label: "DNI", required: true, autocomplete: "off", inputmode: "numeric", maxlength: "12" }),
              createTextField({ id: "referral-participant-phone", name: "participantPhone", label: "Teléfono", type: "tel", required: true, autocomplete: "tel", inputmode: "tel", maxlength: "30" }),
              createTextField({ id: "referral-participant-email", name: "participantEmail", label: "Email", type: "email", required: true, autocomplete: "email", inputmode: "email", maxlength: "120" }),
              createSellerField({ options: formContent.sellerOptions, help: formContent.sellerHelp }),
            ],
          }),
        ],
      }),
      el("section", {
        className: "referral-form__referrals",
        attrs: { "aria-labelledby": "referral-form-referrals-title" },
        children: [
          el("div", {
            className: "referral-form__referrals-head",
            children: [
              el("div", {
                children: [
                  el("h3", { attrs: { id: "referral-form-referrals-title" }, text: formContent.referralsTitle || "Tus referidos" }),
                  el("p", { text: formContent.referralsIntro }),
                ],
              }),
            ],
          }),
          referralList,
          addButton,
        ],
      }),
      el("label", {
        className: "referral-form__consent",
        attrs: { for: "referral-consent" },
        children: [
          el("input", {
            attrs: { id: "referral-consent", name: "consent", type: "checkbox", value: "yes", required: true, "aria-describedby": fieldErrorId("referral-consent") },
          }),
          el("span", {
            children: [
              document.createTextNode(formContent.consentText || "Acepto las condiciones de participación."),
              document.createTextNode(" "),
              el("a", { text: formContent.privacyLinkLabel || "Política de privacidad", attrs: { href: normalizeInternalTarget("/privacidad/") } }),
            ],
          }),
          el("small", { className: "field-error", attrs: { id: fieldErrorId("referral-consent"), "aria-live": "polite" } }),
        ],
      }),
      el("label", {
        className: "referral-form__trap",
        children: [
          el("span", { text: "No completar este campo" }),
          el("input", { attrs: { name: "website", type: "text", tabindex: "-1", autocomplete: "off" } }),
        ],
      }),
      el("div", {
        className: "referral-form__footer",
        children: [submitButton],
      }),
    ],
  });

  const updateReferralState = () => {
    const blocks = [...referralList.querySelectorAll("[data-referral]")];
    const total = blocks.length;
    blocks.forEach((block, index) => {
      const legend = block.querySelector("legend");
      const remove = block.querySelector("[data-remove-referral]");
      if (legend) legend.textContent = `Referido ${index + 1}`;
      if (remove) remove.hidden = total === 1;
    });
  };

  const appendReferral = ({ focus = false } = {}) => {
    const block = createReferralFieldset(formContent);
    referralList.append(block);
    block.querySelector("[data-remove-referral]")?.addEventListener("click", () => {
      block.remove();
      updateReferralState();
      addButton.focus();
    });
    updateReferralState();
    if (focus) block.querySelector("input")?.focus();
  };

  const setState = (state, message = "") => {
    status.dataset.referralFormStatus = state;
    status.textContent = message;
    submitButton.dataset.state = state;
    submitButton.disabled = !active || [FORM_STATES.VALIDATING, FORM_STATES.SUBMITTING, FORM_STATES.SUCCESS].includes(state);
    submitButton.textContent =
      state === FORM_STATES.SUBMITTING
        ? submitButton.dataset.submittingText
        : state === FORM_STATES.ERROR
          ? submitButton.dataset.retryText
          : submitButton.dataset.defaultText;
  };

  appendReferral();
  addButton.addEventListener("click", () => appendReferral({ focus: true }));

  const sellerCode = form.elements.sellerCode;
  const querySellerCode = new URLSearchParams(window.location.search).get("v");
  if (sellerCode && querySellerCode) sellerCode.value = querySellerCode.trim().slice(0, 30);

  form.addEventListener("input", (event) => {
    clearFieldError(event.target);
    if (status.dataset.referralFormStatus === FORM_STATES.ERROR) setState(FORM_STATES.IDLE);
  });
  form.addEventListener("change", (event) => clearFieldError(event.target));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!active) {
      setState(FORM_STATES.UNAVAILABLE, formContent.unavailableMessage);
      return;
    }

    setState(FORM_STATES.VALIDATING);
    clearAllErrors(form);
    const payload = normalizePayload(form, formContent);
    const errors = validatePayload(form, payload);

    if (errors.length) {
      errors.forEach(([field, message]) => setFieldError(field, message));
      setState(FORM_STATES.IDLE);
      errors[0][0]?.focus();
      return;
    }

    setState(FORM_STATES.SUBMITTING, "Estamos registrando tu participación.");
    try {
      const participationNumber = await sendReferralProgram(config, payload);
      successPanel.querySelector("[data-participation-number]").textContent = participationNumber;
      setRegistrationDate(successPanel, new Date());
      setState(FORM_STATES.SUCCESS);
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.focus();
      successPanel.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    } catch (error) {
      console.warn("No se pudo registrar la participación de Recomendá y Ganá.", error);
      setState(FORM_STATES.ERROR, formContent.errorMessage || "No pudimos registrar la participación. Intentá nuevamente.");
      submitButton.focus();
    }
  });

  return el("div", { className: "referral-form-shell", children: [form, successPanel] });
}

function createHeroVisual() {
  return el("div", {
    className: "referral-hero__visual",
    attrs: { "aria-hidden": "true" },
    children: [
      el("div", {
        className: "referral-network",
        children: [
          el("span", { className: "referral-network__line referral-network__line--one" }),
          el("span", { className: "referral-network__line referral-network__line--two" }),
          el("div", { className: "referral-network__person referral-network__person--main", children: [el("span"), el("strong", { text: "Vos" })] }),
          el("div", { className: "referral-network__person referral-network__person--one", children: [el("span"), el("strong", { text: "Referido" })] }),
          el("div", { className: "referral-network__person referral-network__person--two", children: [el("span"), el("strong", { text: "Referido" })] }),
          el("div", {
            className: "referral-network__ticket",
            children: [el("small", { text: "Tu comprobante" }), el("strong", { text: "RYG-••••••" })],
          }),
        ],
      }),
    ],
  });
}

function createProgramPage(program, config) {
  const hero = program.hero || {};
  const steps = program.steps || {};
  const audience = program.audience || {};
  const benefit = program.benefit || {};
  const formContent = program.form || {};

  return el("div", {
    className: "referral-program",
    children: [
      el("section", {
        className: "referral-hero",
        attrs: { "aria-labelledby": "referral-page-title" },
        children: [
          el("div", {
            className: "container referral-hero__grid",
            children: [
              el("div", {
                className: "referral-hero__copy",
                children: [
                  el("h1", { attrs: { id: "referral-page-title" }, text: hero.title || "Recomendá y Ganá" }),
                  el("p", { className: "referral-hero__intro", text: hero.intro }),
                  el("a", { className: "button referral-hero__cta", text: hero.ctaLabel || "Participar ahora", attrs: { href: "#participar" } }),
                  el("p", { className: "referral-hero__note", text: hero.transparencyNote }),
                ],
              }),
              createHeroVisual(),
            ],
          }),
        ],
      }),
      el("section", {
        className: "referral-steps",
        attrs: { "aria-labelledby": "referral-steps-title" },
        children: [
          el("div", {
            className: "container referral-steps__layout",
            children: [
              el("header", {
                className: "referral-steps__header",
                children: [
                  el("h2", { attrs: { id: "referral-steps-title" }, text: steps.title }),
                  el("p", { text: steps.intro }),
                ],
              }),
              el("ol", {
                className: "referral-steps__list",
                children: (steps.items || []).map((item, index) =>
                  el("li", {
                    children: [
                      el("span", { className: "referral-steps__number", text: String(index + 1).padStart(2, "0"), attrs: { "aria-hidden": "true" } }),
                      el("div", { children: [el("h3", { text: item.title }), el("p", { text: item.body })] }),
                    ],
                  }),
                ),
              }),
            ],
          }),
        ],
      }),
      el("section", {
        className: "referral-context",
        attrs: { "aria-labelledby": "referral-audience-title" },
        children: [
          el("div", {
            className: "container referral-context__grid",
            children: [
              el("div", {
                className: "referral-audience",
                children: [
                  el("h2", { attrs: { id: "referral-audience-title" }, text: audience.title }),
                  el("p", { text: audience.intro }),
                  el("ul", { children: (audience.interests || []).map((interest) => el("li", { text: interest })) }),
                ],
              }),
              el("aside", {
                className: "referral-benefit",
                attrs: { "aria-labelledby": "referral-benefit-title" },
                children: [
                  el("div", { className: "referral-benefit__mark", attrs: { "aria-hidden": "true" } }),
                  el("h2", { attrs: { id: "referral-benefit-title" }, text: benefit.title }),
                  el("p", { text: benefit.body }),
                  el("p", { className: "referral-benefit__note", text: benefit.note }),
                ],
              }),
            ],
          }),
        ],
      }),
      el("section", {
        className: "referral-entry",
        attrs: { id: "participar", "aria-labelledby": "referral-form-title" },
        children: [
          el("div", {
            className: "container referral-entry__grid",
            children: [
              el("header", {
                className: "referral-entry__intro",
                children: [
                  el("p", { className: "referral-entry__label", text: "Tu participación" }),
                  el("h2", { attrs: { id: "referral-form-title" }, text: formContent.title || "Registrá tu participación" }),
                  el("p", { text: formContent.intro }),
                  el("div", {
                    className: "referral-entry__assurance",
                    children: [
                      el("strong", { text: "Antes de agregar un referido" }),
                      el("p", { text: "Confirmá que cada persona autorizó compartir sus datos de contacto." }),
                    ],
                  }),
                ],
              }),
              createReferralForm(program, config || {}),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function initReferralProgramPage(site, agencyContact) {
  const mount = qs("[data-referral-program-page]");
  if (!mount) return;

  const program = await loadReferralProgram();
  clear(mount);
  mount.append(createProgramPage(program, agencyContact?.referralProgram || {}));
}
