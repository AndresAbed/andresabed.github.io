import { withSiteBasePath } from "../data/api.js";
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

function resolveState() {
  const params = new URLSearchParams(window.location.search);
  const rawStatus = String(params.get("estado") || params.get("status") || "success").toLowerCase();

  if (["error", "invalid", "no-encontrado", "not-found"].includes(rawStatus)) {
    return STATES.error;
  }

  return STATES.success;
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

export function initUnsubscribePage() {
  const mount = qs("[data-unsubscribe-page]");
  if (!mount) return;

  clear(mount);
  mount.append(createUnsubscribeView(resolveState()));
}

function finishUnsubscribeLoading() {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("app-loading");
    document.documentElement.classList.add("app-ready");
  });
}

try {
  initUnsubscribePage();
} finally {
  finishUnsubscribeLoading();
}
