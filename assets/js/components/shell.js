import { normalizeInternalTarget } from "../data/api.js";
import { el, qs } from "../utils/dom.js";
import { isValidUrl } from "../utils/validators.js";

const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Planes", href: "/planes/" },
  { label: "Sorteos", href: "/sorteos/" },
  { label: "Adjudicados", href: "/adjudicados/" },
  { label: "Recursos", href: "/recursos/" },
  { label: "FAQ", href: "/faq/" },
  { label: "Contacto", href: "/contacto/" },
];

function isCurrentPath(href) {
  const current = window.location.pathname.replace(/index\.html$/, "");
  return current === href || (href !== "/" && current.startsWith(href));
}

function createNav() {
  return el("nav", {
    className: "site-nav",
    attrs: { "aria-label": "Navegacion principal" },
    children: NAV_ITEMS.map((item) =>
      el("a", {
        text: item.label,
        attrs: {
          href: item.href,
          "aria-current": isCurrentPath(item.href) ? "page" : null,
        },
      }),
    ),
  });
}

function createHeader(site) {
  const agency = site?.agency || {};
  const cta = site?.cta?.primary || {};
  const target = normalizeInternalTarget(cta.target);
  const hasCtaTarget = isValidUrl(target);

  return el("header", {
    className: "site-header",
    children: [
      el("div", {
        className: "container site-header__inner",
        children: [
          el("a", {
            className: "brand-lockup",
            attrs: { href: "/", "aria-label": "Ir al inicio" },
            children: [
              el("span", { className: "brand-lockup__eyebrow", text: agency.legalDescriptor || "Agencia mercantil" }),
              el("span", { text: agency.displayLockup || "Club San Jorge | Agencias Abed" }),
            ],
          }),
          createNav(),
          el("div", {
            className: "site-header__actions",
            children: [
              el("a", {
                className: `button ${hasCtaTarget ? "button--primary" : "button--disabled"}`,
                text: cta.label || "Quiero asesoramiento",
                attrs: hasCtaTarget
                  ? { href: target }
                  : { href: "#", "aria-disabled": "true", title: "Canal en configuracion" },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createFooter(site) {
  const legal = site?.legal || {};
  const agency = site?.agency || {};

  return el("footer", {
    className: "site-footer",
    children: [
      el("div", {
        className: "container site-footer__inner",
        children: [
          el("div", {
            className: "site-footer__brand",
            children: [
              el("strong", { text: agency.displayLockup || "Club San Jorge | Agencias Abed" }),
              el("p", { text: legal.siteRoleText || "Sitio informativo y comercial de agencia mercantil." }),
              el("p", { text: legal.disclaimerText || "La informacion debe revisarse junto con condiciones vigentes." }),
            ],
          }),
          el("nav", {
            className: "site-footer__nav",
            attrs: { "aria-label": "Navegacion secundaria" },
            children: [
              el("a", { text: "Planes", attrs: { href: "/planes/" } }),
              el("a", { text: "Sorteos", attrs: { href: "/sorteos/" } }),
              el("a", { text: "Adjudicados", attrs: { href: "/adjudicados/" } }),
              el("a", { text: "Recursos", attrs: { href: "/recursos/" } }),
              el("a", { text: "FAQ", attrs: { href: "/faq/" } }),
              el("a", { text: "Contacto", attrs: { href: "/contacto/?intent=asesoramiento" } }),
            ],
          }),
          el("p", {
            className: "site-footer__note",
            text:
              "Transparencia: la consulta o pre-solicitud desde este sitio no implica contratacion final. Los datos pendientes se muestran como informacion en actualizacion.",
          }),
        ],
      }),
    ],
  });
}

export function renderShell(site) {
  const headerSlot = qs("[data-site-header]");
  const footerSlot = qs("[data-site-footer]");

  if (headerSlot) headerSlot.replaceWith(createHeader(site));
  if (footerSlot) footerSlot.replaceWith(createFooter(site));
}
