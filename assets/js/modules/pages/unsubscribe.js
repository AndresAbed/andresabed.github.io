import { loadAgencyContact, withSiteBasePath } from "../data/api.js";
import { clear, el, qs } from "../utils/dom.js";

const STATES = Object.freeze({
  success: {
    title: "Tu preferencia quedó actualizada",
    message: "No vamos a enviarte más novedades por email desde esta lista. Si cambiás de idea, podés volver a suscribirte cuando quieras.",
    tone: "success",
  },
  error: {
    title: "No pudimos confirmar la baja",
    message: "El enlace puede estar vencido o incompleto. Si seguís recibiendo correos, respondé el mensaje y te ayudamos a revisarlo.",
    tone: "error",
  },
});

function stateFromStatus(status) {
  const rawStatus = String(status || "").toLowerCase();

  if (["error", "invalid", "no-encontrado", "not-found"].includes(rawStatus)) {
    return STATES.error;
  }

  return STATES.success;
}

function replaceUrlStatus(status) {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  url.searchParams.delete("status");
  url.searchParams.set("estado", status);
  window.history.replaceState({}, "", url);
}

async function resolveState() {
  const params = new URLSearchParams(window.location.search);
  const existingStatus = params.get("estado") || params.get("status");

  if (existingStatus) {
    return stateFromStatus(existingStatus);
  }

  const token = String(params.get("token") || "").trim();

  if (!token) {
    replaceUrlStatus("error");
    return STATES.error;
  }

  try {
    const contactConfig = await loadAgencyContact();
    const formConfig = contactConfig?.newsletterForm || {};
    const endpoint = String(formConfig.endpoint || "").trim();

    if (!formConfig.enabled || !endpoint) {
      throw new Error("Unsubscribe endpoint unavailable");
    }

    const response = await fetch(endpoint, {
      method: formConfig.method || "POST",
      body: new URLSearchParams({
        formType: "unsubscribe",
        token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Unsubscribe request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.ok !== true) {
      replaceUrlStatus("error");
      return STATES.error;
    }

    replaceUrlStatus("success");
    return STATES.success;
  } catch (error) {
    console.warn("No se pudo procesar la baja de novedades.", error);
    replaceUrlStatus("error");
    return STATES.error;
  }
}

function createUnsubscribeView(state) {
  return el("section", {
    className: "unsubscribe-view",
    attrs: { "aria-labelledby": "unsubscribe-title" },
    children: [
      el("div", {
        className: "container unsubscribe-view__inner",
        children: [
          el("article", {
            className: "unsubscribe-panel",
            attrs: { "data-unsubscribe-tone": state.tone },
            children: [
              el("img", {
                className: "unsubscribe-panel__logo",
                attrs: {
                  src: withSiteBasePath("/assets/img/brand/logo-agencias-abed-vertical-black.svg"),
                  alt: "Club San Jorge | Agencias Abed",
                  width: "161",
                  height: "119",
                },
              }),
              el("div", { className: "unsubscribe-panel__mark", attrs: { "aria-hidden": "true" } }),
              el("h1", { text: state.title, attrs: { id: "unsubscribe-title" } }),
              el("p", { text: state.message }),
              el("a", {
                className: "button button--primary unsubscribe-panel__action",
                text: "Volver al inicio",
                attrs: { href: withSiteBasePath("/") },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function initUnsubscribePage() {
  const mount = qs("[data-unsubscribe-page]");
  if (!mount) return;

  const state = await resolveState();
  clear(mount);
  mount.append(createUnsubscribeView(state));
}

function finishUnsubscribeLoading() {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("app-loading");
    document.documentElement.classList.add("app-ready");
  });
}

initUnsubscribePage()
  .catch((error) => {
    console.error("No se pudo inicializar la vista de baja.", error);
  })
  .finally(finishUnsubscribeLoading);
