import { clear, el, qs } from "../../utils/dom.js";
import { normalizeInternalTarget, withSiteBasePath } from "../../data/api.js";
import { hasValue, isValidUrl } from "../../utils/validators.js";

function recruitmentFieldId(name) {
  return `recruitment-${name}`;
}

function recruitmentErrorId(name) {
  return `${recruitmentFieldId(name)}-error`;
}

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

function createRecruitmentField({ name, label, type = "text", required = false, placeholder = "", autocomplete = "" }) {
  const inputAttrs = {
    id: recruitmentFieldId(name),
    name,
    type,
    required,
    "aria-describedby": recruitmentErrorId(name),
  };
  if (autocomplete) inputAttrs.autocomplete = autocomplete;
  if (placeholder) inputAttrs.placeholder = placeholder;

  return el("label", {
    attrs: { for: recruitmentFieldId(name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("input", { attrs: inputAttrs }),
      el("small", { className: "field-error", attrs: { id: recruitmentErrorId(name), "aria-live": "polite" } }),
    ],
  });
}

function createRecruitmentSelect({ name, label, required = false, options }) {
  return el("label", {
    attrs: { for: recruitmentFieldId(name) },
    children: [
      el("span", { text: required ? `${label} *` : label }),
      el("select", {
        attrs: { id: recruitmentFieldId(name), name, required, "aria-describedby": recruitmentErrorId(name) },
        children: options.map((option) => el("option", { text: option.label, attrs: { value: option.value } })),
      }),
      el("small", { className: "field-error", attrs: { id: recruitmentErrorId(name), "aria-live": "polite" } }),
    ],
  });
}

function createRecruitmentTextarea({ name, label, placeholder = "" }) {
  const textareaAttrs = {
    id: recruitmentFieldId(name),
    name,
    rows: 4,
    "aria-describedby": recruitmentErrorId(name),
  };
  if (placeholder) textareaAttrs.placeholder = placeholder;

  return el("label", {
    className: "home-recruitment-form__textarea-field",
    attrs: { for: recruitmentFieldId(name) },
    children: [
      el("span", { text: label }),
      el("textarea", { attrs: textareaAttrs }),
      el("small", { className: "field-error", attrs: { id: recruitmentErrorId(name), "aria-live": "polite" } }),
    ],
  });
}

function normalizeRecruitmentPayload(form) {
  const formData = new FormData(form);
  return {
    source: "Formulario web - Postulación comercial",
    createdAt: new Date().toISOString(),
    fullName: String(formData.get("fullName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    province: String(formData.get("province") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    commercialExperience: String(formData.get("commercialExperience") || "").trim(),
    availability: String(formData.get("availability") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    consent: formData.get("consent") === "yes",
  };
}

function validateRecruitmentPayload(payload) {
  const errors = {};
  if (!hasValue(payload.fullName)) errors.fullName = "Ingresá tu nombre y apellido.";
  if (!hasValue(payload.phone)) errors.phone = "Ingresá un teléfono o WhatsApp.";
  if (!hasValue(payload.email)) {
    errors.email = "Ingresá un email de contacto.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresá un email válido.";
  }
  if (!hasValue(payload.province)) errors.province = "Indicá tu provincia.";
  if (!hasValue(payload.commercialExperience)) errors.commercialExperience = "Contanos si tenés experiencia comercial.";
  if (!payload.consent) errors.consent = "Necesitamos tu autorización para contactarte por esta postulación.";
  return errors;
}

function setRecruitmentFormState(form, state, message) {
  const status = form.querySelector("[data-form-status]");
  const button = form.querySelector("button[type='submit']");
  if (status) {
    status.dataset.formStatus = state;
    status.textContent = message || "";
  }
  if (button) {
    button.dataset.recruitmentState = state || "idle";
    button.disabled = state === "submitting" || state === "validating" || state === "success";
    if (state === "submitting") {
      button.textContent = "Enviando...";
    } else if (state === "success") {
      button.textContent = "Enviado";
    } else if (state === "error") {
      button.textContent = "Intentar nuevamente";
    } else {
      button.textContent = "Enviar postulación";
    }
  }
}

function clearRecruitmentErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function showRecruitmentErrors(form, errors) {
  clearRecruitmentErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    const error = form.querySelector(`#${recruitmentErrorId(name)}`);
    if (field) field.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  });
}

function buildRecruitmentMailto(config, payload) {
  const email = String(config?.form?.recipientEmail || "").trim();
  if (!hasValue(email)) return "";

  const subject = encodeURIComponent(`Nueva postulación comercial - ${payload.fullName}`);
  const body = encodeURIComponent(
    [
      "Nueva postulación comercial",
      "",
      `Origen: ${payload.source}`,
      `Fecha de envío: ${formatRecruitmentDate(payload.createdAt)}`,
      `Nombre: ${payload.fullName}`,
      `Teléfono / WhatsApp: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Provincia/Ciudad: ${payload.province}${payload.city ? ` / ${payload.city}` : ""}`,
      `Experiencia comercial: ${payload.commercialExperience}`,
      `Disponibilidad: ${payload.availability || "-"}`,
      `Mensaje: ${payload.message || "-"}`,
      `Autorización de contacto: ${payload.consent ? "Sí" : "No"}`,
    ].join("\n"),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function formatRecruitmentDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function recruitmentPayloadToFormData(payload) {
  const formData = new FormData();
  formData.append("_subject", `Nueva postulación comercial - ${payload.fullName}`);
  formData.append("Origen", payload.source);
  formData.append("Fecha de envío", formatRecruitmentDate(payload.createdAt));
  formData.append("Nombre y apellido", payload.fullName);
  formData.append("Teléfono / WhatsApp", payload.phone);
  formData.append("Email", payload.email);
  formData.append("Provincia", payload.province);
  formData.append("Ciudad", payload.city || "-");
  formData.append("Experiencia comercial", payload.commercialExperience);
  formData.append("Disponibilidad", payload.availability || "-");
  formData.append("Mensaje", payload.message || "-");
  formData.append("Autorización de contacto", payload.consent ? "Sí" : "No");
  return formData;
}

async function sendRecruitmentApplication(config, payload) {
  const formConfig = config?.form || {};

  if (formConfig.enabled && formConfig.endpoint && isValidUrl(formConfig.endpoint)) {
    const isFormspree = formConfig.provider === "formspree";
    const response = await fetch(formConfig.endpoint, {
      method: formConfig.method || "POST",
      headers: isFormspree ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
      body: isFormspree ? recruitmentPayloadToFormData(payload) : JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Recruitment endpoint failed: ${response.status}`);
    return { state: "success", mode: "endpoint" };
  }

  const mailto = buildRecruitmentMailto(config, payload);
  if (mailto) {
    window.location.href = mailto;
    return { state: "success", mode: "mailto" };
  }

  sessionStorage.setItem("lastRecruitmentPayload", JSON.stringify(payload));
  return { state: "unavailable", mode: "placeholder" };
}

function createRecruitmentFallback(payload) {
  return el("article", {
    className: "data-status-banner home-recruitment-fallback",
    attrs: { "data-state": "partial" },
    children: [
      el("div", {
        className: "stack",
        children: [
          el("span", { className: "badge badge--warning", text: "Modo fallback" }),
          el("h3", { text: "Postulación preparada" }),
          el("p", { text: "El envío automático todavía está en configuración. Estos datos quedaron listos para conectar con un endpoint real:" }),
          el("ul", {
            children: [
              el("li", { text: `Nombre: ${payload.fullName}` }),
              el("li", { text: `Contacto: ${payload.phone} / ${payload.email}` }),
              el("li", { text: `Zona: ${payload.province}${payload.city ? ` / ${payload.city}` : ""}` }),
              el("li", { text: `Experiencia comercial: ${payload.commercialExperience}` }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createRecruitmentForm(config, resultSlot) {
  const content = config.formContent || {};
  const form = el("form", {
    className: "lead-form home-recruitment-form",
    attrs: { novalidate: true },
    children: [
      el("div", { className: "form-status visually-hidden", attrs: { "data-form-status": "", "aria-live": "polite" } }),
      el("div", {
        className: "home-recruitment-form__intro",
        children: [
          el("span", { text: content.eyebrow || "Postulación comercial" }),
          el("h3", { text: content.title || "Dejanos tus datos" }),
          el("p", { text: content.intro || "Completá esta información para que podamos evaluar tu perfil y contactarte." }),
        ],
      }),
      el("div", {
        className: "form-grid home-recruitment-form__grid",
        children: [
          createRecruitmentField({ name: "fullName", label: "Nombre y apellido", required: true, autocomplete: "name" }),
          createRecruitmentField({ name: "phone", label: "Teléfono / WhatsApp", required: true, autocomplete: "tel" }),
          createRecruitmentField({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
          createRecruitmentSelect({ name: "province", label: "Provincia", required: true, options: ARGENTINA_PROVINCES }),
          createRecruitmentField({ name: "city", label: "Ciudad", autocomplete: "address-level2" }),
          createRecruitmentSelect({
            name: "commercialExperience",
            label: "Experiencia comercial",
            required: true,
            options: [
              { value: "", label: "Seleccioná una opción" },
              { value: "Sí, tengo experiencia en ventas", label: "Sí, tengo experiencia en ventas" },
              { value: "Sí, en atención al cliente", label: "Sí, en atención al cliente" },
              { value: "No, pero me interesa aprender", label: "No, pero me interesa aprender" },
            ],
          }),
          createRecruitmentSelect({
            name: "availability",
            label: "Disponibilidad",
            options: [
              { value: "", label: "Seleccioná una opción" },
              { value: "Jornada parcial", label: "Jornada parcial" },
              { value: "Jornada completa", label: "Jornada completa" },
              { value: "A convenir", label: "A convenir" },
            ],
          }),
        ],
      }),
      createRecruitmentTextarea({
        name: "message",
        label: "Contanos brevemente por qué querés sumarte",
        placeholder: "Contanos a qué te dedicás, qué experiencia comercial tenés y por qué te interesa sumarte.",
      }),
      el("label", {
        className: "checkbox-field",
        attrs: { for: recruitmentFieldId("consent") },
        children: [
          el("input", {
            attrs: {
              id: recruitmentFieldId("consent"),
              type: "checkbox",
              name: "consent",
              value: "yes",
              "aria-describedby": recruitmentErrorId("consent"),
            },
          }),
          el("span", {
            children: [
              "Acepto que me contacten por esta postulación comercial y que mis datos sean tratados según la ",
              el("a", { text: "política de privacidad", attrs: { href: normalizeInternalTarget("/privacidad/") } }),
              ".",
            ],
          }),
          el("small", { className: "field-error", attrs: { id: recruitmentErrorId("consent"), "aria-live": "polite" } }),
        ],
      }),
      el("p", {
        className: "home-recruitment-form__disclaimer",
        text:
          content.disclaimer ||
          "Enviar la postulación no implica una oferta laboral ni garantiza incorporación al equipo. Revisamos cada perfil antes de avanzar.",
      }),
      el("div", {
        className: "cluster home-recruitment-form__actions",
        children: [
          el("button", {
            className: "button button--primary home-recruitment-form__submit",
            text: "Enviar postulación",
            attrs: { type: "submit", "data-recruitment-state": "idle" },
          }),
        ],
      }),
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = normalizeRecruitmentPayload(form);
    const errors = validateRecruitmentPayload(payload);

    if (Object.keys(errors).length) {
      showRecruitmentErrors(form, errors);
      setRecruitmentFormState(form, "", "");
      return;
    }

    clearRecruitmentErrors(form);
    setRecruitmentFormState(form, "submitting", "Preparando postulación...");
    clear(resultSlot);
    sendRecruitmentApplication(config, payload)
      .then((result) => {
        if (result.state === "success") {
          setRecruitmentFormState(form, "success", config.messages?.success || "Postulación preparada.");
        } else {
          setRecruitmentFormState(form, "unavailable", config.messages?.unavailable || "El envío automático está en configuración.");
          resultSlot.append(createRecruitmentFallback(payload));
        }
      })
      .catch(() => {
        setRecruitmentFormState(form, "error", config.messages?.error || "No pudimos preparar la postulación.");
      });
  });

  form.addEventListener("reset", () => {
    window.requestAnimationFrame(() => {
      clearRecruitmentErrors(form);
      setRecruitmentFormState(form, "idle", "");
      clear(resultSlot);
    });
  });

  return form;
}

export function renderRecruitment(data) {
  const target = qs("[data-recruitment]");
  if (!target) return;

  const config = data.recruitment || {};
  const section = config.section || {};
  const benefits = Array.isArray(section.benefits) ? section.benefits.filter(Boolean) : [];
  const image = section.image || {};
  const panelId = "home-recruitment-form-panel";
  const resultSlot = el("div", { className: "home-recruitment__result", attrs: { "aria-live": "polite" } });
  const form = createRecruitmentForm(config, resultSlot);

  clear(target);
  target.append(
    el("div", {
      className: "home-recruitment",
      children: [
        el("article", {
          className: "home-recruitment__banner",
          children: [
            el("div", {
              className: "home-recruitment__copy",
              children: [
                el("h2", { attrs: { id: "home-recruitment-title" }, text: section.title || "¿Querés trabajar vendiendo planes?" }),
                el("p", {
                  text:
                    section.intro ||
                    "Si tenés experiencia en ventas y querés aumentar tus ingresos, sumate como productor a nuestro equipo comercial.",
                }),
                benefits.length
                  ? el("ul", {
                      className: "home-recruitment__benefits",
                      children: benefits.map((benefit) =>
                        el("li", {
                          children: [
                            el("span", { className: "home-recruitment__check", attrs: { "aria-hidden": "true" } }),
                            el("span", { text: benefit }),
                          ],
                        }),
                      ),
                    })
                  : null,
                el("div", {
                  className: "home-recruitment__action",
                  children: [
                    el("button", {
                      className: "button button--primary home-recruitment__toggle",
                      text: section.ctaLabel || "Quiero postularme",
                      attrs: { type: "button", "aria-expanded": "false", "aria-controls": panelId, "data-recruitment-toggle": true },
                    }),
                  ],
                }),
              ],
            }),
            image.src
              ? el("div", {
                  className: "home-recruitment__visual",
                  attrs: { "aria-hidden": "true", style: `--recruitment-image: url('${withSiteBasePath(image.src)}')` },
                })
              : null,
          ],
        }),
        el("div", {
          id: panelId,
          className: "home-recruitment__panel",
          attrs: { "data-open": "false", "data-recruitment-panel": true, "aria-hidden": "true", inert: true },
          children: [
            el("div", {
              className: "home-recruitment__panel-inner",
              children: [form, resultSlot],
            }),
          ],
        }),
      ],
    }),
  );

  const toggle = target.querySelector("[data-recruitment-toggle]");
  const panel = target.querySelector("[data-recruitment-panel]");
  toggle?.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    toggle.textContent = isOpen ? section.ctaLabel || "Quiero postularme" : "Ocultar formulario";
    panel.dataset.open = isOpen ? "false" : "true";
    panel.setAttribute("aria-hidden", isOpen ? "true" : "false");
    panel.toggleAttribute("inert", isOpen);
    if (!isOpen) {
      window.requestAnimationFrame(() => {
        panel.querySelector("input, select, textarea, button")?.focus({ preventScroll: false });
      });
    }
  });
}
