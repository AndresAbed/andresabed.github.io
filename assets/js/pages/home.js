import {
  getCatalogCategories,
  getCatalogItemsByCategory,
  getFaqById,
  getResourcesByGroup,
  loadAllForHome,
  normalizeInternalTarget,
} from "../data/api.js";
import { classifyLinkItem } from "../data/validators.js";
import { categoryHref, createButton, createMiniFact, formatMoneyARS } from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { isMockStatus } from "../utils/validators.js";

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
  const cuotas = items
    .map((item) => Number(item.cuota?.value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const leadItem = items.find((item) => item.imageUrl) || items[0];

  return {
    items,
    leadItem,
    minCuota: cuotas.length ? Math.min(...cuotas) : null,
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

function createHeroVideo(video) {
  if (!video?.youtubeUrl) return null;

  return el("article", {
    className: "home-hero-video",
    children: [
      el("div", {
        className: "home-hero-video__frame",
        children: [
          el("iframe", {
            attrs: {
              src: video.youtubeUrl,
              title: video.title || "Video de Club San Jorge Capitalización y Ahorro",
              loading: "lazy",
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
              referrerpolicy: "strict-origin-when-cross-origin",
              allowfullscreen: true,
            },
          }),
        ],
      }),
    ],
  });
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
      drawBadge ? el("span", { className: "home-hero-drawcard__badge", text: drawBadge }) : null,
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
      el("div", {
        className: "home-hero-drawcard__dates",
        children: [
          el("div", {
            className: "home-hero-drawcard__date",
            attrs: { "data-state": lastState },
            children: [
              el("span", { text: "Último sorteo" }),
              el("strong", { text: lastDrawDate.date || FALLBACK_TEXT.updating }),
            ],
          }),
          el("div", {
            className: "home-hero-drawcard__date home-hero-drawcard__date--next",
            attrs: { "data-state": nextState },
            children: [
              el("span", { text: "Próximo sorteo" }),
              el("strong", { text: nextDrawDate.date || FALLBACK_TEXT.updating }),
            ],
          }),
        ],
      }),
      createButton({ label: "Quiero mi plan", href: primaryCta.href, variant: "primary" }),
    ],
  });
}

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
                    createButton({ label: "Cómo funciona", href: "#how-title", variant: "green" }),
                  ],
                }),
              ],
            }),
            createHeroDraws(draws, primaryCta),
          ],
        }),
        createHeroVideo(video),
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

  const categories = getCatalogCategories(data.planCatalog);
  const copy = {
    autos: {
      kicker: "Plan Auto",
      title: "Para proyectar un 0 km",
      body: "Opciones con referencias de autos y utilitarios, cuota mensual, valor nominal y chances de sorteo.",
      cta: "Ver autos",
    },
    motos: {
      kicker: "Plan Moto",
      title: "Para acceder a tu moto",
      body: "Planes orientados a motos, con importes de catálogo y condiciones para revisar antes de avanzar.",
      cta: "Ver motos",
    },
    dinero: {
      kicker: "Plan Dinero",
      title: "Para formar capital",
      body: "Alternativas de orden de compra / capital para quienes prefieren consultar por monto disponible.",
      cta: "Ver dinero",
    },
  };

  clear(target);
  target.append(
    createHomeSectionHeader({
      eyebrow: "Nuestros planes",
      title: "Elegí cómo querés participar",
      id: "category-entry-title",
      intro: "Una primera orientación para encontrar rápido el tipo de plan que querés consultar.",
      align: "center",
    }),
    el("div", {
      className: "home-plan-routes",
      children: categories.map((category) => {
        const stats = getCategoryStats(data.planCatalog, category);
        const content = copy[category.slug] || {
          kicker: category.label,
          title: category.label,
          body: category.summary || category.description,
          cta: "Ver planes",
        };

        return el("article", {
          className: `home-route-card home-route-card--${category.theme || "default"}`,
          children: [
            createPlanVisual(stats.leadItem),
            el("div", {
              className: "home-route-card__body",
              children: [
                el("span", { className: "home-eyebrow", text: content.kicker }),
                el("h3", { text: content.title }),
                el("p", { text: content.body }),
                el("div", {
                  className: "home-route-card__facts",
                  children: [
                    createMiniFact({ label: "Opciones", value: String(stats.items.length) }),
                    createMiniFact({
                      label: "Cuotas desde",
                      value: stats.minCuota ? formatMoneyARS(stats.minCuota) : FALLBACK_TEXT.confirm,
                      state: stats.minCuota ? UI_STATES.READY : UI_STATES.PARTIAL,
                    }),
                  ],
                }),
                createButton({ label: content.cta, href: categoryHref(category.slug), variant: "secondary" }),
              ],
            }),
          ],
        });
      }),
    }),
  );
}

function renderHowItWorks(data) {
  const target = qs("[data-how-it-works]");
  if (!target) return;

  const drawFaq = getFaqById(data.faq, "como-se-realizan-los-sorteos-mensuales");
  const endFaq = getFaqById(data.faq, "que-se-obtiene-al-final-del-plan-330");

  const steps = [
    ["Elegís una línea", "Auto, moto o dinero, según tu objetivo."],
    ["Pagás tu cuota", "Con cada cuota ahorrás dentro del sistema."],
    ["Participás todos los meses", drawFaq?.answer || "Los sorteos mensuales se realizan según condiciones vigentes."],
    ["Avanzás con información clara", endFaq?.answer || "La adjudicación y el cierre del plan se revisan con documentación vigente."],
  ];

  clear(target);
  target.append(
    el("div", {
      className: "home-process",
      children: [
        createHomeSectionHeader({
          eyebrow: "El sistema",
          title: "Una forma simple de entenderlo",
          id: "how-title",
          intro: "La home no necesita explicar todo el contrato: tiene que dejar claro el recorrido y llevarte al plan correcto.",
        }),
        el("div", {
          className: "home-step-list",
          children: steps.map(([title, body], index) =>
            el("article", {
              className: "home-step",
              children: [
                el("span", { text: String(index + 1).padStart(2, "0") }),
                el("h3", { text: title }),
                el("p", { text: body }),
              ],
            }),
          ),
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
            createButton({ label: "Preguntas frecuentes", href: "/faq/", variant: "secondary" }),
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
      children: [createButton({ label: "Ver FAQ completa", href: "/faq/", variant: "secondary" })],
    }),
  );
}

function renderResources(data) {
  const target = qs("[data-final-cta]");
  if (!target) return;

  const resources = [
    getResource(data.resources, "descargar-boleta"),
    getResource(data.resources, "medios-de-pago"),
    getResource(data.resources, "catalogo-oficial"),
  ].filter(Boolean);
  const official = getResourcesByGroup(data.resources, "informacion-oficial").find((item) => item.id === "terminos-condiciones");
  if (official) resources.push(official);

  clear(target);
  target.append(
    createHomeSectionHeader({
      eyebrow: "Para suscriptores",
      title: "Gestiones y documentación",
      id: "resources-title",
      intro: "Accesos importantes disponibles sin mezclarlos con la elección inicial del plan.",
    }),
    el("div", {
      className: "home-resource-list",
      children: resources.map((item) => {
        const enabled = classifyLinkItem(item) === UI_STATES.READY;
        return el("article", {
          className: "home-resource-link",
          attrs: { "data-state": enabled ? UI_STATES.READY : UI_STATES.PARTIAL },
          children: [
            el("div", {
              children: [el("h3", { text: item.title }), el("p", { text: item.description })],
            }),
            enabled
              ? el("a", {
                  className: "button button--secondary",
                  text: "Abrir",
                  attrs: { href: item.url, target: "_blank", rel: "noopener noreferrer" },
                })
              : el("span", { className: "badge badge--warning", text: FALLBACK_TEXT.updating }),
          ],
        });
      }),
    }),
  );
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
  renderHowItWorks(data);
  renderAgencyValue(data);
  renderTrust(data);
  renderAccessPanel(data);
  renderFaq(data);
  renderResources(data);
  renderFinalCta(data);
}
