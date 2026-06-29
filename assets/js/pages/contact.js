import { getCatalogItems, loadAgencyContact, loadPlanCatalog } from "../data/api.js?v=artemis-live-data-v1";
import {
  CONTACT_STATES,
  clearFieldErrors,
  createContactHero,
  createContactMethods,
  createLeadForm,
  createPayloadSummary,
  createProcessSteps,
  createSectionHeader,
  setFormState,
  showFieldErrors,
} from "../components/contact-components.js";
import { createFinalHelpCta } from "../components/info-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { hasValue, isValidUrl } from "../utils/validators.js";

function getQueryDefaults() {
  const params = new URLSearchParams(window.location.search);
  return {
    intent: params.get("intent") || "consulta",
    inquiryType: params.get("intent") === "iniciar_solicitud" ? "iniciar_solicitud" : "informacion_general",
    plan: params.get("plan") || "no_estoy_seguro",
  };
}

function normalizePayload(form) {
  const formData = new FormData(form);
  return {
    source: "club_san_jorge_static_site",
    createdAt: new Date().toISOString(),
    intent: String(formData.get("intent") || "").trim(),
    inquiryType: String(formData.get("inquiryType") || "").trim(),
    fullName: String(formData.get("fullName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    province: String(formData.get("province") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    planInterest: String(formData.get("planInterest") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    readInfo: formData.get("readInfo") === "yes",
  };
}

function validatePayload(payload) {
  const errors = {};
  if (!hasValue(payload.intent)) errors.intent = "Elegí si querés consultar o iniciar una solicitud.";
  if (!hasValue(payload.inquiryType)) errors.inquiryType = "Elegí el tipo de consulta.";
  if (!hasValue(payload.fullName)) errors.fullName = "Ingresá tu nombre y apellido.";
  if (!hasValue(payload.phone)) errors.phone = "Ingresá un teléfono o WhatsApp para contactarte.";
  if (!hasValue(payload.email)) {
    errors.email = "Ingresá un email de contacto.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresá un email válido.";
  }
  if (!hasValue(payload.province)) errors.province = "Indicá tu provincia.";
  if (!hasValue(payload.planInterest)) errors.planInterest = "Elegí una opción del catálogo o indicá que no estás seguro.";
  return errors;
}

function buildMailto(config, payload) {
  const email = config?.channels?.email;
  if (!email?.enabled || !hasValue(email.address)) return "";

  const subject = encodeURIComponent(`Consulta Club San Jorge - ${payload.fullName}`);
  const body = encodeURIComponent(
    [
      `Nombre: ${payload.fullName}`,
      `Telefono/WhatsApp: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Provincia/Ciudad: ${payload.province}${payload.city ? ` / ${payload.city}` : ""}`,
      `Intencion: ${payload.intent}`,
      `Tipo de consulta: ${payload.inquiryType}`,
      `Opcion de catalogo: ${payload.planInterest}`,
      `Comentarios: ${payload.message || "-"}`,
      `Leido info general: ${payload.readInfo ? "Si" : "No / quiere explicacion"}`,
    ].join("\n"),
  );
  return `mailto:${email.address}?subject=${subject}&body=${body}`;
}

function buildWhatsapp(config, payload) {
  const whatsapp = config?.channels?.whatsapp;
  if (!whatsapp?.enabled || !isValidUrl(whatsapp.url)) return "";

  const url = new URL(whatsapp.url, window.location.origin);
  const text = [
    "Hola, quiero consultar por un plan Club San Jorge.",
    "",
    `Nombre: ${payload.fullName}`,
    `Telefono/WhatsApp: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Provincia/Ciudad: ${payload.province}${payload.city ? ` / ${payload.city}` : ""}`,
    `Tipo de consulta: ${payload.inquiryType}`,
    `Opción de catálogo: ${payload.planInterest}`,
    `Comentarios: ${payload.message || "-"}`,
  ].join("\n");

  url.searchParams.set("text", text);
  return url.toString();
}

async function sendLead(config, payload) {
  const formConfig = config?.form || {};

  if (formConfig.enabled && formConfig.endpoint && isValidUrl(formConfig.endpoint)) {
    const response = await fetch(formConfig.endpoint, {
      method: formConfig.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Lead endpoint failed: ${response.status}`);
    return { state: CONTACT_STATES.SUCCESS, mode: "endpoint" };
  }

  const mailto = buildMailto(config, payload);
  if (mailto) {
    window.location.href = mailto;
    return { state: CONTACT_STATES.SUCCESS, mode: "mailto" };
  }

  const whatsapp = buildWhatsapp(config, payload);
  if (whatsapp) {
    window.location.href = whatsapp;
    return { state: CONTACT_STATES.SUCCESS, mode: "whatsapp" };
  }

  console.info("Lead payload preparado en modo placeholder", payload);
  sessionStorage.setItem("lastLeadPayload", JSON.stringify(payload));
  return { state: CONTACT_STATES.UNAVAILABLE, mode: "placeholder" };
}

function createUnavailableNotice(config) {
  return el("article", {
    className: "data-status-banner",
    attrs: { "data-state": "partial" },
    children: [
      el("div", {
        className: "stack",
        children: [
          el("span", { className: "badge badge--warning", text: "Canales en configuracion" }),
          el("h3", { text: "El flujo queda preparado para conectar el envio real" }),
          el("p", {
            text:
              config?.messages?.unavailable ||
              "La consulta puede validarse y preparar el payload, pero aun falta configurar endpoint, email o WhatsApp.",
          }),
        ],
      }),
    ],
  });
}

export async function initContactPage() {
  const target = qs("[data-contact-page]");
  if (!target) return;

  const [config, catalogData] = await Promise.all([loadAgencyContact(), loadPlanCatalog()]);
  const catalogItems = getCatalogItems(catalogData);
  const defaults = getQueryDefaults();
  const resultSlot = el("div", { className: "stack", attrs: { "aria-live": "polite" } });

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = normalizePayload(form);
    setFormState(form, CONTACT_STATES.VALIDATING, "Revisando datos...");
    const errors = validatePayload(payload);

    if (Object.keys(errors).length) {
      showFieldErrors(form, errors);
      setFormState(form, CONTACT_STATES.ERROR, "Hay campos para revisar antes de enviar.");
      return;
    }

    clearFieldErrors(form);
    setFormState(form, CONTACT_STATES.SUBMITTING, "Preparando consulta...");
    sendLead(config, payload)
      .then((result) => {
        clear(resultSlot);
        if (result.state === CONTACT_STATES.SUCCESS) {
          setFormState(form, CONTACT_STATES.SUCCESS, config.messages?.success || "Consulta enviada.");
        } else {
          setFormState(form, CONTACT_STATES.UNAVAILABLE, config.messages?.unavailable || "Canal en configuracion.");
          resultSlot.append(createPayloadSummary(payload));
        }
      })
      .catch(() => {
        setFormState(form, CONTACT_STATES.ERROR, config.messages?.error || "No pudimos procesar la consulta.");
      });
  }

  clear(target);
  target.append(
    createContactHero(),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "contact-methods-title" },
      children: [
        createSectionHeader({
          eyebrow: "Canales",
          title: "Elegí cómo querés seguir",
          id: "contact-methods-title",
          intro: "Mostramos canales reales cuando estén configurados. Mientras tanto, el formulario ordena la consulta comercial.",
        }),
        createContactMethods(config),
      ],
    }),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "before-start-title" },
      children: [
        createSectionHeader({
          eyebrow: "Antes de iniciar",
          title: "Este paso ordena la consulta",
          id: "before-start-title",
          intro: config.messages?.nextSteps,
        }),
        createProcessSteps(),
      ],
    }),
    el("section", {
      className: "contact-layout",
      attrs: { "aria-labelledby": "lead-form-title" },
      children: [
        el("div", {
          className: "stack",
          children: [
            createSectionHeader({
              eyebrow: "Formulario",
              title: "Consulta comercial",
              id: "lead-form-title",
              intro: "Completá los datos mínimos para continuar por categoria u opcion de catalogo.",
            }),
            createLeadForm({ plans: catalogItems, defaults, onSubmit: handleSubmit }),
          ],
        }),
        el("aside", {
          className: "stack",
          children: [
            createUnavailableNotice(config),
            resultSlot,
            createFinalHelpCta({
              title: "Te acompañamos antes de avanzar",
              body: "Si no sabés qué opcion elegir, marcá 'No estoy seguro' y dejá tus dudas en el mensaje.",
              label: "Ver planes",
              href: "/planes/",
            }),
          ],
        }),
      ],
    }),
  );
}
