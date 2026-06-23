import {
  getCatalogCategories,
  getCatalogItemsByCategory,
  getFaqById,
  getFaqsForPlan,
  getPlanBySlug,
  getPlanDisclaimers,
  loadFaq,
  loadPlanCatalog,
  loadPlans,
} from "../data/api.js";
import {
  categoryHref,
  createButton,
  createCallout,
  createCatalogItemCard,
  createCategoryNav,
  createFaqBlock,
  createInfoList,
  createPlanCta,
  createPlanFacts,
  createSectionHeader,
  createSystemExplainer,
  planEndText,
  planObjective,
} from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";

const PLAN_FAQ_IDS = [
  "que-se-obtiene-al-final-del-plan-330",
  "como-se-realizan-los-sorteos-mensuales",
  "si-salgo-adjudicado-debo-seguir-pagando",
  "si-mi-numero-sale-otra-vez-que-pasa",
  "cuando-puedo-solicitar-mi-rescate",
];

function createCatalogHero(catalogData, categories) {
  const totalItems = catalogData?.items?.length || 0;

  return el("section", {
    className: "catalog-hero",
    children: [
      el("div", {
        className: "catalog-hero__copy",
        children: [
          el("span", { className: "badge", text: "Catalogo de agencia" }),
          el("h2", { text: "Explora opciones por objetivo: auto, moto o capital" }),
          el("p", {
            className: "home-hero__lead",
            text:
              "Esta pagina organiza las alternativas comerciales por categoria. Despues, la agencia te ayuda a revisar valor nominal, cuota, plazo y condiciones antes de iniciar una solicitud.",
          }),
          el("div", {
            className: "cluster",
            children: [
              createButton({ label: "Consultar con un asesor", href: "/contacto/?intent=asesoramiento", variant: "primary" }),
              createButton({ label: "Entender el sistema", href: "#sistema", variant: "secondary" }),
            ],
          }),
        ],
      }),
      el("aside", {
        className: "catalog-hero__panel",
        attrs: { "aria-label": "Resumen del catalogo" },
        children: [
          el("span", { className: "eyebrow", text: "Opciones cargadas" }),
          el("strong", { text: String(totalItems) }),
          el("p", { text: "Fichas organizadas por Autos, Motos y Dinero. Los importes no confirmados quedan marcados sin inventar datos." }),
          createCategoryNav(categories),
        ],
      }),
    ],
  });
}

function createCategorySection(category, items, categories) {
  return el("section", {
    className: "catalog-category",
    attrs: { id: category.slug, "aria-labelledby": `${category.slug}-title` },
    children: [
      el("div", {
        className: "catalog-category__head",
        children: [
          createSectionHeader({
            eyebrow: "Categoria",
            title: category.label,
            id: `${category.slug}-title`,
            intro: category.description,
          }),
          createButton({ label: "Consultar esta categoria", href: `/contacto/?intent=asesoramiento&category=${encodeURIComponent(category.slug)}`, variant: "secondary" }),
        ],
      }),
      el("div", {
        className: "catalog-list",
        children: items.map((item) => createCatalogItemCard(item, categories, { showCategory: false })),
      }),
    ],
  });
}

function createSystemSection(faqData) {
  const endFaq = getFaqById(faqData, "que-se-obtiene-al-final-del-plan-330");
  const repeatFaq = getFaqById(faqData, "si-mi-numero-sale-otra-vez-que-pasa");

  return el("section", {
    id: "sistema",
    className: "plans-section system-section",
    attrs: { "aria-labelledby": "system-title" },
    children: [
      createSectionHeader({
        eyebrow: "El sistema",
        title: "330 es una condicion del plan, no el nombre del producto",
        id: "system-title",
        intro:
          "La referencia comercial puede ser auto, moto o dinero. El plazo, el valor nominal, la cuota y la documentacion son los puntos que hay que revisar antes de avanzar.",
      }),
      createSystemExplainer(),
      el("div", {
        className: "editorial-split",
        children: [
          el("article", {
            className: "editorial-panel",
            children: [
              el("h3", { text: "Que se obtiene al final" }),
              el("p", { text: endFaq?.answer || "El objeto es formar un capital equivalente al Valor Nominal del Titulo, segun condiciones vigentes." }),
            ],
          }),
          el("article", {
            className: "editorial-panel",
            children: [
              el("h3", { text: "Sorteos y continuidad" }),
              el("p", { text: repeatFaq?.answer || "En planes 330, si el titulo sigue vigente y al dia, puede volver a participar segun las condiciones del sistema." }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createPlanFaqSection(faqData) {
  const faqs = PLAN_FAQ_IDS.map((id) => getFaqById(faqData, id)).filter(Boolean);

  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "plan-faq-title" },
    children: [
      createSectionHeader({
        eyebrow: "Dudas clave",
        title: "Preguntas para leer antes de consultar",
        id: "plan-faq-title",
        intro: "Respuestas cortas sobre final del plan, sorteos, continuidad, rescate y cuotas.",
      }),
      createFaqBlock(faqs),
      el("div", {
        className: "section-actions",
        children: [createButton({ label: "Ver FAQ completa", href: "/faq/", variant: "secondary" })],
      }),
    ],
  });
}

export async function initPlansHub() {
  const target = qs("[data-plans-hub]");
  if (!target) return;

  const [catalogData, faqData] = await Promise.all([loadPlanCatalog(), loadFaq()]);
  const categories = getCatalogCategories(catalogData);

  clear(target);
  target.append(
    createCatalogHero(catalogData, categories),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "catalog-nav-title" },
      children: [
        createSectionHeader({
          eyebrow: "Categorias",
          title: "Elegi por objetivo, despues revisamos condiciones",
          id: "catalog-nav-title",
          intro: "Las categorias ordenan la consulta. No reemplazan la lectura de la documentacion ni la validacion comercial.",
        }),
        createCategoryNav(categories),
      ],
    }),
    ...categories.map((category) => createCategorySection(category, getCatalogItemsByCategory(catalogData, category.slug), categories)),
    createSystemSection(faqData),
    createPlanFaqSection(faqData),
    el("section", {
      className: "plans-section",
      children: [
        el("article", {
          className: "final-cta",
          children: [
            el("div", {
              className: "final-cta__copy",
              children: [
                el("span", { className: "badge", text: "Consulta de catalogo" }),
                el("h2", { text: "Te ayudamos a pasar del catalogo a una opcion concreta" }),
                el("p", { text: "Contanos si te interesa auto, moto o dinero y revisamos juntos monto, cuota, plazo, sorteos y documentacion." }),
              ],
            }),
            el("div", {
              className: "final-cta__actions",
              children: [createButton({ label: "Iniciar consulta", href: "/contacto/?intent=asesoramiento", variant: "primary" })],
            }),
          ],
        }),
      ],
    }),
  );
}

function detailIntroFor(plan) {
  if (plan.type === "dinero") {
    return {
      profile: "Puede servir si queres evaluar una alternativa orientada a formar capital / dinero.",
      note: "Este detalle se conserva por compatibilidad. Para explorar opciones V2, usa el catalogo principal.",
    };
  }

  if (plan.type === "moto") {
    return {
      profile: "Puede servir si queres evaluar una alternativa orientada al rubro motos.",
      note: "Los datos especificos de moto se validan en la consulta comercial.",
    };
  }

  return {
    profile: "Puede servir si queres evaluar una alternativa de ahorro orientada al rubro automotor.",
    note: "La referencia 330 describe el plazo/sistema. El catalogo V2 organiza opciones por categoria.",
  };
}

function createPlanHero(plan, site) {
  const intro = detailIntroFor(plan);
  const cta = site?.cta?.primary;

  return el("section", {
    className: "plan-detail-hero",
    children: [
      el("div", {
        className: "plan-detail-hero__copy",
        children: [
          el("span", { className: "badge", text: "Detalle heredado" }),
          el("h2", { text: plan.name }),
          el("p", { className: "home-hero__lead", text: plan.summary }),
          el("p", { text: intro.profile }),
          el("div", {
            className: "cluster",
            children: [
              createButton({ label: cta?.label || "Quiero asesoramiento", href: `/contacto/?intent=asesoramiento&plan=${encodeURIComponent(plan.slug)}`, variant: "primary" }),
              createButton({ label: "Ver catalogo completo", href: "/planes/", variant: "secondary" }),
            ],
          }),
        ],
      }),
      el("aside", {
        className: "hero-panel",
        children: [el("h3", { text: "Lectura recomendada" }), el("p", { text: intro.note }), createPlanFacts(plan)],
      }),
    ],
  });
}

function createSummarySection(plan) {
  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "summary-title" },
    children: [
      createSectionHeader({
        eyebrow: "Resumen",
        title: "Objetivo, perfil y resultado",
        id: "summary-title",
        intro: "Un repaso breve para ubicar la opcion antes de consultar.",
      }),
      el("div", {
        className: "plan-summary-grid",
        children: [
          el("article", {
            className: "card stack",
            children: [el("h3", { text: "Que es" }), createInfoList(plan.whatItIs || [])],
          }),
          el("article", {
            className: "card stack",
            children: [el("h3", { text: "Para quien puede servir" }), el("p", { text: planObjective(plan) })],
          }),
          el("article", {
            className: "card stack",
            children: [el("h3", { text: "Final del plan" }), el("p", { text: planEndText(plan) })],
          }),
        ],
      }),
    ],
  });
}

function createHowSection() {
  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "how-plan-title" },
    children: [
      createSectionHeader({
        eyebrow: "Como funciona",
        title: "Del objetivo comercial al sistema real",
        id: "how-plan-title",
        intro: "La categoria ayuda a elegir. El sistema define cuotas, capital, sorteos, rescate y continuidad.",
      }),
      createSystemExplainer({ compact: true }),
    ],
  });
}

function createChecklistSection(plan) {
  const disclaimers = getPlanDisclaimers(plan);
  const fallback = [
    { text: "Confirmar valor nominal y cuota antes de iniciar la solicitud.", status: "verified" },
    { text: "Revisar como aplican sorteos, rescate y continuidad.", status: "verified" },
  ];

  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "before-title" },
    children: [
      createSectionHeader({
        eyebrow: "Antes de avanzar",
        title: "Checklist comercial",
        id: "before-title",
        intro: "Pocos puntos, bien revisados.",
      }),
      createInfoList(disclaimers.length ? disclaimers.slice(0, 2) : fallback),
    ],
  });
}

function createFaqSection(plan, faqs) {
  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "detail-faq-title" },
    children: [
      createSectionHeader({
        eyebrow: "Dudas frecuentes",
        title: `Preguntas relacionadas`,
        id: "detail-faq-title",
      }),
      createFaqBlock(faqs),
    ],
  });
}

export async function initPlanDetail(site) {
  const target = qs("[data-plan-detail]");
  if (!target) return;

  const slug = document.body.dataset.planSlug;
  const [plansData, faqData] = await Promise.all([loadPlans(), loadFaq()]);
  const plan = getPlanBySlug(plansData, slug);

  clear(target);

  if (!plan) {
    target.append(createCallout("No encontramos esta opcion en el data pack. Volve al catalogo.", "warning"));
    return;
  }

  const faqs = getFaqsForPlan(faqData, plan);

  target.append(
    createPlanHero(plan, site),
    createSummarySection(plan),
    createHowSection(plan),
    createChecklistSection(plan),
    createFaqSection(plan, faqs),
    createPlanCta(site, plan),
  );
}
