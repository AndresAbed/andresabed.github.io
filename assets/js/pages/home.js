import {
  getCatalogCategories,
  getCatalogItems,
  getCatalogItemsByCategory,
  getFaqById,
  getFeaturedCatalogItems,
  getResourcesByGroup,
  loadAllForHome,
  normalizeInternalTarget,
} from "../data/api.js";
import { classifyLinkItem } from "../data/validators.js";
import {
  categoryHref,
  createButton,
  createCatalogItemCard,
  createFeaturedCatalogGrid,
  formatMoneyARS,
  createMiniFact,
  createSectionHeader,
  createSystemExplainer,
} from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { isMockStatus, isValidUrl } from "../utils/validators.js";

const PRIORITY_FAQ_IDS = [
  "que-se-obtiene-al-final-del-plan-330",
  "como-se-realizan-los-sorteos-mensuales",
  "si-salgo-adjudicado-debo-seguir-pagando",
  "si-dejo-de-pagar-tengo-deuda",
  "si-no-pago-la-cuota-y-salgo-sorteado",
  "los-planes-estan-aprobados",
];

function getPrimaryCta(site) {
  const cta = site?.cta?.primary;
  return {
    label: cta?.label || "Consultar plan",
    href: normalizeInternalTarget(cta?.target) || "/contacto/",
  };
}

function getSecondaryCta(site) {
  const cta = site?.cta?.secondary;
  return {
    label: cta?.label || "Completar formulario",
    href: normalizeInternalTarget(cta?.target) || "/contacto/",
  };
}

function catalogStats(planCatalog) {
  const items = getCatalogItems(planCatalog);
  const categories = getCatalogCategories(planCatalog);
  const cuotas = items
    .map((item) => Number(item.cuota?.value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    total: items.length,
    categoryCount: categories.length,
    minCuota: cuotas.length ? Math.min(...cuotas) : null,
    maxCuota: cuotas.length ? Math.max(...cuotas) : null,
  };
}

function categorySummary(planCatalog, category) {
  const items = getCatalogItemsByCategory(planCatalog, category.slug);
  const cuotas = items
    .map((item) => Number(item.cuota?.value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const subcategories = [...new Set(items.map((item) => item.subCategory).filter((value) => value && value !== "-"))];

  return {
    count: items.length,
    minCuota: cuotas.length ? Math.min(...cuotas) : null,
    subcategories,
  };
}

function renderHero(data) {
  const target = qs("[data-home-hero]");
  if (!target) return;

  const { site, planCatalog } = data;
  const agency = site.agency || {};
  const primaryCta = getPrimaryCta(site);
  const secondaryCta = getSecondaryCta(site);
  const categories = getCatalogCategories(planCatalog);
  const stats = catalogStats(planCatalog);
  const officialLogo = site.brand?.officialLogo;
  const featured = getFeaturedCatalogItems(planCatalog, 3);

  clear(target);
  target.append(
    el("div", {
      className: "container home-hero__inner home-hero__inner--v2",
      children: [
        el("div", {
          className: "home-hero__copy",
          children: [
            el("span", { className: "badge badge--light", text: agency.legalDescriptor || "Agencia mercantil" }),
            el("h1", {
              attrs: { id: "home-title" },
              text: "Suscribite, ahorrá y participá",
            }),
            el("p", {
              className: "home-hero__lead",
              text:
                agency.commercialPromise ||
                "Planes de Capitalización y Ahorro Club San Jorge para autos, motos y dinero, con atención comercial de Agencias Abed.",
            }),
            el("div", {
              className: "cluster",
              children: [
                createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
                createButton({ label: "Ver planes", href: "/planes/", variant: "secondary" }),
                createButton({ label: secondaryCta.label, href: secondaryCta.href, variant: "ghost" }),
              ],
            }),
            el("div", {
              className: "hero-assurance",
              children: [
                el("span", { text: "Autos, motos y dinero" }),
                el("span", { text: "Sorteos mensuales" }),
                el("span", { text: "Atención personalizada" }),
              ],
            }),
          ],
        }),
        el("aside", {
          className: "hero-showcase",
          attrs: { "aria-label": "Planes destacados" },
          children: [
            officialLogo
              ? el("img", {
                  className: "hero-showcase__logo",
                  attrs: { src: officialLogo, alt: "Club San Jorge Capitalización y Ahorro" },
                })
              : null,
            el("div", {
              className: "hero-product-stack",
              children: featured.map((item) =>
                el("article", {
                  className: "hero-product",
                  children: [
                    item.imageUrl
                      ? el("img", { attrs: { src: item.imageUrl, alt: item.imageAlt || item.displayName, loading: "eager" } })
                      : null,
                    el("div", {
                      children: [
                        el("span", { text: item.category }),
                        el("strong", { text: item.displayName }),
                      ],
                    }),
                  ],
                }),
              ),
            }),
            el("div", {
              className: "hero-proof-grid",
              children: [
                createMiniFact({ label: "Opciones activas", value: String(stats.total) }),
                createMiniFact({ label: "Rubros", value: String(stats.categoryCount) }),
                createMiniFact({ label: "Cuotas desde", value: stats.minCuota ? formatMoneyARS(stats.minCuota) : FALLBACK_TEXT.confirm }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
}

function renderCategoryEntry(data) {
  const target = qs("[data-trust-section]");
  if (!target) return;

  const categories = getCatalogCategories(data.planCatalog);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Nuestros planes",
      title: "Elegí el rubro que querés consultar",
      id: "category-entry-title",
      intro: "Tres líneas principales para consultar opciones vigentes de Capitalización y Ahorro.",
    }),
    el("div", {
      className: "category-entry-grid",
      children: categories.map((category) => {
        const summary = categorySummary(data.planCatalog, category);
        const leadItem = getCatalogItemsByCategory(data.planCatalog, category.slug).find((item) => item.imageUrl);
        return el("article", {
          className: `category-entry category-entry--${category.theme || "default"} category-entry--v3`,
          children: [
            leadItem
              ? el("img", {
                  className: "category-entry__image",
                  attrs: { src: leadItem.imageUrl, alt: leadItem.imageAlt || leadItem.displayName, loading: "lazy" },
                })
              : null,
            el("span", { className: "badge", text: `${summary.count} opciones` }),
            el("h3", { text: category.label }),
            el("p", { text: category.summary || category.description }),
            el("div", {
              className: "category-entry__facts",
              children: [
                createMiniFact({
                  label: "Cuotas desde",
                  value: summary.minCuota ? formatMoneyARS(summary.minCuota) : FALLBACK_TEXT.confirm,
                }),
                createMiniFact({
                  label: "Subgrupos",
                  value: summary.subcategories.length ? String(summary.subcategories.length) : "A consultar",
                  state: summary.subcategories.length ? UI_STATES.READY : UI_STATES.PARTIAL,
                }),
              ],
            }),
            createButton({ label: `Explorar ${category.shortLabel || category.label}`, href: categoryHref(category.slug), variant: "secondary" }),
          ],
        });
      }),
    }),
  );
}

function renderHowItWorks(data) {
  const target = qs("[data-how-it-works]");
  if (!target) return;

  const endFaq = getFaqById(data.faq, "que-se-obtiene-al-final-del-plan-330");
  const noDebtFaq = getFaqById(data.faq, "si-dejo-de-pagar-tengo-deuda");

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "El sistema",
      title: "Ahorrás con tu cuota y participás en sorteos",
      id: "how-title",
      intro:
        "Una forma simple de ver los puntos centrales del sistema antes de iniciar una consulta comercial.",
    }),
    el("div", {
      className: "agency-system-grid",
      children: [
        el("article", {
          className: "editorial-panel editorial-panel--official",
          children: [
            el("span", { className: "badge", text: "Capitalización y Ahorro" }),
            el("h3", { text: "Cuota, valor nominal y sorteos" }),
            el("p", {
              text:
                endFaq?.answer ||
                "El objeto es formar un capital equivalente al Valor Nominal del Título, según condiciones vigentes.",
            }),
            noDebtFaq ? el("p", { className: "muted", text: noDebtFaq.answer }) : null,
          ],
        }),
        el("article", {
          className: "editorial-panel editorial-panel--agency",
          children: [
            el("span", { className: "badge", text: "Atención comercial" }),
            el("h3", { text: "Canal de atención Agencias Abed" }),
            el("p", {
              text:
                "Acompañamos la consulta, la selección del plan y los pasos de presuscripción con información clara y atención personalizada.",
            }),
            el("div", {
              className: "cluster",
              children: [
                createButton({ label: "Ver planes", href: "/planes/", variant: "secondary" }),
                createButton({ label: "Completar formulario", href: "/contacto/?intent=consulta", variant: "primary" }),
              ],
            }),
          ],
        }),
      ],
    }),
    createSystemExplainer(),
  );
}

function renderFeaturedCatalog(data) {
  const target = qs("[data-featured-plans]");
  if (!target) return;

  const categories = getCatalogCategories(data.planCatalog);
  const featured = getFeaturedCatalogItems(data.planCatalog, 6);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Destacados",
      title: "Planes disponibles para consultar",
      id: "plans-title",
      intro: "Una selección de autos, motos y dinero. El catálogo completo incluye todas las opciones activas.",
    }),
    createFeaturedCatalogGrid(featured, categories),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver todos los planes", href: "/planes/", variant: "primary" })],
    }),
  );
}

function renderTrust(data) {
  const target = qs("[data-resources-hub]");
  if (!target) return;

  const { site } = data;
  const stats = (site.club?.stats || []).filter((item) => item.status === "verified");
  const officialLogo = site.brand?.officialLogo;
  const featuredVideo = (data.videos?.items || []).find((item) => item.status === "verified" && isValidUrl(item.youtubeUrl));

  clear(target);
  target.append(
    el("div", {
      className: "trust-band trust-band--v2",
      children: [
        el("div", {
          className: "trust-band__copy",
          children: [
            officialLogo
              ? el("img", {
                  className: "trust-band__logo",
                  attrs: { src: officialLogo, alt: "Club San Jorge Capitalización y Ahorro" },
                })
              : null,
            el("span", { className: "badge badge--light", text: site.agency?.coverageLabel || "Atención online" }),
            el("h2", { attrs: { id: "trust-title" }, text: "Trayectoria, presencia y atención comercial" }),
            el("p", {
              text:
                "Club San Jorge cuenta con presencia nacional, miles de suscriptores y una red comercial para acompañar cada consulta.",
            }),
          ],
        }),
        el("div", {
          className: "stats-grid",
          children: stats.map((item) => createMiniFact({ label: item.label, value: item.value })),
        }),
        featuredVideo
          ? el("div", {
              className: "video-card",
              children: [
                el("iframe", {
                  attrs: {
                    src: featuredVideo.youtubeUrl,
                    title: featuredVideo.title,
                    loading: "lazy",
                    allow:
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                    allowfullscreen: true,
                  },
                }),
              ],
            })
          : null,
      ],
    }),
  );
}

function renderDraws(data) {
  const target = qs("[data-draws-preview]");
  if (!target) return;

  const draws = data.draws || {};
  const adjudications = data.adjudications || {};
  const hasRealLocalData = adjudications.meta?.status && !isMockStatus(adjudications.meta.status);
  const lastState = resolveValueState(draws.lastDraw?.date, draws.lastDraw?.status);
  const nextState = resolveValueState(draws.nextDraw?.date, draws.nextDraw?.status);

  clear(target);
  target.append(
    el("article", {
      className: "results-panel",
      children: [
        el("div", {
          children: [
            el("span", { className: "badge", text: "Sorteos y adjudicados" }),
            el("h2", { attrs: { id: "draws-title" }, text: "Sorteos mensuales y adjudicados" }),
            el("p", { text: draws.schedule?.officialRule || "Los sorteos se publican segun condiciones vigentes del sistema." }),
          ],
        }),
        el("div", {
          className: "facts-row",
          children: [
            createMiniFact({ label: "Ultimo sorteo", value: draws.lastDraw?.date || FALLBACK_TEXT.updating, state: lastState }),
            createMiniFact({ label: "Proximo sorteo", value: draws.nextDraw?.date || FALLBACK_TEXT.updating, state: nextState }),
            createMiniFact({ label: "Adjudicados locales", value: hasRealLocalData ? "Disponibles" : "En validacion", state: hasRealLocalData ? UI_STATES.READY : UI_STATES.PARTIAL }),
          ],
        }),
        el("div", {
          className: "cluster",
          children: [
            createButton({ label: "Ver sorteos", href: "/sorteos/", variant: "secondary" }),
            createButton({ label: "Ver adjudicados", href: "/adjudicados/", variant: "secondary" }),
          ],
        }),
      ],
    }),
  );
}

function renderAdjudications(data) {
  const target = qs("[data-adjudications-preview]");
  if (!target) return;

  const officialLink = findResource(data.resources, "adjudicados-oficial");

  clear(target);
  target.append(
    el("article", {
      className: "home-panel stack home-panel--editorial",
      children: [
        createSectionHeader({
          eyebrow: "Consulta rapida",
      title: "Resultados y consultas oficiales",
      intro: "Acceso directo a sorteos, adjudicados y documentación publicada por Club San Jorge.",
        }),
        el("div", {
          className: "cluster",
          children: [
            createButton({ label: "Abrir adjudicados", href: "/adjudicados/", variant: "secondary" }),
            officialLink && classifyLinkItem(officialLink) === UI_STATES.READY
              ? createButton({ label: "Fuente oficial", href: officialLink.url, variant: "secondary" })
              : null,
          ],
        }),
      ],
    }),
  );
}

function findResource(resources, id) {
  return (resources.groups || []).flatMap((group) => group.items || []).find((item) => item.id === id) || null;
}

function renderFaq(data) {
  const target = qs("[data-faq-highlight]");
  if (!target) return;

  const faqs = PRIORITY_FAQ_IDS.map((id) => getFaqById(data.faq, id)).filter(Boolean);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Dudas clave",
      title: "Antes de suscribirte",
      id: "faq-title",
      intro: "Información breve sobre funcionamiento, sorteos, pagos y documentación.",
    }),
    el("div", {
      className: "accordion-shell faq-home",
      children: faqs.slice(0, 6).map((item) =>
        el("details", {
          children: [el("summary", { text: item.question }), el("p", { text: item.answer })],
        }),
      ),
    }),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver FAQ completa", href: "/faq/", variant: "secondary" })],
    }),
  );
}

function createResourceCard(item) {
  const linkState = classifyLinkItem(item);
  const enabled = linkState === UI_STATES.READY;
  const action = enabled
    ? el("a", {
        className: "button button--secondary",
        text: "Abrir recurso",
        attrs: { href: item.url, target: "_blank", rel: "noopener noreferrer" },
      })
    : el("span", { className: "badge badge--warning", text: FALLBACK_TEXT.updating });

  return el("article", {
    className: "resource-card",
    attrs: { "data-state": enabled ? UI_STATES.READY : UI_STATES.PARTIAL },
    children: [el("h3", { text: item.title }), el("p", { text: item.description }), action],
  });
}

function renderResources(data) {
  const target = qs("[data-final-cta]");
  if (!target) return;

  const management = getResourcesByGroup(data.resources, "gestiones");
  const official = getResourcesByGroup(data.resources, "informacion-oficial");
  const items = [...management, ...official].filter((item) =>
    item.featured || ["descargar-boleta", "medios-de-pago", "catalogo-oficial", "terminos-condiciones"].includes(item.id),
  );

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Centro de recursos",
      title: "Gestiones y documentación",
      id: "resources-title",
      intro: "Accesos útiles para consultar información oficial, pagos, boletas y condiciones.",
    }),
    el("div", {
      className: "resource-grid resource-grid--wide",
      children: items.map(createResourceCard),
    }),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver recursos", href: "/recursos/", variant: "secondary" })],
    }),
  );
}

function renderFinalCta(data) {
  const target = qs("[data-contact-cta]");
  if (!target) return;

  const { site } = data;
  const primaryCta = getPrimaryCta(site);
  const secondaryCta = getSecondaryCta(site);
  const whatsappReady = isValidUrl(primaryCta.href);

  clear(target);
  target.append(
    el("article", {
      className: "final-cta final-cta--v3",
      children: [
        el("div", {
          className: "final-cta__copy",
          children: [
            el("span", { className: "badge", text: "Asesoramiento asistido" }),
            el("h2", { attrs: { id: "contact-title" }, text: "Consultá el plan que te interesa" }),
            el("p", {
              text:
                "Elegí una opción del catálogo o dejá tus datos para recibir atención comercial de Agencias Abed.",
            }),
          ],
        }),
        el("div", {
          className: "conversion-choice-grid",
          children: [
            el("article", {
              className: "conversion-choice conversion-choice--primary",
              children: [
                el("span", { className: "badge badge--light", text: "Respuesta rápida" }),
                el("h3", { text: "Hablar por WhatsApp" }),
                el("p", { text: "Para consultas rápidas sobre autos, motos, dinero o presuscripción." }),
                createButton({ label: primaryCta.label, href: whatsappReady ? primaryCta.href : "/contacto/", variant: "primary" }),
              ],
            }),
            el("article", {
              className: "conversion-choice",
              children: [
                el("span", { className: "badge", text: "Consulta ordenada" }),
                el("h3", { text: "Completar formulario" }),
                el("p", { text: "Para dejar tus datos y el plan de interés con más detalle." }),
                createButton({ label: secondaryCta.label, href: secondaryCta.href, variant: "secondary" }),
              ],
            }),
          ],
        }),
      ],
    }),
  );
}

export async function initHomePage() {
  const data = await loadAllForHome();
  renderHero(data);
  renderCategoryEntry(data);
  renderHowItWorks(data);
  renderFeaturedCatalog(data);
  renderTrust(data);
  renderDraws(data);
  renderAdjudications(data);
  renderFaq(data);
  renderResources(data);
  renderFinalCta(data);
}
