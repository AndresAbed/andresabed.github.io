import { getSiteBasePath, normalizeInternalTarget, withSiteBasePath } from "../data/api.js";
import { el, qs } from "../utils/dom.js";
import { isBlank, isValidUrl } from "../utils/validators.js";

const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Planes", href: "/planes/" },
  { label: "Adjudicados", href: "/adjudicados/" },
  { label: "Cómo funciona", href: "/como-funciona/" },
];

function isCurrentPath(href) {
  const basePath = getSiteBasePath();
  const rawPath = window.location.pathname.replace(/index\.html$/, "");
  const current = basePath && rawPath.startsWith(`${basePath}/`) ? rawPath.slice(basePath.length) || "/" : rawPath;
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
          href: normalizeInternalTarget(item.href),
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
      el("span", { className: compact ? "site-header__whatsapp-text" : "", text: hasCtaTarget ? "Escribinos" : cta.label || "Consultar plan" }),
    ],
  });
}

function createBrandLogo({ logo, scrolledLogo }) {
  const defaultLogo = withSiteBasePath(logo);
  const nextScrolledLogo = withSiteBasePath(scrolledLogo || logo);

  return el("a", {
    className: "brand-lockup",
    attrs: { href: normalizeInternalTarget("/"), "aria-label": "Club San Jorge Capitalización y Ahorro - Inicio" },
    children: [
      logo
        ? el("img", {
            className: "brand-lockup__logo",
            attrs: {
              src: defaultLogo,
              alt: "Club San Jorge Capitalización y Ahorro",
              "data-logo-default": defaultLogo,
              "data-logo-scrolled": nextScrolledLogo,
            },
          })
        : null,
    ],
  });
}

function isExternalTarget(href) {
  if (String(href).startsWith("mailto:")) return false;
  if (!isValidUrl(href)) return false;
  return new URL(href, window.location.origin).origin !== window.location.origin;
}

function createFooterLink({ label, href, className }) {
  const target = normalizeInternalTarget(href);
  const valid = isValidUrl(target) || String(target).startsWith("mailto:");
  const external = valid && isExternalTarget(target);

  return el("a", {
    className,
    text: label,
    attrs: valid
      ? {
          href: target,
          target: external ? "_blank" : null,
          rel: external ? "noopener noreferrer" : null,
        }
      : {
          href: "#",
          "aria-disabled": "true",
        },
  });
}

function createFooterColumn({ title, links }) {
  return el("div", {
    className: "site-footer__column",
    children: [
      el("h2", { text: title }),
      el("ul", {
        className: "site-footer__link-list",
        children: links.map((link) =>
          el("li", {
            children: [createFooterLink(link)],
          }),
        ),
      }),
    ],
  });
}

function newsletterCopy(config) {
  const copy = config?.copy || {};
  return {
    title: copy.title || "Suscribite y recibí promos exclusivas",
    description: copy.description || "Recibí novedades y la información necesaria para dar tu próximo paso.",
    label: copy.label || "Correo electrónico",
    placeholder: copy.placeholder || "Ingresa tu correo electronico",
    button: copy.button || "Suscribite",
    submitting: copy.submitting || "Enviando...",
    success: copy.success || "Listo, ya estás en la lista de novedades.",
    error: copy.error || "No pudimos guardar el email. Revisalo e intentá de nuevo.",
    unavailable: copy.unavailable || "La suscripción por email todavía no está disponible.",
    consent: copy.consent || "Acepto recibir novedades por email. No implica una solicitud ni inscripción a un plan.",
    privacyNote: copy.privacyNote || "Podés darte de baja cuando quieras.",
  };
}

function setNewsletterState(form, state, message = "") {
  const status = form.querySelector("[data-newsletter-status]");
  const button = form.querySelector("button[type='submit']");
  const defaultText = button?.dataset.defaultText || "Recibir novedades";
  const submittingText = button?.dataset.submittingText || "Enviando...";

  form.dataset.newsletterState = state;
  if (status) {
    status.dataset.newsletterStatus = state;
    status.textContent = message;
  }
  if (button) {
    button.disabled = state === "submitting";
    button.textContent = state === "submitting" ? submittingText : defaultText;
  }
}

function submitNewsletterForm(form, config, copy) {
  const endpoint = String(config?.endpoint || "").trim();
  if (!config?.enabled || !endpoint || !isValidUrl(endpoint)) {
    setNewsletterState(form, "unavailable", copy.unavailable);
    return;
  }

  const emailField = form.elements.email;
  const email = String(emailField?.value || "").trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    emailField?.setAttribute("aria-invalid", "true");
    setNewsletterState(form, "error", "Ingresá un email válido.");
    emailField?.focus();
    return;
  }

  emailField?.removeAttribute("aria-invalid");
  setNewsletterState(form, "submitting", "");

  const body = new URLSearchParams({
    email,
    source: config.source || "footer_newsletter",
    page: window.location.href,
    consentText: copy.consent,
    website: String(form.elements.website?.value || ""),
  });

  fetch(endpoint, {
    method: config.method || "POST",
    mode: "no-cors",
    body,
  })
    .then(() => {
      form.reset();
      setNewsletterState(form, "success", copy.success);
    })
    .catch((error) => {
      console.warn("No se pudo enviar la suscripcion al newsletter.", error);
      setNewsletterState(form, "error", copy.error);
    });
}

function setupNewsletterForm(form, config, copy) {
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitNewsletterForm(form, config, copy);
  });
}

function createNewsletterBlock(newsletterConfig) {
  const config = newsletterConfig || {};
  const copy = newsletterCopy(config);
  const enabled = Boolean(config.enabled);

  const form = el("form", {
    className: "site-footer-newsletter__form",
    attrs: {
      "data-newsletter-form": "",
      novalidate: true,
    },
    children: [
      el("label", {
        className: "visually-hidden",
        text: copy.label,
        attrs: { for: "footer-newsletter-email" },
      }),
      el("div", {
        className: "site-footer-newsletter__control",
        children: [
          el("input", {
            attrs: {
              id: "footer-newsletter-email",
              name: "email",
              type: "email",
              inputmode: "email",
              autocomplete: "email",
              placeholder: copy.placeholder,
              required: true,
              disabled: enabled ? null : true,
              "aria-describedby": "footer-newsletter-status footer-newsletter-note",
            },
          }),
          el("button", {
            className: "site-footer-newsletter__button",
            text: copy.button,
            attrs: {
              type: "submit",
              disabled: enabled ? null : true,
              "data-default-text": copy.button,
              "data-submitting-text": copy.submitting,
            },
          }),
        ],
      }),
      el("input", {
        className: "site-footer-newsletter__trap",
        attrs: {
          name: "website",
          type: "text",
          tabindex: "-1",
          autocomplete: "off",
          "aria-hidden": "true",
        },
      }),
      el("p", {
        className: "site-footer-newsletter__note",
        attrs: { id: "footer-newsletter-note" },
        text: `${copy.consent} ${copy.privacyNote}`,
      }),
      el("p", {
        className: "site-footer-newsletter__status",
        attrs: { id: "footer-newsletter-status", "data-newsletter-status": enabled ? "idle" : "unavailable", "aria-live": "polite" },
        text: enabled ? "" : copy.unavailable,
      }),
    ],
  });

  setupNewsletterForm(form, config, copy);

  return el("section", {
    className: "container site-footer-newsletter",
    attrs: { "aria-labelledby": "site-footer-newsletter-title" },
    children: [
      el("div", {
        className: "site-footer-newsletter__copy",
        children: [
          el("img", {
            className: "site-footer-newsletter__icon",
            attrs: {
              src: withSiteBasePath("/assets/img/mail-icon.svg"),
              alt: "",
              "aria-hidden": "true",
            },
          }),
          el("h2", {
            attrs: { id: "site-footer-newsletter-title" },
            children: copy.title.split(" promos ").length === 2
              ? [
                  document.createTextNode(`${copy.title.split(" promos ")[0]} `),
                  el("br", { attrs: { "aria-hidden": "true" } }),
                  document.createTextNode(`promos ${copy.title.split(" promos ")[1]}`),
                ]
              : [document.createTextNode(copy.title)],
          }),
          el("p", { text: copy.description }),
        ],
      }),
      form,
    ],
  });
}

function createSocialLink({ label, href, icon }) {
  const target = normalizeInternalTarget(href);
  const valid = isValidUrl(target);
  const external = valid && isExternalTarget(target);

  return el("a", {
    className: `site-footer__social ${valid ? "" : "site-footer__social--disabled"}`,
    attrs: valid
      ? {
          href: target,
          target: external ? "_blank" : null,
          rel: external ? "noopener noreferrer" : null,
          "aria-label": label,
        }
      : {
          href: "#",
          "aria-label": `${label} en actualización`,
          "aria-disabled": "true",
          title: `${label} en actualización`,
        },
    children: [el("span", { className: "site-footer__social-icon", attrs: { "data-social": icon, "aria-hidden": "true" } })],
  });
}

function createHeader(site) {
  const cta = site?.cta?.primary || {};
  const target = normalizeInternalTarget(cta.target);
  const hasCtaTarget = isValidUrl(target);
  const logo = site?.brand?.navbarLogo || site?.brand?.officialLogo;
  const scrolledLogo = site?.brand?.navbarLogoScrolled || site?.brand?.logoVariants?.agenciasAbedColorIsoWhite || logo;

  const header = el("header", {
    className: "site-header",
    children: [
      el("div", {
        className: "container site-header__inner",
        children: [
          createBrandLogo({ logo, scrolledLogo }),
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
  setupHeaderScrollState(header);
  return fragment;
}

function setupHeaderScrollState(header) {
  const logo = header.querySelector(".brand-lockup__logo");
  const defaultLogo = logo?.dataset.logoDefault;
  const scrolledLogo = logo?.dataset.logoScrolled;

  const setScrolled = () => {
    const isScrolled = window.scrollY > 8;
    header.classList.toggle("site-header--scrolled", isScrolled);
    if (logo && defaultLogo && scrolledLogo) {
      const nextLogo = isScrolled ? scrolledLogo : defaultLogo;
      if (logo.getAttribute("src") !== nextLogo) logo.setAttribute("src", nextLogo);
    }
  };

  setScrolled();
  const syncScrolled = () => window.requestAnimationFrame(setScrolled);
  window.addEventListener("scroll", syncScrolled, { passive: true });
  document.addEventListener("scroll", syncScrolled, { passive: true });
  window.addEventListener("wheel", syncScrolled, { passive: true });
  window.addEventListener("touchmove", syncScrolled, { passive: true });
  window.addEventListener("resize", syncScrolled, { passive: true });
  window.setInterval(setScrolled, 120);
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

function createFooter(site, agencyContact = {}) {
  const legal = site?.legal || {};
  const agency = site?.agency || {};
  const newsletterConfig = agencyContact?.newsletterForm || {};
  const cta = site?.cta?.primary || {};
  const whatsappTarget = normalizeInternalTarget(cta.target);
  const hasWhatsapp = isValidUrl(whatsappTarget);
  const email = agency.contactEmail;
  const hasEmail = !isBlank(email);
  const footerLogo = site?.brand?.logoVariants?.footerVerticalColor || site?.brand?.navbarLogoScrolled || site?.brand?.officialLogo;
  const year = new Date().getFullYear();

  const mainLinks = [
    { label: "Inicio", href: "/" },
    { label: "Planes", href: "/planes/" },
    { label: "Adjudicados", href: "/adjudicados/" },
    { label: "Cómo funciona", href: "/como-funciona/" },
    { label: "Privacidad", href: "/privacidad/" },
  ];

  const subscriberLinks = [
    { label: "Pagá tu boleta", href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/paga-tu-cuota" },
    { label: "Descargá tu boleta", href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/boleta_de_pago" },
    { label: "Medios de pago", href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/medios-de-pago" },
    { label: "Débito automático", href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/debito-automatico-cya" },
    { label: "Boleta digital", href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/adherite-a-la-boleta-digital" },
  ];

  return el("footer", {
    className: "site-footer",
    children: [
      el("div", {
        className: "site-footer__brand-line",
        attrs: { "aria-hidden": "true" },
      }),
      createNewsletterBlock(newsletterConfig),
      el("div", {
        className: "container site-footer__inner",
        children: [
          el("div", {
            className: "site-footer__brand",
            children: [
              footerLogo
                ? el("img", {
                    className: "site-footer__logo",
                    attrs: {
                      src: withSiteBasePath(footerLogo),
                      alt: agency.displayLockup || "Club San Jorge | Agencias Abed",
                    },
                  })
                : el("strong", { text: agency.displayLockup || "Club San Jorge | Agencias Abed" }),
            ],
          }),
          createFooterColumn({ title: "Sitio", links: mainLinks }),
          createFooterColumn({ title: "Gestiones", links: subscriberLinks }),
          el("div", {
            className: "site-footer__contact",
            children: [
              el("h2", { text: "Contacto" }),
              el("div", {
                className: "site-footer__contact-list",
                children: [
                  el("div", {
                    className: "site-footer__contact-item",
                    children: [
                      el("span", { text: "Email" }),
                      hasEmail
                        ? createFooterLink({
                            label: email,
                            href: `mailto:${email}`,
                          })
                        : el("p", { text: "Email en actualización" }),
                    ],
                  }),
                ],
              }),
              el("div", {
                className: "site-footer__socials",
                attrs: { "aria-label": "Redes sociales" },
                children: [
                  createSocialLink({ label: "Instagram", href: agency.instagramUrl, icon: "instagram" }),
                  createSocialLink({ label: "Facebook", href: agency.facebookUrl, icon: "facebook" }),
                  createSocialLink({ label: "YouTube", href: agency.youtubeUrl, icon: "youtube" }),
                  createSocialLink({ label: "WhatsApp", href: hasWhatsapp ? whatsappTarget : "", icon: "whatsapp" }),
                ],
              }),
            ],
          }),
        ],
      }),
      el("div", {
        className: "container site-footer__bottom",
        children: [
          el("p", {
            className: "site-footer__copyright",
            text: `© ${year} ${agency.displayLockup || "Club San Jorge | Agencias Abed"}.`,
          }),
          el("p", {
            className: "site-footer__legal",
            text:
              legal.disclaimerText ||
              "La información publicada es orientativa y puede actualizarse según las condiciones vigentes de Club San Jorge.",
          }),
        ],
      }),
    ],
  });
}

export function renderShell(site, agencyContact) {
  const headerSlot = qs("[data-site-header]");
  const footerSlot = qs("[data-site-footer]");

  if (headerSlot) headerSlot.replaceWith(createHeader(site));
  if (footerSlot) footerSlot.replaceWith(createFooter(site, agencyContact));
}
