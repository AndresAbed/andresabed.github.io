import { normalizeInternalTarget } from "../data/api.js";
import { el, qs } from "../utils/dom.js";
import { isValidUrl } from "../utils/validators.js";

const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Planes", href: "/planes/" },
  { label: "Adjudicados", href: "/adjudicados/" },
  { label: "FAQ", href: "/faq/" },
  { label: "Contacto", href: "/contacto/" },
];

function isCurrentPath(href) {
  const current = window.location.pathname.replace(/index\.html$/, "");
  return current === href || (href !== "/" && current.startsWith(href));
}

function createNav({ className = "site-nav", label = "Navegacion principal" } = {}) {
  return el("nav", {
    className,
    attrs: { "aria-label": label },
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

function createMenuButton({ className = "site-header__menu-button", label = "Abrir menú" } = {}) {
  return el("button", {
    className,
    attrs: { type: "button", "aria-label": label },
    children: [
      el("span", { className: "site-header__menu-icon", attrs: { "aria-hidden": "true" } }),
      el("span", { text: "Menú" }),
    ],
  });
}

function createWhatsappLink({ hasCtaTarget, target, cta, compact = false }) {
  return el("a", {
    className: `button ${hasCtaTarget ? "site-header__whatsapp" : "button--disabled"} ${compact ? "site-header__whatsapp--compact" : ""}`,
    attrs: hasCtaTarget
      ? { href: target, "aria-label": cta.label || "Hablar por WhatsApp" }
      : { href: "#", "aria-disabled": "true", title: "Canal en configuracion" },
    children: [
      hasCtaTarget ? el("span", { className: "site-header__whatsapp-icon", attrs: { "aria-hidden": "true" } }) : null,
      el("span", { className: compact ? "site-header__whatsapp-text" : "", text: hasCtaTarget ? "WhatsApp" : cta.label || "Consultar plan" }),
    ],
  });
}

function createBrandLogo(officialLogo) {
  return el("a", {
    className: "brand-lockup",
    attrs: { href: "/", "aria-label": "Club San Jorge Capitalización y Ahorro - Inicio" },
    children: [
      officialLogo
        ? el("img", {
            className: "brand-lockup__logo",
            attrs: { src: officialLogo, alt: "Club San Jorge Capitalización y Ahorro" },
          })
        : null,
    ],
  });
}

function createHeader(site) {
  const cta = site?.cta?.primary || {};
  const target = normalizeInternalTarget(cta.target);
  const hasCtaTarget = isValidUrl(target);
  const officialLogo = site?.brand?.navbarLogo || site?.brand?.officialLogo;

  const header = el("header", {
    className: "site-header",
    children: [
      el("div", {
        className: "container site-header__inner",
        children: [
          createBrandLogo(officialLogo),
          el("div", {
            className: "site-header__desktop",
            children: [
              el("div", {
                className: "site-header__nav-shell",
                children: [createNav()],
              }),
              el("div", {
                className: "site-header__actions",
                children: [createWhatsappLink({ hasCtaTarget, target, cta })],
              }),
            ],
          }),
          el("div", {
            className: "site-header__mobile-actions",
            children: [
              createWhatsappLink({ hasCtaTarget, target, cta, compact: true }),
              createMenuButton(),
            ],
          }),
        ],
      }),
    ],
  });

  const overlay = el("div", { className: "site-menu-overlay", attrs: { "aria-hidden": "true" } });
  const drawer = el("aside", {
    className: "site-menu-drawer",
    attrs: { id: "site-menu-drawer", "aria-label": "Menú de navegación" },
    children: [
      el("div", {
        className: "site-header__drawer-head",
        children: [
          el("span", { className: "site-header__drawer-title", text: "Menú" }),
          el("button", { className: "site-header__drawer-close", text: "Cerrar", attrs: { type: "button", "aria-label": "Cerrar menú" } }),
        ],
      }),
      createNav({ className: "site-drawer-nav", label: "Navegacion mobile" }),
      el("div", {
        className: "site-header__drawer-cta",
        children: [
          el("span", { text: "Atención comercial" }),
          el("p", { text: "Consultá por nuestros planes y recibí asesoramiento personalizado." }),
          createWhatsappLink({ hasCtaTarget, target, cta }),
        ],
      }),
    ],
  });
  const menuLayer = el("div", {
    className: "site-menu-layer",
    children: [overlay, drawer],
  });

  const fragment = document.createDocumentFragment();
  fragment.append(header, menuLayer);
  setupHeaderMenu({ header, overlay, drawer });
  return fragment;
}

function setupHeaderMenu({ header, overlay, drawer }) {
  const button = header.querySelector(".site-header__menu-button");
  const closeButton = drawer.querySelector(".site-header__drawer-close");
  const desktopQuery = window.matchMedia("(min-width: 981px)");
  if (!button || !overlay || !drawer || !closeButton) return;

  button.setAttribute("aria-controls", drawer.id);
  button.setAttribute("aria-expanded", "false");

  const setOpen = (open) => {
    header.dataset.menuOpen = open ? "true" : "false";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("site-menu-open", open);
    if (open) window.requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
  };

  button.addEventListener("click", () => {
    setOpen(header.dataset.menuOpen !== "true");
  });

  overlay.addEventListener("click", () => setOpen(false));
  closeButton.addEventListener("click", () => setOpen(false));

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const handleDesktopChange = (event) => {
    if (event.matches) setOpen(false);
  };

  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleDesktopChange);
  } else {
    desktopQuery.addListener(handleDesktopChange);
  }
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
              el("a", { text: "Adjudicados", attrs: { href: "/adjudicados/" } }),
              el("a", { text: "FAQ", attrs: { href: "/faq/" } }),
              el("a", { text: "Contacto", attrs: { href: "/contacto/?intent=consulta" } }),
            ],
          }),
          el("p", {
            className: "site-footer__note",
            text:
              "Transparencia: la consulta desde este sitio no implica contratacion final. Los datos pendientes se muestran como informacion en actualizacion.",
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
