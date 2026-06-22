import {
  getFaqsForPlan,
  getPlanBySlug,
  getPlanDisclaimers,
  getVisiblePlans,
  loadFaq,
  loadPlans,
} from "../data/api.js";
import {
  createButton,
  createCallout,
  createFaqBlock,
  createInfoList,
  createPlanAccessCard,
  createPlanComparator,
  createPlanCta,
  createPlanFacts,
  createSectionHeader,
  planEndText,
  planObjective,
} from "../components/plan-components.js";
import { clear, el, qs } from "../utils/dom.js";
import { FALLBACK_TEXT, UI_STATES } from "../utils/status.js";

function createHubIntro(plansData) {
  return el("div", {
    className: "plans-hub-hero",
    children: [
      el("div", {
        className: "plans-hub-hero__copy",
        children: [
          el("span", { className: "badge", text: "Planes de Capitalizacion y Ahorro" }),
          el("h2", { text: "Compará las opciones antes de consultar" }),
          el("p", {
            text:
              "Cada plan tiene un objetivo distinto. El punto de partida no es prometer una entrega, sino entender que forma el plan, que se obtiene al final y que condiciones conviene revisar.",
          }),
          el("p", { className: "muted", text: plansData.meta?.commercialFocus || "La agencia prioriza explicar bien antes de avanzar." }),
        ],
      }),
      el("aside", {
        className: "home-panel stack",
        children: [
          el("h3", { text: "La consulta ayuda a evitar confusiones" }),
          el("p", {
            text:
              "Te orientamos sobre diferencias entre auto, moto y capital / dinero, sin completar datos pendientes ni convertir sorteos en promesas.",
          }),
          createButton({ label: "Consultar por un plan", href: "/contacto/?intent=asesoramiento", variant: "primary" }),
        ],
      }),
    ],
  });
}

export async function initPlansHub() {
  const target = qs("[data-plans-hub]");
  if (!target) return;

  const plansData = await loadPlans();
  const plans = getVisiblePlans(plansData);
  const comparatorOrder = plansData.comparator?.columns || plans.map((plan) => plan.slug);
  const orderedForComparator = comparatorOrder.map((slug) => getPlanBySlug(plansData, slug)).filter(Boolean);

  clear(target);
  target.append(
    createHubIntro(plansData),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "comparator-title" },
      children: [
        createSectionHeader({
          eyebrow: "Comparador",
          title: "Diferencias clave sin tabla pesada",
          id: "comparator-title",
          intro:
            "La comparacion muestra solo lo necesario para orientar la decision. Si falta un dato, se marca como a confirmar.",
        }),
        createPlanComparator(orderedForComparator),
      ],
    }),
    el("section", {
      className: "plans-section",
      attrs: { "aria-labelledby": "plan-cards-title" },
      children: [
        createSectionHeader({
          eyebrow: "Detalle por plan",
          title: "Elegí por objetivo, no por promesa",
          id: "plan-cards-title",
          intro: "Auto 330 tiene prioridad comercial, pero conviene revisar cada alternativa segun lo que quieras lograr.",
        }),
        el("div", {
          className: "plans-grid",
          children: plans.map((plan) => createPlanAccessCard(plan, plansData.meta?.featuredPlanSlug)),
        }),
      ],
    }),
    el("section", {
      className: "plans-section",
      children: [
        createCallout(
          "Los planes forman ahorro / capital segun condiciones vigentes. Sorteos y adjudicaciones son parte del sistema, pero no deben interpretarse como entrega automatica por pagar una cantidad de cuotas.",
          "warning",
        ),
        el("div", {
          className: "section-actions",
        children: [createButton({ label: "Necesito que me orienten", href: "/contacto/?intent=asesoramiento", variant: "primary" })],
        }),
      ],
    }),
  );
}

function detailIntroFor(plan) {
  if (plan.type === "dinero") {
    return {
      profile: "Puede servir si queres evaluar una alternativa orientada a formar capital / dinero.",
      warning:
        "Este plan no debe confundirse con auto, moto, casa, equipamiento ni una inversion externa. El eje es el capital / ahorro del plan contratado.",
    };
  }

  if (plan.type === "moto") {
    return {
      profile: "Puede servir si queres evaluar una alternativa orientada al rubro motos, revisando antes los datos especificos pendientes.",
      warning:
        "No debe presentarse como entrega automatica de una moto por pagar cierta cantidad de cuotas. Los datos pendientes se muestran con criterio prudente.",
    };
  }

  return {
    profile: "Puede servir si queres evaluar una alternativa de ahorro orientada al rubro automotor.",
    warning:
      "No debe interpretarse como entrega automatica de un vehiculo. El plan forma capital / ahorro y participa de sorteos estimulo segun condiciones vigentes.",
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
          el("span", { className: plan.featured ? "badge" : "badge badge--warning", text: plan.featured ? "Plan prioritario" : "Plan disponible" }),
          el("h2", { text: plan.name }),
          el("p", { className: "home-hero__lead", text: plan.summary }),
          el("p", { text: intro.profile }),
          el("div", {
            className: "cluster",
            children: [
              createButton({ label: cta?.label || "Quiero asesoramiento", href: `/contacto/?intent=asesoramiento&plan=${encodeURIComponent(plan.slug)}`, variant: "primary" }),
              createButton({ label: "Comparar con otros planes", href: "/planes/", variant: "secondary" }),
            ],
          }),
        ],
      }),
      el("aside", {
        className: "hero-panel",
        children: [el("h3", { text: "Aclaracion importante" }), el("p", { text: intro.warning }), createPlanFacts(plan)],
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
        title: "Que es y que obtiene al final",
        id: "summary-title",
        intro: "Primero lo esencial: objetivo, perfil y resultado final del plan.",
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
            children: [el("h3", { text: "Para que perfil puede servir" }), el("p", { text: planObjective(plan) })],
          }),
          el("article", {
            className: "card stack",
            children: [el("h3", { text: "Que obtiene al final" }), el("p", { text: planEndText(plan) })],
          }),
        ],
      }),
    ],
  });
}

function createHowSection(plan, faqs) {
  const sorteoFaq = faqs.find((item) => item.id === "como-se-realizan-los-sorteos-mensuales");
  const continuidadFaq = faqs.find((item) => item.id === "si-salgo-adjudicado-debo-seguir-pagando" || item.id === "si-mi-numero-sale-otra-vez-que-pasa");
  const steps = [
    {
      title: "1. Entender el objeto",
      body: plan.whatItIs?.[0]?.text || "Es un plan de Capitalizacion y Ahorro.",
    },
    {
      title: "2. Revisar cuotas",
      body:
        plan.termMonths?.status === "verified" && plan.termMonths?.value
          ? `El plan informado tiene ${plan.termMonths.value} cuotas.`
          : "El plazo especifico debe confirmarse segun condiciones del plan.",
    },
    {
      title: "3. Ubicar sorteos",
      body: sorteoFaq?.answer || "Los sorteos funcionan como estimulos segun condiciones vigentes.",
    },
    {
      title: "4. Ver continuidad",
      body: continuidadFaq?.answer || "La continuidad del plan debe revisarse con la documentacion vigente.",
    },
  ];

  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "how-plan-title" },
    children: [
      createSectionHeader({
        eyebrow: "Como funciona",
        title: "El recorrido del plan, explicado sin vueltas",
        id: "how-plan-title",
        intro: "Estos puntos ayudan a entender el plan antes de iniciar una solicitud asistida.",
      }),
      el("div", {
        className: "steps-grid steps-grid--four",
        children: steps.map((step) =>
          el("article", {
            className: "step-card",
            children: [el("h3", { text: step.title }), el("p", { text: step.body })],
          }),
        ),
      }),
    ],
  });
}

function createChecklistSection(plan) {
  const disclaimers = getPlanDisclaimers(plan);
  const fallback = [
    { text: "Leer documentacion y condiciones vigentes antes de contratar.", status: "verified" },
    { text: "Consultar que se obtiene al final y como funcionan sorteos o adjudicacion.", status: "verified" },
    { text: "No avanzar si el plan se explico como entrega automatica.", status: "verified" },
  ];

  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "before-title" },
    children: [
      createSectionHeader({
        eyebrow: "Antes de avanzar",
        title: "Checklist de claridad",
        id: "before-title",
        intro: "Si alguno de estos puntos no esta claro, conviene consultar antes de iniciar la solicitud.",
      }),
      createInfoList(disclaimers.length ? disclaimers : fallback),
    ],
  });
}

function createFaqSection(plan, faqs) {
  return el("section", {
    className: "plans-section",
    attrs: { "aria-labelledby": "plan-faq-title" },
    children: [
      createSectionHeader({
        eyebrow: "Dudas frecuentes",
        title: `Preguntas sobre ${plan.shortLabel || plan.name}`,
        id: "plan-faq-title",
        intro: "Tomadas del data pack para reducir malentendidos antes de consultar.",
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
    target.append(createCallout("No encontramos este plan en el data pack. Volve al hub de planes.", "warning"));
    return;
  }

  const faqs = getFaqsForPlan(faqData, plan);

  target.append(
    createPlanHero(plan, site),
    createSummarySection(plan),
    createHowSection(plan, faqs),
    createChecklistSection(plan),
    createFaqSection(plan, faqs),
    createPlanCta(site, plan),
  );
}
