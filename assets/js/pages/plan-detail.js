import {
  getFaqsForPlan,
  getPlanBySlug,
  getPlanDisclaimers,
  loadFaq,
  loadPlans,
} from "../data/api.js";
import {
  createButton,
  createCallout,
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
              createButton({ label: cta?.label || "Consultar plan", href: `/contacto/?intent=consulta&plan=${encodeURIComponent(plan.slug)}`, variant: "primary" }),
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
