import {
  getFeaturedFaqs,
  getFeaturedPlan,
  getFaqById,
  getPlanBySlug,
  getResourcesByGroup,
  loadAllForHome,
  normalizeInternalTarget,
} from "../data/api.js";
import { classifyLinkItem } from "../data/validators.js";
import { clear, el, qs } from "../utils/dom.js";
import { valueOrConfirm } from "../utils/formatters.js";
import { FALLBACK_TEXT, UI_STATES, resolveValueState } from "../utils/status.js";
import { hasValue, isMockStatus, isValidUrl } from "../utils/validators.js";

const PLAN_ROUTES = {
  "auto-330": "/planes/auto-330/",
  "moto-330": "/planes/moto-330/",
  dinero: "/planes/dinero/",
};

const PRIORITY_FAQ_IDS = [
  "que-se-obtiene-al-final-del-plan-330",
  "como-se-realizan-los-sorteos-mensuales",
  "si-salgo-adjudicado-debo-seguir-pagando",
  "si-mi-numero-sale-otra-vez-que-pasa",
  "la-inscripcion-se-hace-online",
];

function createButton({ label, href, variant = "primary" }) {
  const target = normalizeInternalTarget(href);
  const enabled = isValidUrl(target);

  return el("a", {
    className: `button button--${enabled ? variant : "disabled"}`,
    text: label,
    attrs: enabled ? { href: target } : { href: "#", "aria-disabled": "true", title: FALLBACK_TEXT.unavailable },
  });
}

function createSectionHeader({ eyebrow, title, intro, id }) {
  return el("div", {
    className: "section-header",
    children: [
      eyebrow ? el("span", { className: "badge", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

function createMiniFact({ label, value, state = UI_STATES.READY }) {
  return el("div", {
    className: "mini-fact",
    attrs: { "data-state": state },
    children: [el("span", { text: label }), el("strong", { text: value })],
  });
}

function createCallout(text) {
  return el("div", {
    className: "callout",
    children: [el("p", { text })],
  });
}

function getPlanRoute(slug) {
  return PLAN_ROUTES[slug] || "/planes/";
}

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

  const { site, plans } = data;
  const agency = site.agency || {};
  const club = site.club || {};
  const featuredPlan = getFeaturedPlan(plans);
  const primaryCta = getPrimaryCta(site);

  clear(target);
  target.append(
    el("div", {
      className: "container home-hero__inner",
      children: [
        el("div", {
          className: "home-hero__copy",
          children: [
            el("span", { className: "badge", text: agency.legalDescriptor || "Agencia mercantil" }),
            el("h1", {
              attrs: { id: "home-title" },
              text: "Entende los planes de Club San Jorge antes de avanzar",
            }),
            el("p", {
              className: "home-hero__lead",
              text:
                agency.tagline ||
                "Asesoramiento claro para entender planes de Capitalizacion y Ahorro y consultar con informacion precisa.",
            }),
            el("p", {
              text:
                "Te ayudamos a revisar objetivos, cuotas, sorteos y condiciones para que la decision sea clara, sin promesas automaticas ni mensajes confusos.",
            }),
            el("div", {
              className: "cluster",
              children: [
                createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
                createButton({ label: "Ver planes", href: "/planes/", variant: "secondary" }),
              ],
            }),
          ],
        }),
        el("aside", {
          className: "hero-panel",
          attrs: { "aria-label": "Resumen del sistema" },
          children: [
            el("span", { className: "badge badge--warning", text: "Capitalizacion y Ahorro" }),
            el("h2", { text: featuredPlan?.shortLabel ? `Foco comercial: ${featuredPlan.shortLabel}` : club.headline }),
            el("p", { text: featuredPlan?.summary || club.supportingClaim }),
            createCallout(
              "Los planes forman un capital / ahorro. Los sorteos funcionan como estimulos segun condiciones vigentes; no equivalen a entrega automatica de un vehiculo.",
            ),
          ],
        }),
      ],
    }),
  );
}

function renderTrust(data) {
  const target = qs("[data-trust-section]");
  if (!target) return;

  const { site } = data;
  const stats = (site.club?.stats || []).filter((item) => item.status === "verified");

  clear(target);
  target.append(
    el("div", {
      className: "trust-band",
      children: [
        el("div", {
          className: "trust-band__copy",
          children: [
            el("span", { className: "badge", text: site.agency?.coverageLabel || "Atencion online" }),
            el("h2", { attrs: { id: "trust-title" }, text: "Respaldo del sistema, acompanamiento de agencia" }),
            el("p", {
              text:
                site.legal?.siteRoleText ||
                "Este sitio representa comercialmente a una agencia mercantil y brinda informacion orientativa.",
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

function createPlanCard(plan, featuredPlanSlug) {
  const isFeatured = plan.slug === featuredPlanSlug;
  const rescue = plan.rescue?.canRequestFromInstallment;
  const rescueState = resolveValueState(rescue, plan.rescue?.status);
  const clarification = plan.importantClarifications?.[0]?.text || plan.whatYouGetAtEnd?.[0]?.text;

  return el("article", {
    className: `plan-card ${isFeatured ? "plan-card--featured" : ""}`,
    children: [
      el("div", {
        className: "plan-card__top",
        children: [
          el("span", { className: isFeatured ? "badge" : "badge badge--warning", text: isFeatured ? "Prioritario" : "Alternativa" }),
          el("h3", { text: plan.name }),
        ],
      }),
      el("p", { text: plan.summary }),
      el("div", {
        className: "plan-card__badges",
        children: (plan.badges || []).map((badge) => el("span", { className: "badge", text: badge })),
      }),
      el("div", {
        className: "plan-card__facts",
        children: [
          createMiniFact({ label: "Plazo", value: plan.termMonths?.value ? `${plan.termMonths.value} meses` : valueOrConfirm(null), state: resolveValueState(plan.termMonths?.value, plan.termMonths?.status) }),
          createMiniFact({ label: "Rescate", value: rescue ? `Desde cuota ${rescue}` : valueOrConfirm(null), state: rescueState }),
        ],
      }),
      clarification ? createCallout(clarification) : null,
      el("div", {
        className: "cluster",
        children: [
          createButton({ label: "Ver plan", href: getPlanRoute(plan.slug), variant: isFeatured ? "primary" : "secondary" }),
          createButton({ label: "Consultar", href: `/contacto/?intent=asesoramiento&plan=${encodeURIComponent(plan.slug)}`, variant: "secondary" }),
        ],
      }),
    ],
  });
}

function renderPlans(data) {
  const target = qs("[data-featured-plans]");
  if (!target) return;

  const plansData = data.plans;
  const featuredPlanSlug = plansData.meta?.featuredPlanSlug;
  const plans = [...(plansData.plans || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Planes destacados",
      title: "Opciones para distintos objetivos de ahorro",
      id: "plans-title",
      intro:
        "Auto 330 tiene prioridad comercial, pero mostramos las alternativas disponibles con aclaraciones para evitar malentendidos.",
    }),
    el("div", {
      className: "plans-grid",
      children: plans.map((plan) => createPlanCard(plan, featuredPlanSlug)),
    }),
  );
}

function renderHowItWorks(data) {
  const target = qs("[data-how-it-works]");
  if (!target) return;

  const { site, plans, faq } = data;
  const autoPlan = getPlanBySlug(plans, "auto-330");
  const endFaq = getFaqById(faq, "que-se-obtiene-al-final-del-plan-330");
  const drawsFaq = getFaqById(faq, "como-se-realizan-los-sorteos-mensuales");
  const repeatFaq = getFaqById(faq, "si-mi-numero-sale-otra-vez-que-pasa");

  const steps = [
    {
      title: "1. Es ahorro",
      body: autoPlan?.whatItIs?.[0]?.text || "Es un plan de Capitalizacion y Ahorro.",
    },
    {
      title: "2. Pagas cuotas",
      body:
        autoPlan?.whatItIs?.[1]?.text ||
        "Cada cuota forma parte del esquema de ahorro previsto por el plan contratado.",
    },
    {
      title: "3. Formas capital",
      body: endFaq?.answer || autoPlan?.whatYouGetAtEnd?.[0]?.text || "Al finalizar, obtenes el capital correspondiente al plan.",
    },
    {
      title: "4. Participan sorteos",
      body: drawsFaq?.answer || "Los sorteos son estimulos dentro del sistema y se rigen por condiciones vigentes.",
    },
    {
      title: "5. Consulta antes",
      body:
        repeatFaq?.answer ||
        "Antes de avanzar conviene entender rescate, adjudicacion, continuidad del titulo y documentacion.",
    },
  ];

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Como funciona",
      title: "Una explicacion simple antes de consultar",
      id: "how-title",
      intro:
        "La prioridad es que sepas que estas evaluando: capitalizacion, ahorro, sorteos estimulo y condiciones vigentes.",
    }),
    el("div", {
      className: "steps-grid",
      children: steps.map((step) =>
        el("article", {
          className: "step-card",
          children: [el("h3", { text: step.title }), el("p", { text: step.body })],
        }),
      ),
    }),
    createCallout(site.legal?.disclaimerText || "Revisa siempre documentacion y condiciones vigentes antes de contratar."),
  );
}

function renderDraws(data) {
  const target = qs("[data-draws-preview]");
  if (!target) return;

  const draws = data.draws || {};
  const lastState = resolveValueState(draws.lastDraw?.date, draws.lastDraw?.status);
  const nextState = resolveValueState(draws.nextDraw?.date, draws.nextDraw?.status);
  const renderableStimuli = (draws.stimuli || []).filter((item) => hasValue(item.winningNumber));

  clear(target);
  target.append(
    el("article", {
      className: "home-panel stack",
      children: [
        createSectionHeader({
          eyebrow: "Sorteos",
          title: "Resultados y proximas fechas",
          id: "draws-title",
          intro: draws.schedule?.officialRule,
        }),
        el("div", {
          className: "facts-row",
          children: [
            createMiniFact({ label: "Ultimo sorteo", value: draws.lastDraw?.date || FALLBACK_TEXT.updating, state: lastState }),
            createMiniFact({ label: "Proximo sorteo", value: draws.nextDraw?.date || FALLBACK_TEXT.updating, state: nextState }),
          ],
        }),
        renderableStimuli.length
          ? el("div", {
              className: "stimuli-grid",
              children: renderableStimuli.map((item) => createMiniFact({ label: item.label, value: item.winningNumber })),
            })
          : createCallout("Los numeros de estimulos se mostraran cuando esten validados en el data pack."),
        createButton({ label: "Ver sorteos", href: "/sorteos/", variant: "secondary" }),
      ],
    }),
  );
}

function findResource(resources, id) {
  return (resources.groups || []).flatMap((group) => group.items || []).find((item) => item.id === id) || null;
}

function renderAdjudications(data) {
  const target = qs("[data-adjudications-preview]");
  if (!target) return;

  const adjudications = data.adjudications || {};
  const officialLink = findResource(data.resources, "adjudicados-oficial");
  const hasRealLocalData = adjudications.meta?.status && !isMockStatus(adjudications.meta.status);
  const years = (adjudications.availableYears || []).map((item) => item.year).filter(Boolean);

  clear(target);
  target.append(
    el("article", {
      className: "home-panel stack",
      children: [
        createSectionHeader({
          eyebrow: "Adjudicados",
          title: "Consulta con fuente clara",
          intro:
            "La preview local queda preparada, pero no publicamos ejemplos mock como si fueran resultados reales.",
        }),
        el("div", {
          className: "facts-row",
          children: [
            createMiniFact({ label: "Historico preparado", value: years.length ? years.join(", ") : FALLBACK_TEXT.updating, state: years.length ? UI_STATES.PARTIAL : UI_STATES.EMPTY }),
            createMiniFact({ label: "Datos locales", value: hasRealLocalData ? "Disponibles" : "En validacion", state: hasRealLocalData ? UI_STATES.READY : UI_STATES.PARTIAL }),
          ],
        }),
        createCallout("Por ahora se prioriza el acceso a la fuente oficial hasta contar con una carga local validada."),
        el("div", {
          className: "cluster",
          children: [
            createButton({ label: "Ver adjudicados", href: "/adjudicados/", variant: "secondary" }),
            officialLink && classifyLinkItem(officialLink) === UI_STATES.READY
              ? createButton({ label: "Fuente oficial", href: officialLink.url, variant: "secondary" })
              : null,
          ],
        }),
      ],
    }),
  );
}

function renderFaq(data) {
  const target = qs("[data-faq-highlight]");
  if (!target) return;

  const selected = PRIORITY_FAQ_IDS.map((id) => getFaqById(data.faq, id)).filter(Boolean);
  const faqs = selected.length ? selected : getFeaturedFaqs(data.faq);

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Dudas clave",
      title: "Preguntas que conviene resolver antes de avanzar",
      id: "faq-title",
      intro: "Seleccionamos las preguntas que mas ayudan a entender capital, sorteos, adjudicacion y proceso asistido.",
    }),
    el("div", {
      className: "accordion-shell faq-home",
      children: faqs.slice(0, 5).map((item) =>
        el("details", {
          children: [el("summary", { text: item.question }), el("p", { text: item.answer })],
        }),
      ),
    }),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver todas las FAQ", href: "/faq/", variant: "secondary" })],
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
  const target = qs("[data-resources-hub]");
  if (!target) return;

  const management = getResourcesByGroup(data.resources, "gestiones");
  const official = getResourcesByGroup(data.resources, "informacion-oficial");
  const items = [...management, ...official].filter((item) => item.featured || ["descargar-boleta", "medios-de-pago"].includes(item.id));

  clear(target);
  target.append(
    createSectionHeader({
      eyebrow: "Recursos utiles",
      title: "Accesos rapidos para pagos y gestiones",
      id: "resources-title",
      intro: "Mostramos enlaces verificados cuando existen. Las gestiones pendientes quedan indicadas sin crear links rotos.",
    }),
    el("div", {
      className: "resource-grid",
      children: items.map(createResourceCard),
    }),
    el("div", {
      className: "section-actions",
      children: [createButton({ label: "Ver recursos", href: "/recursos/", variant: "secondary" })],
    }),
  );
}

function renderFinalCta(data) {
  const target = qs("[data-final-cta]");
  if (!target) return;

  const { site } = data;
  const primaryCta = getPrimaryCta(site);
  const whatsappReady = isValidUrl(site.cta?.whatsapp?.target);

  clear(target);
  target.append(
    el("article", {
      className: "final-cta",
      children: [
        el("div", {
          className: "final-cta__copy",
          children: [
            el("span", { className: "badge", text: "Asesoramiento asistido" }),
            el("h2", { attrs: { id: "contact-title" }, text: "Hablemos antes de que tomes una decision" }),
            el("p", {
              text:
                "Contanos que objetivo tenes y te ayudamos a revisar el plan, las condiciones y los pasos para avanzar con informacion clara.",
            }),
          ],
        }),
        el("div", {
          className: "final-cta__actions",
          children: [
            createButton({ label: primaryCta.label, href: primaryCta.href, variant: "primary" }),
            whatsappReady
              ? createButton({ label: site.cta.whatsapp.label || "Hablar por WhatsApp", href: site.cta.whatsapp.target, variant: "secondary" })
              : el("span", { className: "badge badge--warning", text: "WhatsApp en configuracion" }),
          ],
        }),
      ],
    }),
  );
}

export async function initHomePage() {
  const data = await loadAllForHome();
  renderHero(data);
  renderTrust(data);
  renderPlans(data);
  renderHowItWorks(data);
  renderDraws(data);
  renderAdjudications(data);
  renderFaq(data);
  renderResources(data);
  renderFinalCta(data);
}
