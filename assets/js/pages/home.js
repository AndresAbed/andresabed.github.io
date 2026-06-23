import {
  getCatalogCategories,
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
  createCategoryEntryCard,
  createFeaturedCatalogGrid,
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
  "si-mi-numero-sale-otra-vez-que-pasa",
  "si-no-pago-la-cuota-y-salgo-sorteado",
  "como-puedo-pagar-mi-cuota",
];

function getPrimaryCta(site) {
  const cta = site?.cta?.primary;
  return {
    label: cta?.label || "Quiero asesoramiento",
    href: normalizeInternalTarget(cta?.target) || "/contacto/",
  };
}

function renderHero(data) {
  const target = qs("[data-home-hero]");
  if (!target) return;

  const { site, planCatalog } = data;
  const agency = site.agency || {};
  const primaryCta = getPrimaryCta(site);
  const categories = getCatalogCategories(planCatalog);

  clear(target);
  target.append(
    el("div", {
      className: "container home-hero__inner home-hero__inner--v2",
      children: [
        el("div", {
          className: "home-hero__copy",
          children: [
            el("span", { className: "badge", text: agency.legalDescriptor || "Agencia mercantil" }),
            el("h1", {
              attrs: { id: "home-title" },
              text: "Elegí mejor tu plan de Club San Jorge con asesoramiento claro",
            }),
            el("p", {
              className: "home-hero__lead",
              text:
                "Explorá opciones de autos, motos y dinero. Te ayudamos a entender valor nominal, cuotas, sorteos y pasos de solicitud antes de avanzar.",
            }),
            el("div", {
              className: "cluster",
              children: [
                createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
                createButton({ label: "Explorar catalogo", href: "/planes/", variant: "secondary" }),
              ],
            }),
          ],
        }),
        el("aside", {
          className: "hero-catalog-panel",
          attrs: { "aria-label": "Categorias principales" },
          children: [
            el("span", { className: "eyebrow", text: "Catalogo asistido" }),
            el("h2", { text: "Autos, motos y capital en una sola consulta ordenada" }),
            el("div", {
              className: "hero-category-list",
              children: categories.map((category) =>
                el("a", {
                  attrs: { href: categoryHref(category.slug) },
                  children: [
                    el("strong", { text: category.label }),
                    el("span", { text: category.summary }),
                  ],
                }),
              ),
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
      eyebrow: "Por donde empezar",
      title: "Tres puertas de entrada al catalogo",
      id: "category-entry-title",
      intro: "Primero elegis objetivo. Despues revisamos monto, cuota y condiciones del sistema.",
    }),
    el("div", {
      className: "category-entry-grid",
      children: categories.map((category) => createCategoryEntryCard(category, getCatalogItemsByCategory(data.planCatalog, category.slug))),
    }),
  );
}

function renderHowItWorks(data) {
  const target = qs("[data-how-it-works]");
  if (!target) return;

  const endFaq = getFaqById(data.faq, "que-se-obtiene-al-final-del-plan-330");

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Como funciona",
      title: "Capitalizacion y ahorro, explicado para decidir mejor",
      id: "how-title",
      intro:
        "La web de agencia no reemplaza la documentacion oficial: ordena la informacion para que sepas que consultar.",
    }),
    createSystemExplainer(),
    el("div", {
      className: "system-note",
      children: [
        el("h3", { text: "El final del plan no se resume en una promesa simple" }),
        el("p", {
          text:
            endFaq?.answer ||
            "El objeto del contrato es formar un capital equivalente al Valor Nominal del Titulo, segun condiciones vigentes.",
        }),
      ],
    }),
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
      eyebrow: "Catalogo destacado",
      title: "Opciones para consultar con datos claros",
      id: "plans-title",
      intro: "No son tres productos cerrados: son fichas de catalogo para ordenar una conversacion comercial seria.",
    }),
    createFeaturedCatalogGrid(featured, categories),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver catalogo completo", href: "/planes/", variant: "primary" })],
    }),
  );
}

function renderTrust(data) {
  const target = qs("[data-resources-hub]");
  if (!target) return;

  const { site } = data;
  const stats = (site.club?.stats || []).filter((item) => item.status === "verified");

  clear(target);
  target.append(
    el("div", {
      className: "trust-band trust-band--v2",
      children: [
        el("div", {
          className: "trust-band__copy",
          children: [
            el("span", { className: "badge", text: site.agency?.coverageLabel || "Atencion online" }),
            el("h2", { attrs: { id: "trust-title" }, text: "Respaldo del sistema, trato de agencia" }),
            el("p", {
              text:
                "Club San Jorge aporta el sistema de Capitalizacion y Ahorro. Agencias Abed te ayuda a leerlo, compararlo y avanzar con una consulta bien preparada.",
            }),
          ],
        }),
        el("div", {
          className: "stats-grid",
          children: stats.map((item) => createMiniFact({ label: item.label, value: item.value })),
        }),
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
            el("h2", { attrs: { id: "draws-title" }, text: "El sistema tambien se sigue por resultados" }),
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
          title: "Resultados oficiales y recursos a mano",
          intro: "Cuando un dato local no esta validado, la web deriva al recurso oficial en vez de completar una tabla falsa.",
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
      title: "Preguntas que cambian la decision",
      id: "faq-title",
      intro: "Antes de elegir una ficha del catalogo, conviene resolver estas preguntas.",
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
  const items = [...management, ...official].filter((item) => item.featured || ["descargar-boleta", "medios-de-pago"].includes(item.id));

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Gestiones",
      title: "Pagos, boletas y recursos oficiales",
      id: "resources-title",
      intro: "Accesos utiles para quienes ya son suscriptores o estan revisando documentacion.",
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
  const whatsappReady = isValidUrl(site.cta?.whatsapp?.target);

  clear(target);
  target.append(
    el("article", {
      className: "final-cta final-cta--v2",
      children: [
        el("div", {
          className: "final-cta__copy",
          children: [
            el("span", { className: "badge", text: "Asesoramiento asistido" }),
            el("h2", { attrs: { id: "contact-title" }, text: "Converti una duda en una consulta concreta" }),
            el("p", {
              text:
                "Decinos si miras auto, moto o dinero. Te ayudamos a revisar la opcion, ordenar documentacion y entender el siguiente paso.",
            }),
          ],
        }),
        el("div", {
          className: "final-cta__actions",
          children: [
            createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
            whatsappReady
              ? createButton({ label: site.cta.whatsapp.label || "Hablar por WhatsApp", href: site.cta.whatsapp.target, variant: "secondary" })
              : createButton({ label: "Ver contacto", href: "/contacto/", variant: "secondary" }),
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
