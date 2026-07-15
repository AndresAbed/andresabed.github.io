import { getResourcesByGroup } from "../../data/api.js";
import { classifyLinkItem } from "../../data/validators.js";
import { clear, el, qs } from "../../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES } from "../../utils/status.js";
import { createHomeSectionHeader } from "./shared.js?v=20260714-41";

export function renderSubscriberResources(data) {
  const target = qs("[data-subscriber-resources]");
  if (!target) return;

  const resources = getResourcesByGroup(data.resources, "gestiones");
  const primary = resources.find((item) => item.id === "pagar-cuota") || resources[0];
  const secondary = resources.filter((item) => item.id !== primary?.id);
  if (!primary && !secondary.length) return;

  const primaryEnabled = classifyLinkItem(primary) === UI_STATES.READY;

  clear(target);
  target.append(
    el("div", {
      className: "home-subscriber-head",
      children: [
        createHomeSectionHeader({
          eyebrow: "Gestiones",
          title: "Para suscriptores",
          id: "subscriber-resources-title",
          intro: "Accesos oficiales para pagar, descargar boletas y configurar medios de pago.",
          align: "center",
        }),
      ],
    }),
    el("div", {
      className: "home-subscriber-tools",
      children: [
        el("section", {
          className: "home-subscriber-tools__main",
          attrs: { "aria-labelledby": "subscriber-tools-title" },
          children: [
            el("h3", { attrs: { id: "subscriber-tools-title" }, text: "Tus gestiones, más a mano" }),
            el("p", {
              text: "Accedé rápido a pagos, boletas y opciones de gestión vinculadas a tu suscripción.",
            }),
            primaryEnabled
              ? el("a", {
                  className: "button button--primary home-subscriber-tools__primary",
                  text: "Pagar mi boleta",
                  attrs: { href: primary.url, target: "_blank", rel: "noopener noreferrer" },
                })
              : el("span", { className: "badge badge--warning", text: FALLBACK_TEXT.updating }),
            el("small", { text: "Acceso al sitio oficial de Club San Jorge." }),
          ],
        }),
        el("nav", {
          className: "home-subscriber-tools__list",
          attrs: { "aria-label": "Recursos para suscriptores" },
          children: secondary.map((item) => {
            const enabled = classifyLinkItem(item) === UI_STATES.READY;
            return enabled
              ? el("a", {
                  className: `home-subscriber-link home-subscriber-link--${item.id}`,
                  attrs: { href: item.url, target: "_blank", rel: "noopener noreferrer" },
                  children: [
                    el("span", { className: "home-subscriber-link__icon", attrs: { "aria-hidden": "true" } }),
                    el("span", {
                      className: "home-subscriber-link__copy",
                      children: [
                        el("strong", { text: item.title }),
                        el("span", { text: item.description }),
                      ],
                    }),
                    el("span", { className: "home-subscriber-link__arrow", text: "Abrir" }),
                  ],
                })
              : el("div", {
                  className: `home-subscriber-link home-subscriber-link--${item.id}`,
                  attrs: { "data-state": UI_STATES.PARTIAL },
                  children: [
                    el("span", { className: "home-subscriber-link__icon", attrs: { "aria-hidden": "true" } }),
                    el("span", {
                      className: "home-subscriber-link__copy",
                      children: [
                        el("strong", { text: item.title }),
                        el("span", { text: FALLBACK_TEXT.updating }),
                      ],
                    }),
                  ],
                });
          }),
        }),
      ],
    }),
  );
}
