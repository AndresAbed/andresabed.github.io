import {
  getCatalogCategories,
  getCatalogItemsByCategory,
  getFaqById,
  getResourcesByGroup,
  loadAllForHome,
  normalizeInternalTarget,
} from "../data/api.js";
import { classifyLinkItem } from "../data/validators.js";
import { categoryHref, createButton, createMiniFact } from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue, isMockStatus, isValidUrl } from "../utils/validators.js";

const HOME_FAQ_IDS = [
  "como-se-realizan-los-sorteos-mensuales",
  "que-se-obtiene-al-final-del-plan-330",
  "si-salgo-adjudicado-debo-seguir-pagando",
];

function getPrimaryCta(site) {
  const cta = site?.cta?.primary;
  return {
    label: cta?.label || "Hablar por WhatsApp",
    href: normalizeInternalTarget(cta?.target) || "/contacto/?intent=consulta",
  };
}

function getSecondaryCta(site) {
  const cta = site?.cta?.secondary;
  return {
    label: cta?.label || "Completar formulario",
    href: normalizeInternalTarget(cta?.target) || "/contacto/?intent=consulta",
  };
}

function getCategoryStats(planCatalog, category) {
  const items = getCatalogItemsByCategory(planCatalog, category.slug);
  const leadItem = items.find((item) => item.imageUrl) || items[0];

  return {
    items,
    leadItem,
  };
}

function getResource(resources, id) {
  return (resources.groups || []).flatMap((group) => group.items || []).find((item) => item.id === id) || null;
}

function createHomeSectionHeader({ eyebrow, title, intro, id, align = "start" }) {
  return el("div", {
    className: `home-section-header home-section-header--${align}`,
    children: [
      eyebrow ? el("span", { className: "home-eyebrow", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

function createPlanVisual(item, className = "home-plan-visual") {
  if (!item?.imageUrl) return null;

  return el("img", {
    className,
    attrs: {
      src: item.imageUrl,
      alt: item.imageAlt || item.displayName,
      loading: "lazy",
    },
  });
}

function getHeroVideo(videosData) {
  return (
    (videosData?.items || []).find((item) => item.id === "hero-capitalizacion-ahorro") ||
    (videosData?.items || []).find((item) => item.youtubeUrl) ||
    null
  );
}

function formatDrawDate(rawDate) {
  const value = String(rawDate || "").trim();
  const badgeMatch = value.match(/\bLOTBA\b/i);

  return {
    date: value.replace(/\s*\bLOTBA\b\s*/i, "").trim(),
    badge: badgeMatch ? badgeMatch[0].toUpperCase() : "",
  };
}

function getHeroStats(site) {
  const priority = ["Suscriptores", "Adjudicados", "Trayectoria"];
  const stats = site.club?.stats || [];

  return priority.map((label) => stats.find((item) => item.label === label)).filter(Boolean);
}

function createHeroStat(item) {
  return el("article", {
    className: "home-hero-stat",
    children: [
      el("span", {
        className: `home-hero-stat__icon home-hero-stat__icon--${item.icon || "stat"}`,
        attrs: { "aria-hidden": "true" },
      }),
      el("strong", { text: item.value }),
      el("span", { text: item.label }),
    ],
  });
}

function withAutoplay(url) {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}autoplay=1&rel=0`;
}

function setupHeroVideoModal({ trigger, modal, frame, closeButton, video }) {
  if (!trigger || !modal || !frame || !closeButton || !video?.youtubeUrl) return;

  let previousFocus = null;

  const setOpen = (open) => {
    modal.dataset.open = open ? "true" : "false";
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("site-video-open", open);

    if (open) {
      previousFocus = document.activeElement;
      closeButton.removeAttribute("tabindex");
      frame.setAttribute("tabindex", "0");
      frame.setAttribute("src", withAutoplay(video.youtubeUrl));
      window.requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
    } else {
      frame.removeAttribute("src");
      frame.setAttribute("tabindex", "-1");
      closeButton.setAttribute("tabindex", "-1");
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus({ preventScroll: true });
      }
    }
  };

  trigger.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.dataset.open !== "true") return;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Tab") {
      const focusable = [closeButton, frame];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function createHeroVideo(video) {
  if (!video?.youtubeUrl) return null;

  const modalId = "hero-video-modal";
  const titleId = "hero-video-title";
  const trigger = el("button", {
    className: "home-hero-video__trigger",
    attrs: {
      type: "button",
      "aria-controls": modalId,
      "aria-expanded": "false",
    },
    children: [
      el("span", { className: "home-hero-video__play", attrs: { "aria-hidden": "true" } }),
      el("span", {
        className: "home-hero-video__text",
        children: [
          el("strong", { text: "Vos también podés ser el próximo" }),
          el("small", { text: "Conocé cómo funciona Club San Jorge" }),
        ],
      }),
    ],
  });
  const frame = el("iframe", {
    attrs: {
      title: video.title || "Video de Club San Jorge Capitalización y Ahorro",
      loading: "lazy",
      tabindex: "-1",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      referrerpolicy: "strict-origin-when-cross-origin",
      allowfullscreen: true,
    },
  });
  const closeButton = el("button", {
    className: "home-hero-video-modal__close",
    text: "Cerrar",
    attrs: { type: "button", "aria-label": "Cerrar video", tabindex: "-1" },
  });
  const modal = el("div", {
    className: "home-hero-video-modal",
    attrs: {
      id: modalId,
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": "true",
      "aria-labelledby": titleId,
      "data-open": "false",
    },
    children: [
      el("div", {
        className: "home-hero-video-modal__panel",
        children: [
          el("div", {
            className: "home-hero-video-modal__head",
            children: [
              el("h2", { text: video.title || "Club San Jorge", attrs: { id: titleId } }),
              closeButton,
            ],
          }),
          el("div", {
            className: "home-hero-video-modal__frame",
            children: [frame],
          }),
        ],
      }),
    ],
  });

  const videoBlock = el("article", {
    className: "home-hero-video",
    children: [trigger],
  });

  document.getElementById(modalId)?.remove();
  document.body.append(modal);
  setupHeroVideoModal({ trigger, modal, frame, closeButton, video });

  return videoBlock;
}

function createHeroDraws(draws, primaryCta) {
  const stimuli = (draws?.stimuli || []).sort((a, b) => (a.position || 0) - (b.position || 0)).slice(0, 3);
  const lastState = resolveValueState(draws?.lastDraw?.date, draws?.lastDraw?.status);
  const nextState = resolveValueState(draws?.nextDraw?.date, draws?.nextDraw?.status);
  const lastDrawDate = formatDrawDate(draws?.lastDraw?.date);
  const nextDrawDate = formatDrawDate(draws?.nextDraw?.date);
  const drawBadge = lastDrawDate.badge || nextDrawDate.badge;

  return el("article", {
    className: "home-hero-drawcard",
    attrs: { "aria-label": "Información de sorteos Club San Jorge" },
    children: [
      el("div", {
        className: "home-hero-drawcard__last",
        attrs: { "data-state": lastState },
        children: [
          drawBadge ? el("span", { className: "home-hero-drawcard__badge", text: drawBadge }) : null,
          el("div", {
            className: "home-hero-drawcard__head",
            children: [
              el("div", {
                className: "home-hero-drawcard__title",
                children: [el("span", { text: "Último sorteo" })],
              }),
              el("strong", {
                className: "home-hero-drawcard__last-date",
                text: lastDrawDate.date || FALLBACK_TEXT.updating,
              }),
            ],
          }),
          el("div", {
            className: "home-hero-drawcard__numbers",
            children: stimuli.map((item) =>
              el("div", {
                className: "home-hero-drawcard__number",
                attrs: {
                  "data-state": resolveValueState(item.winningNumber, item.status),
                  title: item.label,
                },
                children: [
                  el("strong", { text: item.winningNumber || FALLBACK_TEXT.updating }),
                  el("span", { text: item.label }),
                ],
              }),
            ),
          }),
        ],
      }),
      el("div", {
        className: "home-hero-drawcard__next",
        children: [
          el("div", {
            className: "home-hero-drawcard__date",
            attrs: { "data-state": nextState },
            children: [
              el("span", { text: "Próximo sorteo" }),
              el("strong", { text: nextDrawDate.date || FALLBACK_TEXT.updating }),
            ],
          }),
          el("div", {
            className: "home-hero-drawcard__actions",
            children: [
              createButton({ label: "Quiero mi plan", href: primaryCta.href, variant: "primary" }),
              el("a", {
                className: "button button--secondary home-hero-drawcard__payment",
                text: "Pagá tu boleta",
                attrs: {
                  href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/paga-tu-cuota",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const CATEGORY_CARD_IMAGES = Object.freeze({
  autos: {
    imageUrl: "/assets/img/plans/plan-auto-hilux-cronos.png",
    imageAlt: "Auto y camioneta disponibles en planes Club San Jorge",
  },
  motos: {
    imageUrl: "/assets/img/plans/plan-moto-honda-xr-cb.png",
    imageAlt: "Motos disponibles en planes Club San Jorge",
  },
  dinero: {
    imageUrl: "/assets/img/plans/plan-dinero-billetes.png",
    imageAlt: "Billetes representando capital en dinero",
  },
});

function renderHero(data) {
  const target = qs("[data-home-hero]");
  if (!target) return;

  const { site, draws, videos } = data;
  const stats = getHeroStats(site);
  const video = getHeroVideo(videos);
  const primaryCta = getPrimaryCta(site);
  const headline = site.club?.headline || "Suscribite, ahorrá y ganá";

  clear(target);
  target.append(
    el("div", {
      className: "container home-hero-v5",
      children: [
        el("div", {
          className: "home-hero-v5__intro",
          children: [
            el("div", {
              className: "home-hero-v5__copy",
              children: [
                el("h1", {
                  attrs: { id: "home-title" },
                  text: headline.toLocaleUpperCase("es-AR"),
                }),
                el("p", {
                  className: "home-hero-v5__lead",
                  children: [
                    "Cuota a cuota vas formando tu ahorro y participás todos los meses por ",
                    el("strong", {
                      text: "adjudicaciones que pueden acercarte a tu auto, tu moto o capital en dinero.",
                    }),
                  ],
                }),
                el("div", {
                  className: "home-hero-v5__actions",
                  children: [
                    createButton({ label: "Ver planes", href: "/planes/", variant: "primary" }),
                    createButton({ label: "Cómo funciona", href: "/preguntas-frecuentes/", variant: "green" }),
                  ],
                }),
                createHeroVideo(video),
              ],
            }),
            createHeroDraws(draws, primaryCta),
          ],
        }),
      ],
    }),
    el("div", {
      className: "home-hero-stats-band",
      children: [
        el("div", {
          className: "container home-hero-v5__proof",
          attrs: { "aria-label": "Números de confianza" },
          children: stats.map(createHeroStat),
        }),
      ],
    }),
  );
}

function renderPlanRoutes(data) {
  const target = qs("[data-trust-section]");
  if (!target) return;

  const preferredOrder = ["motos", "autos", "dinero"];
  const categories = [...getCatalogCategories(data.planCatalog)].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.slug);
    const bIndex = preferredOrder.indexOf(b.slug);
    return (aIndex === -1 ? preferredOrder.length : aIndex) - (bIndex === -1 ? preferredOrder.length : bIndex);
  });
  const copy = {
    autos: {
      title: "Plan Auto",
      body: "Opciones para auto o utilitario, pensadas para quienes quieren planificar su próximo vehículo.",
      cta: "Ver planes",
    },
    motos: {
      title: "Plan Moto",
      body: "Acercate a tu moto con una alternativa de ahorro clara, accesible y acompañada desde el primer paso.",
      cta: "Ver planes",
    },
    dinero: {
      title: "Plan Dinero",
      body: "Formá capital para tus proyectos con opciones pensadas para ahorrar de manera ordenada.",
      cta: "Ver planes",
    },
  };

  clear(target);
  target.append(
    createHomeSectionHeader({
      eyebrow: "Con nosotros podés",
      title: "Elegí el plan a tu medida",
      id: "category-entry-title",
      intro: "Conocé todas las opciones que Club San Jorge tiene para vos.",
      align: "center",
    }),
    el("div", {
      className: "home-plan-routes",
      children: categories.map((category) => {
        const stats = getCategoryStats(data.planCatalog, category);
        const content = copy[category.slug] || {
          title: category.label,
          body: category.summary || category.description,
          cta: "Ver planes",
        };
        const image = CATEGORY_CARD_IMAGES[category.slug] || stats.leadItem;

        return el("article", {
          className: `home-route-card home-route-card--${category.theme || "default"}`,
          children: [
            el("div", {
              className: "home-route-card__media",
              children: [createPlanVisual(image, "home-route-card__image")],
            }),
            el("div", {
              className: "home-route-card__body",
              children: [
                el("h3", { text: content.title }),
                el("p", { text: content.body }),
                el("div", {
                  className: "home-route-card__action",
                  children: [
                    createButton({ label: content.cta, href: categoryHref(category.slug), variant: "secondary" }),
                  ],
                }),
              ],
            }),
          ],
        });
      }),
    }),
  );
}

function scrollAdjudications(track, direction) {
  if (!track) return;
  const card = track.querySelector(".home-adjudication-card");
  const gap = 24;
  const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.86;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const tolerance = 8;

  if (direction > 0 && track.scrollLeft >= maxScroll - tolerance) {
    track.scrollTo({ left: 0, behavior: "smooth" });
    return;
  }

  if (direction < 0 && track.scrollLeft <= tolerance) {
    track.scrollTo({ left: maxScroll, behavior: "smooth" });
    return;
  }

  track.scrollBy({ left: direction * step, behavior: "smooth" });
}

function scrollSocialReviews(track, direction) {
  if (!track) return;
  const card = track.querySelector(".home-social-review");
  const gap = 24;
  const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.82;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const tolerance = 8;

  if (direction > 0 && track.scrollLeft >= maxScroll - tolerance) {
    track.scrollTo({ left: 0, behavior: "smooth" });
    return;
  }

  if (direction < 0 && track.scrollLeft <= tolerance) {
    track.scrollTo({ left: maxScroll, behavior: "smooth" });
    return;
  }

  track.scrollBy({ left: direction * step, behavior: "smooth" });
}

function updateSocialReviewProgress(track, progress) {
  if (!track || !progress) return;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
  progress.style.setProperty("--review-progress", String(Math.min(1, Math.max(0, ratio))));
}

function createAdjudicationCard(item) {
  return el("article", {
    className: "home-adjudication-card",
    children: [
      el("div", {
        className: "home-adjudication-card__media",
        children: [
          el("img", {
            attrs: {
              src: item.imageUrl,
              alt: item.imageAlt || `Entrega de adjudicación de ${item.name}`,
              loading: "lazy",
            },
          }),
        ],
      }),
      el("div", {
        className: "home-adjudication-card__body",
        children: [
          el("div", {
            className: "home-adjudication-card__meta",
            children: [
              el("span", { className: "home-adjudication-card__installment", text: `Cuota ${item.installment}` }),
              el("span", { className: "home-adjudication-card__date", text: item.drawDate }),
            ],
          }),
          el("h3", { text: item.name }),
          el("dl", {
            className: "home-adjudication-card__facts",
            children: [
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--prize",
                children: [el("dt", { text: "Premio" }), el("dd", { text: item.prize })],
              }),
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--place",
                children: [el("dt", { text: "Residencia" }), el("dd", { text: item.residence })],
              }),
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--date",
                children: [el("dt", { text: "Fecha de sorteo" }), el("dd", { text: `Sorteo del ${item.drawDate}` })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function renderHomeAdjudications(data) {
  const target = qs("[data-home-adjudications]");
  if (!target) return;

  const adjudications = data.homeAdjudications || {};
  const items = adjudications.items || [];
  const section = adjudications.section || {};
  if (!items.length) return;

  const trackId = "home-adjudications-track";
  const track = el("div", {
    className: "home-adjudications__track",
    attrs: { id: trackId, tabindex: "0" },
    children: items.map(createAdjudicationCard),
  });

  clear(target);
  target.append(
    el("div", {
      className: "home-adjudications",
      children: [
        el("div", {
          className: "home-adjudications__head",
          children: [
            createHomeSectionHeader({
              eyebrow: section.eyebrow || "Adjudicados",
              title: section.title || "Conocé a nuestros adjudicados",
              id: "home-adjudications-title",
              intro: section.intro || "",
              align: "center",
            }),
          ],
        }),
        el("div", {
          className: "home-adjudications__viewport",
          children: [
            el("button", {
              className: "home-adjudications__control home-adjudications__control--prev",
              text: "Anterior",
              attrs: { type: "button", "aria-controls": trackId },
            }),
            track,
            el("button", {
              className: "home-adjudications__control home-adjudications__control--next",
              text: "Siguiente",
              attrs: { type: "button", "aria-controls": trackId },
            }),
          ],
        }),
        el("div", {
          className: "home-adjudications__footer",
          children: [
            createButton({
              label: section.cta?.label || "Ver más adjudicados",
              href: section.cta?.href || "/adjudicados/",
              variant: "primary",
            }),
          ],
        }),
      ],
    }),
  );

  target.querySelector(".home-adjudications__control--prev")?.addEventListener("click", () => scrollAdjudications(track, -1));
  target.querySelector(".home-adjudications__control--next")?.addEventListener("click", () => scrollAdjudications(track, 1));
}

function createSocialReviewCard(item, index) {
  const source = item.source || "social";
  const avatar = item.avatar === "male" ? "male" : "female";

  return el("article", {
    className: `home-social-review ${index === 0 ? "home-social-review--featured" : ""}`,
    children: [
      el("div", {
        className: "home-social-review__bubble",
        children: [
          el("span", {
            className: `home-social-review__network home-social-review__network--${source}`,
            attrs: { role: "img", "aria-label": item.sourceLabel || "Red social" },
          }),
          el("blockquote", {
            attrs: { cite: item.sourceLabel || undefined },
            children: [el("p", { text: item.quote })],
          }),
        ],
      }),
      el("div", {
        className: "home-social-review__head",
        children: [
          el("span", {
            className: `home-social-review__avatar home-social-review__avatar--${avatar}`,
            attrs: { "aria-hidden": "true" },
          }),
          el("div", {
            className: "home-social-review__person",
            children: [
              el("h3", { text: item.name }),
              el("span", {
                className: "home-social-review__tag",
                text: "Cliente adjudicado",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function renderSocialReviews(data) {
  const target = qs("[data-social-reviews]");
  if (!target) return;

  const section = data.socialReviews?.section || {};
  const items = data.socialReviews?.items || [];
  if (!items.length) return;
  const trackId = "home-social-reviews-track";
  const track = el("div", {
    id: trackId,
    className: "home-social-proof__track",
    attrs: { tabindex: "0", "aria-label": "Opiniones de clientes" },
    children: items.map(createSocialReviewCard),
  });

  clear(target);
  target.append(
    el("div", {
      className: "home-social-proof",
      children: [
        createHomeSectionHeader({
          eyebrow: section.eyebrow || "Opiniones",
          title: section.title || "Experiencias compartidas",
          id: "home-social-reviews-title",
          intro: section.intro || "Descubrí lo que nuestros clientes tienen para decir",
          align: "center",
        }),
        el("div", {
          className: "home-social-proof__showcase",
          children: [
            el("aside", {
              className: "home-social-proof__panel",
              children: [
                el("span", {
                  className: "home-social-proof__quote",
                  attrs: { "aria-hidden": "true" },
                }),
                el("h3", { text: "Lo que comparten nuestros clientes" }),
                el("p", {
                  text: "Personas que ya vivieron la experiencia Club San Jorge",
                }),
                el("div", {
                  className: "home-social-proof__controls",
                  children: [
                    el("button", {
                      className: "home-social-proof__control home-social-proof__control--prev",
                      text: "←",
                      attrs: { type: "button", "aria-controls": trackId, "aria-label": "Ver opinión anterior" },
                    }),
                    el("span", {
                      className: "home-social-proof__progress",
                      attrs: { "aria-hidden": "true" },
                    }),
                    el("button", {
                      className: "home-social-proof__control home-social-proof__control--next",
                      text: "→",
                      attrs: { type: "button", "aria-controls": trackId, "aria-label": "Ver opinión siguiente" },
                    }),
                  ],
                }),
              ],
            }),
            track,
          ],
        }),
      ],
    }),
  );

  const progress = target.querySelector(".home-social-proof__progress");
  let progressFrame = null;
  const syncProgress = () => {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    progressFrame = requestAnimationFrame(() => updateSocialReviewProgress(track, progress));
  };

  updateSocialReviewProgress(track, progress);
  track.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("resize", syncProgress);
  target.querySelector(".home-social-proof__control--prev")?.addEventListener("click", () => scrollSocialReviews(track, -1));
  target.querySelector(".home-social-proof__control--next")?.addEventListener("click", () => scrollSocialReviews(track, 1));
}

function renderHowItWorks(data) {
  const target = qs("[data-how-it-works]");
  if (!target) return;

  const steps = [
    {
      title: "Elegís un plan y comenzás a pagar",
      body: "Podés suscribirte a una opción de auto, moto o dinero. Cada plan tiene valor nominal, plazo y cuota mensual según sus condiciones.",
    },
    {
      title: "Con cada cuota formás capital",
      body:
        "Las cuotas se destinan a la formación del capital del plan. Si tu título está vigente y al día, participás de los sorteos mensuales del sistema.",
    },
    {
      title: "Si tu título resulta favorecido, se aplican las condiciones del plan",
      body:
        "La adjudicación o estímulo depende de la modalidad del plan y de la documentación vigente. Por eso es importante revisar bien las condiciones antes de suscribirte.",
    },
    {
      title: "Al finalizar el plazo, el plan alcanza su objetivo de capitalización",
      body:
        "El objetivo del contrato es formar capital equivalente al valor nominal del título según las condiciones vigentes del plan.",
    },
  ];
  const clarifications = [
    {
      title: "Planes 330 no amortizantes",
      body:
        "En los planes de 330 cuotas, si un título resulta favorecido por sorteo, el plan continúa vigente a todos sus efectos.",
    },
    {
      title: "Podés volver a resultar favorecido",
      body: "Si seguís pagando normalmente y tu número vuelve a salir, puede volver a resultar favorecido.",
    },
    {
      title: "Rescate según avance del plan",
      body:
        "El rescate no aplica desde el inicio: en los planes 330 puede solicitarse desde la cuota 18, según condiciones vigentes.",
    },
    {
      title: "Cuota y valor nominal",
      body:
        "La cuota depende del plan y del valor nominal. En algunos casos puede existir endoso de ampliación automática para actualizar bien o valor.",
    },
  ];
  const primaryCta = getPrimaryCta(data.site);

  clear(target);
  target.append(
    el("div", {
      className: "home-process",
      children: [
        el("section", {
          className: "home-process__system",
          attrs: { "aria-labelledby": "how-title" },
          children: [
            createHomeSectionHeader({
              eyebrow: "Cómo funciona",
              title: "Entendé cómo funciona el sistema antes de elegir tu plan",
              id: "how-title",
              intro:
                "Los planes de Club San Jorge combinan pago de cuotas, formación de capital y participación en sorteos mensuales. Antes de suscribirte, conviene entender qué pagás, cómo participa tu título y qué ocurre si resulta favorecido.",
            }),
            el("ol", {
              className: "home-step-list",
              children: steps.map((step, index) =>
                el("li", {
                  className: "home-step",
                  children: [
                    el("span", { className: "home-step__number", text: String(index + 1).padStart(2, "0") }),
                    el("div", {
                      className: "home-step__copy",
                      children: [
                        el("h3", { text: step.title }),
                        el("p", { text: step.body }),
                      ],
                    }),
                  ],
                }),
              ),
            }),
          ],
        }),
        el("section", {
          className: "home-process__before",
          attrs: { "aria-labelledby": "before-title" },
          children: [
            el("div", {
              className: "home-process__before-head",
              children: [
                el("span", { className: "home-eyebrow", text: "Antes de elegir" }),
                el("h3", { attrs: { id: "before-title" }, text: "Antes de suscribirte, hay algunos puntos que conviene tener claros" }),
                el("p", {
                  text: "Son detalles importantes para comparar planes con más criterio y avanzar con una consulta mejor orientada.",
                }),
              ],
            }),
            el("div", {
              className: "home-process__note-grid",
              children: clarifications.map((item, index) =>
                el("article", {
                  className: "home-process__note",
                  children: [
                    el("span", { className: "home-process__note-mark", text: String(index + 1).padStart(2, "0") }),
                    el("div", {
                      children: [
                        el("h4", { text: item.title }),
                        el("p", { text: item.body }),
                      ],
                    }),
                  ],
                }),
              ),
            }),
            el("div", {
              className: "home-process__actions",
              children: [
                createButton({ label: "Ver preguntas frecuentes", href: "/preguntas-frecuentes/", variant: "secondary" }),
                createButton({ label: "Consultar por un plan", href: primaryCta.href, variant: "primary" }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
}

function renderAgencyValue(data) {
  const target = qs("[data-featured-plans]");
  if (!target) return;

  const primaryCta = getPrimaryCta(data.site);
  const values = [
    ["Información ordenada", "Te mostramos rubro, cuota, valor nominal y chances sin obligarte a recorrer todo el catálogo."],
    ["Atención comercial", "Agencias Abed continúa la consulta por WhatsApp o formulario, según el canal que prefieras."],
    ["Decisión más clara", "Si todavía no sabés qué plan elegir, podés consultar por objetivo y recibir orientación inicial."],
  ];

  clear(target);
  target.append(
    el("div", {
      className: "home-agency-block",
      children: [
        el("div", {
          className: "home-agency-block__copy",
          children: [
            createHomeSectionHeader({
              eyebrow: data.site.agency?.name || "Agencias Abed",
              title: "Atención comercial para consultar con más claridad",
              id: "plans-title",
              intro:
                "La página está pensada para que puedas entender las opciones principales y continuar la consulta con datos concretos.",
            }),
            el("div", {
              className: "home-action-row",
              children: [
                createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
                createButton({ label: "Completar formulario", href: "/contacto/?intent=consulta", variant: "secondary" }),
              ],
            }),
          ],
        }),
        el("div", {
          className: "home-value-grid",
          children: values.map(([title, body]) =>
            el("article", {
              className: "home-value-card",
              children: [el("h3", { text: title }), el("p", { text: body })],
            }),
          ),
        }),
      ],
    }),
  );
}

function renderTrust(data) {
  const target = qs("[data-resources-hub]");
  if (!target) return;

  const stats = (data.site.club?.stats || []).filter((item) => item.status === "verified");

  clear(target);
  target.append(
    el("div", {
      className: "home-trust-v5",
      children: [
        el("div", {
          className: "home-trust-v5__copy",
          children: [
            el("span", { className: "home-eyebrow", text: "Respaldo institucional" }),
            el("h2", { attrs: { id: "trust-title" }, text: "Club San Jorge en números" }),
            el("p", {
              text:
                "Presencia nacional, miles de suscriptores y una red comercial activa para planes de Capitalización y Ahorro.",
            }),
          ],
        }),
        el("div", {
          className: "home-trust-v5__stats",
          children: stats.map((item) => createMiniFact({ label: item.label, value: item.value })),
        }),
      ],
    }),
  );
}

function renderAccessPanel(data) {
  const drawsTarget = qs("[data-draws-preview]");
  const adjudicationsTarget = qs("[data-adjudications-preview]");
  if (!drawsTarget || !adjudicationsTarget) return;

  const draws = data.draws || {};
  const adjudications = data.adjudications || {};
  const adjudicationsReady = adjudications.meta?.status && !isMockStatus(adjudications.meta.status);
  const lastState = resolveValueState(draws.lastDraw?.date, draws.lastDraw?.status);
  const nextState = resolveValueState(draws.nextDraw?.date, draws.nextDraw?.status);

  clear(drawsTarget);
  clear(adjudicationsTarget);

  drawsTarget.append(
    el("article", {
      className: "home-access-panel",
      children: [
        el("span", { className: "home-eyebrow", text: "Sorteos" }),
        el("h2", { attrs: { id: "draws-title" }, text: "Fechas y resultados" }),
        el("p", { text: "Consultá información de sorteos y adjudicados sin cargar la home con listados largos." }),
        el("div", {
          className: "home-access-panel__facts",
          children: [
            createMiniFact({ label: "Último sorteo", value: draws.lastDraw?.date || FALLBACK_TEXT.updating, state: lastState }),
            createMiniFact({ label: "Próximo sorteo", value: draws.nextDraw?.date || FALLBACK_TEXT.updating, state: nextState }),
          ],
        }),
        el("div", {
          className: "home-action-row",
          children: [
            createButton({ label: "Ver sorteos", href: "/sorteos/", variant: "secondary" }),
            createButton({ label: "Ver adjudicados", href: "/adjudicados/", variant: "secondary" }),
          ],
        }),
      ],
    }),
  );

  adjudicationsTarget.append(
    el("article", {
      className: "home-access-panel home-access-panel--dark",
      children: [
        el("span", { className: "home-eyebrow home-eyebrow--light", text: "Consultas útiles" }),
        el("h2", { text: "Accesos rápidos" }),
        el("p", { text: "Toda la información operativa queda disponible, pero separada de la decisión principal." }),
        el("div", {
          className: "home-access-links",
          children: [
            createButton({ label: "Preguntas frecuentes", href: "/preguntas-frecuentes/", variant: "secondary" }),
            createButton({ label: "Recursos oficiales", href: "/recursos/", variant: "secondary" }),
            createMiniFact({
              label: "Adjudicados locales",
              value: adjudicationsReady ? "Disponibles" : "En validación",
              state: adjudicationsReady ? UI_STATES.READY : UI_STATES.PARTIAL,
            }),
          ],
        }),
      ],
    }),
  );
}

function renderFaq(data) {
  const target = qs("[data-faq-highlight]");
  if (!target) return;

  const faqs = HOME_FAQ_IDS.map((id) => getFaqById(data.faq, id)).filter(Boolean);

  clear(target);
  target.append(
    createHomeSectionHeader({
      eyebrow: "Dudas frecuentes",
      title: "Lo mínimo que conviene saber antes de consultar",
      id: "faq-title",
      intro: "Respuestas breves para reducir incertidumbre sin convertir la portada en una página legal.",
      align: "center",
    }),
    el("div", {
      className: "home-faq-grid",
      children: faqs.map((item) =>
        el("article", {
          className: "home-faq-card",
          children: [el("h3", { text: item.question }), el("p", { text: item.answer })],
        }),
      ),
    }),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver preguntas frecuentes", href: "/preguntas-frecuentes/", variant: "secondary" })],
    }),
  );
}

function renderResources(data) {
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
              text: "Accedé a pagos, boletas y medios oficiales sin buscar entre secciones.",
            }),
            primaryEnabled
              ? el("a", {
                  className: "button button--primary home-subscriber-tools__primary",
                  text: "Pagar boleta",
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
          el("span", { text: "Acepto que me contacten por esta postulación comercial." }),
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
          el("button", { className: "button button--secondary", text: "Limpiar datos", attrs: { type: "reset" } }),
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

function renderRecruitment(data) {
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
                  attrs: { "aria-hidden": "true", style: `--recruitment-image: url('${image.src}')` },
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

function renderFinalCta(data) {
  const target = qs("[data-contact-cta]");
  if (!target) return;

  const primaryCta = getPrimaryCta(data.site);
  const secondaryCta = getSecondaryCta(data.site);

  clear(target);
  target.append(
    el("article", {
      className: "home-final-v5",
      children: [
        el("div", {
          children: [
            el("span", { className: "home-eyebrow home-eyebrow--light", text: "Contacto comercial" }),
            el("h2", { attrs: { id: "contact-title" }, text: "Consultá por el plan que te interesa" }),
            el("p", {
              text:
                "Escribí por WhatsApp o completá el formulario para continuar la consulta sobre autos, motos o dinero.",
            }),
          ],
        }),
        el("div", {
          className: "home-final-v5__actions",
          children: [
            createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
            createButton({ label: secondaryCta.label, href: secondaryCta.href, variant: "secondary" }),
          ],
        }),
      ],
    }),
  );
}

export async function initHomePage() {
  const data = await loadAllForHome();
  renderHero(data);
  renderPlanRoutes(data);
  renderHomeAdjudications(data);
  renderSocialReviews(data);
  renderHowItWorks(data);
  renderAgencyValue(data);
  renderTrust(data);
  renderAccessPanel(data);
  renderFaq(data);
  renderResources(data);
  renderRecruitment(data);
  renderFinalCta(data);
}
