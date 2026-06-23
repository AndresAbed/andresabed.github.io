import { isBlank } from "../utils/validators.js";

export const DATA_ROOT = "/data_pack_v2";

export const DATASETS = Object.freeze({
  site: "site.json",
  plans: "plans.json",
  planCatalog: "plan_catalog.json",
  faq: "faq.json",
  resources: "resources.json",
  draws: "draws.json",
  adjudications: "adjudications.json",
  videos: "videos.json",
  homeSections: "home-sections.json",
  agencyContact: "agency-contact.json",
});

const cache = new Map();

export async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);

  const request = fetch(path).then(async (response) => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${path} (${response.status})`);
    }
    return response.json();
  });

  cache.set(path, request);
  return request;
}

export async function loadDataset(name) {
  const file = DATASETS[name];
  if (!file) throw new Error(`Dataset desconocido: ${name}`);
  return fetchJson(`${DATA_ROOT}/${file}`);
}

export const loadSite = () => loadDataset("site");
export const loadPlans = () => loadDataset("plans");
export const loadPlanCatalog = () => loadDataset("planCatalog");
export const loadFaq = () => loadDataset("faq");
export const loadResources = () => loadDataset("resources");
export const loadDraws = () => loadDataset("draws");
export const loadAdjudications = () => loadDataset("adjudications");
export const loadVideos = () => loadDataset("videos");
export const loadHomeSections = () => loadDataset("homeSections");
export const loadAgencyContact = () => loadDataset("agencyContact");

export async function loadAllForHome() {
  const [site, plans, planCatalog, faq, resources, draws, adjudications, homeSections, videos] = await Promise.all([
    loadSite(),
    loadPlans(),
    loadPlanCatalog(),
    loadFaq(),
    loadResources(),
    loadDraws(),
    loadAdjudications(),
    loadHomeSections(),
    loadVideos(),
  ]);

  return { site, plans, planCatalog, faq, resources, draws, adjudications, homeSections, videos };
}

export function getPlanBySlug(plansData, slug) {
  return plansData?.plans?.find((plan) => plan.slug === slug) || null;
}

export function getVisiblePlans(plansData) {
  return [...(plansData?.plans || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getFeaturedPlan(plansData) {
  const slug = plansData?.meta?.featuredPlanSlug;
  return getPlanBySlug(plansData, slug) || plansData?.plans?.find((plan) => plan.featured) || null;
}

export function getCatalogCategories(catalogData) {
  return [...(catalogData?.categories || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getCatalogItems(catalogData) {
  return [...(catalogData?.items || [])];
}

export function getCatalogItemsByCategory(catalogData, categorySlug) {
  return getCatalogItems(catalogData).filter((item) => item.category === categorySlug);
}

export function getFeaturedCatalogItems(catalogData, limit = 6) {
  const categories = getCatalogCategories(catalogData);
  const featured = categories.flatMap((category) =>
    getCatalogItemsByCategory(catalogData, category.slug)
      .filter((item) => item.featured)
      .slice(0, 2),
  );
  const fallback = getCatalogItems(catalogData).slice(0, limit);
  return (featured.length ? featured : fallback).slice(0, limit);
}

export function getCatalogItemBySlug(catalogData, slug) {
  return getCatalogItems(catalogData).find((item) => item.slug === slug) || null;
}

export function getCategoryBySlug(catalogData, slug) {
  return getCatalogCategories(catalogData).find((category) => category.slug === slug) || null;
}

export function flattenFaqs(faqData) {
  return (faqData?.categories || []).flatMap((category) =>
    (category.items || []).map((item) => ({ ...item, categorySlug: category.slug, categoryTitle: category.title })),
  );
}

export function getFaqById(faqData, id) {
  return flattenFaqs(faqData).find((item) => item.id === id) || null;
}

export function getFeaturedFaqs(faqData) {
  const ids = faqData?.featuredFaqIds || [];
  return ids.map((id) => getFaqById(faqData, id)).filter(Boolean);
}

export function getFaqsForPlan(faqData, plan) {
  return (plan?.faqRefs || []).map((id) => getFaqById(faqData, id)).filter(Boolean);
}

export function getPlanDisclaimers(plan) {
  return [
    ...(plan?.whatYouGetAtEnd || []),
    ...(plan?.importantClarifications || []),
  ].filter((item) => item?.text);
}

export function getResourcesByGroup(resourcesData, slug) {
  return resourcesData?.groups?.find((group) => group.slug === slug)?.items || [];
}

export function getResourceById(resourcesData, id) {
  return (resourcesData?.groups || []).flatMap((group) => group.items || []).find((item) => item.id === id) || null;
}

export function getResourceGroups(resourcesData) {
  return [...(resourcesData?.groups || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getFeaturedResources(resourcesData) {
  return getResourceGroups(resourcesData).flatMap((group) => (group.items || []).filter((item) => item.featured));
}

export function getFaqCategories(faqData) {
  return [...(faqData?.categories || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getPrioritizedFaqs(faqData, ids = []) {
  return ids.map((id) => getFaqById(faqData, id)).filter(Boolean);
}

export function getDrawStimuli(drawsData) {
  return [...(drawsData?.stimuli || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
}

export function getAdjudicationYears(adjudicationsData) {
  return (adjudicationsData?.availableYears || []).map((item) => item.year).filter(Boolean);
}

export function getAdjudicationMonths(adjudicationsData, year) {
  const entry = adjudicationsData?.availableMonthsByYear?.[String(year)];
  return {
    months: entry?.months || [],
    status: entry?.status || "unknown",
  };
}

export function getAdjudicationsFor(adjudicationsData, year, month) {
  return adjudicationsData?.data?.[String(year)]?.[String(month)] || [];
}

export function getAdjudicationColumns(adjudicationsData) {
  return adjudicationsData?.meta?.tableColumns || [];
}

export function normalizeInternalTarget(target) {
  if (isBlank(target)) return "";

  // Legacy compatibility for older data packs that pointed to the old assisted-request route.
  if (String(target).startsWith("/iniciar-solicitud")) {
    const url = new URL(String(target), window.location.origin);
    return `/contacto/${url.search}`;
  }

  return target;
}
