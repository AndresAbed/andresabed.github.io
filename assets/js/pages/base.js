import { getPlanBySlug, loadPlans } from "../data/api.js";
import { createStatusBox } from "../components/status-box.js";
import { clear, qs } from "../utils/dom.js";
import { UI_STATES } from "../utils/status.js";

const PAGE_COPY = {
  planes: {
    title: "Planes",
    body: "Hub base para cards, comparador y accesos a planes especificos.",
    state: UI_STATES.PARTIAL,
  },
  sorteos: {
    title: "Sorteos",
    body: "Estructura preparada para mostrar regla oficial y resultados cuando esten validados.",
    state: UI_STATES.PARTIAL,
  },
  adjudicados: {
    title: "Adjudicados",
    body: "Base preparada para tabla futura o enlace oficial, sin publicar datos mock como reales.",
    state: UI_STATES.EMPTY,
  },
  recursos: {
    title: "Recursos",
    body: "Hub base para pagos, gestiones y fuentes oficiales con manejo de links faltantes.",
    state: UI_STATES.PARTIAL,
  },
  "preguntas-frecuentes": {
    title: "Preguntas frecuentes",
    body: "Base para respuestas accesibles alimentadas por categorias del data pack.",
    state: UI_STATES.PARTIAL,
  },
  contacto: {
    title: "Contacto",
    body: "Base para solicitud asistida. El envio queda deshabilitado hasta configurar endpoint y canales.",
    state: UI_STATES.DISABLED,
  },
};

async function getPlanCopy(slug) {
  const plans = await loadPlans();
  const plan = getPlanBySlug(plans, slug);
  return {
    title: plan?.name || "Plan",
    body: plan?.summary || "Pagina base de plan preparada para contenido detallado futuro.",
    state: plan?.slug === "auto-330" ? UI_STATES.READY : UI_STATES.PARTIAL,
  };
}

export async function initBasePage() {
  const target = qs("[data-page-status]");
  if (!target) return;

  const page = document.body.dataset.page;
  const planSlug = document.body.dataset.planSlug;
  const copy = planSlug ? await getPlanCopy(planSlug) : PAGE_COPY[page];

  clear(target);
  target.append(
    createStatusBox({
      state: copy?.state || UI_STATES.EMPTY,
      title: copy?.title || "Contenido en preparacion",
      body: copy?.body || "La estructura esta lista para la siguiente etapa.",
    }),
  );
}
