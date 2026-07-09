import { isBlank } from "../utils/validators.js";

export const DATA_ROOT = "/data";

export const DATASETS = Object.freeze({
  site: "site.json",
  artemisBackup: "artemis-backup.json",
  planCatalog: "plan_catalog.json",
  faq: "faq.json",
  resources: "resources.json",
  socialReviews: "social-reviews.json",
  recruitment: "recruitment.json",
  videos: "videos.json",
  agencyContact: "agency-contact.json",
});

const cache = new Map();

const ARTEMIS_BASE_URL = "https://artemis.clubsanjorge.com.ar";
const ARTEMIS_MEDIA_ISSUE_URL = `${ARTEMIS_BASE_URL}/api/stream/whJeJzzt07DTV9RS7HIkGPND1uptZxvl/media/issue`;
const ARTEMIS_WINNER_IMAGE_BASE = `${ARTEMIS_BASE_URL}/images/winners`;
const ARTEMIS_TIMEOUT_MS = 4500;
const ARTEMIS_BACKUP_SOURCE = "local_artemis_backup";
const ADJUDICATION_LOOKBACK_YEARS = 3;
const ADJUDICATION_COLUMNS = Object.freeze([
  { key: "name", label: "Nombre" },
  { key: "address", label: "Domicilio" },
  { key: "locality", label: "Localidad" },
  { key: "installment", label: "Cuota" },
]);

const EMPTY_DRAWS = Object.freeze({
  meta: {
    source: "artemis_api",
    status: "pending_validation",
  },
  schedule: {
    officialRule: "Los sorteos se realizan mediante la Lotería de la Ciudad de Buenos Aires / LOTBA, en la última jugada del último sábado de cada mes, salvo excepciones aprobadas.",
    status: "verified",
  },
  lastDraw: {
    date: "",
    status: "pending_validation",
    source: "artemis_api",
  },
  nextDraw: {
    date: "",
    status: "pending_validation",
    source: "artemis_api",
  },
  stimuli: [],
});

const EMPTY_HOME_ADJUDICATIONS = Object.freeze({
  meta: {
    source: "artemis_api",
    status: "pending_validation",
  },
  section: {
    eyebrow: "Adjudicados",
    title: "Conocé a nuestros adjudicados",
    intro: "Historias reales de suscriptores que ya recibieron su premio.",
    cta: {
      label: "Ver más adjudicados",
      href: "/adjudicados/",
    },
  },
  items: [],
});

export async function fetchJson(path, options = {}) {
  if (cache.has(path)) return cache.get(path);

  const controller = options.timeoutMs ? new AbortController() : null;
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  const request = fetch(path, controller ? { signal: controller.signal } : undefined)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${path} (${response.status})`);
      }
      return response.json();
    })
    .catch((error) => {
      cache.delete(path);
      throw error;
    })
    .finally(() => {
      if (timeout) window.clearTimeout(timeout);
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
export const loadArtemisBackup = () => loadDataset("artemisBackup");
export const loadPlanCatalog = () => loadDataset("planCatalog");
export const loadFaq = () => loadDataset("faq");
export const loadResources = () => loadDataset("resources");
export const loadDraws = () => loadOfficialDraws();
export const loadAdjudicationsForPeriod = (year, month) => loadOfficialAdjudicationsForPeriod(year, month);
export const loadHomeAdjudications = () => loadOfficialHomeAdjudications();
export const loadSocialReviews = () => loadDataset("socialReviews");
export const loadRecruitment = () => loadDataset("recruitment");
export const loadVideos = () => loadDataset("videos");
export const loadAgencyContact = () => loadDataset("agencyContact");

function artemisIssuesUrl(query, options = {}) {
  const url = new URL(ARTEMIS_MEDIA_ISSUE_URL);
  url.searchParams.set("q", JSON.stringify(query));
  url.searchParams.set("h", JSON.stringify(options));
  return url.toString();
}

async function fetchArtemisIssues(query, options) {
  return fetchJson(artemisIssuesUrl(query, options), { timeoutMs: ARTEMIS_TIMEOUT_MS });
}

async function loadSafeArtemisBackup() {
  try {
    return await loadArtemisBackup();
  } catch (error) {
    console.warn("No se pudo cargar el backup local de Artemis.", error);
    return null;
  }
}

function backupMeta(backup, kind) {
  return {
    source: ARTEMIS_BACKUP_SOURCE,
    status: "partial",
    fallbackOf: kind,
    generatedAt: backup?.meta?.generatedAt || "",
  };
}

function withBackupMeta(value, backup, kind) {
  return {
    ...value,
    meta: {
      ...(value?.meta || {}),
      ...backupMeta(backup, kind),
    },
  };
}

function normalizeArtemisText(value) {
  const text = String(value || "").trim();
  if (!/[ÃÂ]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from([...text].map((character) => character.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return text;
  }
}

function slugify(value) {
  return normalizeArtemisText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateFromArtemisSegment(value) {
  return normalizeArtemisText(value).split(";")[0]?.trim() || "";
}

function parseDrawsFromArtemis(payload, fallback) {
  const issueDescr = payload?.[0]?.issue_descr || [];
  const numbers = normalizeArtemisText(issueDescr[0])
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const lastDate = dateFromArtemisSegment(issueDescr[1]);
  const nextDate = dateFromArtemisSegment(issueDescr[2]);

  if (!numbers.length && !lastDate && !nextDate) return fallback;

  return {
    ...fallback,
    meta: {
      ...(fallback?.meta || {}),
      source: "artemis_api",
      status: "verified",
    },
    lastDraw: {
      ...(fallback?.lastDraw || {}),
      date: lastDate ? `${lastDate} LOTBA` : fallback?.lastDraw?.date,
      status: "verified",
      source: "artemis_api",
    },
    nextDraw: {
      ...(fallback?.nextDraw || {}),
      date: nextDate || fallback?.nextDraw?.date,
      status: "verified",
      source: "artemis_api",
    },
    stimuli: numbers.map((winningNumber, index) => ({
      position: index + 1,
      label: `${index + 1}° Estímulo`,
      winningNumber,
      status: "verified",
      source: "artemis_api",
    })),
  };
}

function installmentFromArtemisDetail(value) {
  const rawInstallment = normalizeArtemisText(value).split(";")[0]?.trim() || "";
  const numericInstallment = Number(rawInstallment);
  return Number.isFinite(numericInstallment) && rawInstallment ? String(numericInstallment) : rawInstallment;
}

function drawDateFromArtemisDetail(value) {
  return normalizeArtemisText(value).split(";")[1]?.trim() || "";
}

function padTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function issueSummaryFromPeriod(year, month) {
  return `01/${padTwoDigits(month)}/${year}`;
}

function parseAdjudicationsFromArtemis(payload) {
  return (Array.isArray(payload) ? payload : [])
    .map((entry) => {
      const issueDescr = entry?.issue_descr || [];
      const name = normalizeArtemisText(issueDescr[0]);
      const address = normalizeArtemisText(issueDescr[1]);
      const locality = normalizeArtemisText(issueDescr[2]);
      const installment = installmentFromArtemisDetail(issueDescr[3]);

      if (!name) return null;

      return {
        name,
        address,
        locality,
        installment,
        source: "artemis_api",
      };
    })
    .filter(Boolean);
}

function parseHomeAdjudicationsFromArtemis(payload, fallback) {
  const items = (Array.isArray(payload) ? payload : [])
    .map((entry, index) => {
      const issueDescr = entry?.issue_descr || [];
      const name = normalizeArtemisText(issueDescr[0]);
      const residence = normalizeArtemisText(issueDescr[2]);
      const detail = normalizeArtemisText(issueDescr[3]);
      const prize = normalizeArtemisText(issueDescr[4]);
      const imageNumber = normalizeArtemisText(issueDescr[5]);
      const installment = installmentFromArtemisDetail(detail);
      const drawDate = drawDateFromArtemisDetail(detail);

      if (!name || !installment || !drawDate || !prize || !imageNumber) return null;

      return {
        id: slugify(`${name}-${imageNumber}`) || `adjudicado-${index + 1}`,
        name,
        installment,
        drawDate,
        prize,
        residence,
        imageUrl: `${ARTEMIS_WINNER_IMAGE_BASE}/${imageNumber}.webp`,
        imageAlt: `${name} en una entrega de adjudicación de Club San Jorge`,
        source: "artemis_api",
      };
    })
    .filter(Boolean);

  if (!items.length) return fallback;

  return {
    ...fallback,
    meta: {
      ...(fallback?.meta || {}),
      source: "artemis_api",
      status: "verified",
    },
    items,
  };
}

async function loadOfficialDraws() {
  try {
    const payload = await fetchArtemisIssues(
      { related_project: "SORTEO", issue_summary: "ULTIMO" },
      { columns: ["issue_descr"] },
    );
    return parseDrawsFromArtemis(payload, EMPTY_DRAWS);
  } catch (error) {
    console.warn("No se pudo cargar el sorteo desde Artemis.", error);
    const backup = await loadSafeArtemisBackup();
    if (backup?.draws?.stimuli?.length || backup?.draws?.lastDraw?.date) {
      return withBackupMeta(backup.draws, backup, "draws");
    }
    return EMPTY_DRAWS;
  }
}

async function loadOfficialHomeAdjudications() {
  try {
    const payload = await fetchArtemisIssues(
      { assigned_to: 6, status: "CLOSED", related_project: "ADJUDI" },
      { columns: ["issue_descr"], offset: 0, limit: 8 },
    );
    return parseHomeAdjudicationsFromArtemis(payload, EMPTY_HOME_ADJUDICATIONS);
  } catch (error) {
    console.warn("No se pudieron cargar adjudicados desde Artemis.", error);
    const backup = await loadSafeArtemisBackup();
    if (backup?.homeAdjudications?.items?.length) {
      return withBackupMeta(backup.homeAdjudications, backup, "home_adjudications");
    }
    return EMPTY_HOME_ADJUDICATIONS;
  }
}

async function loadOfficialAdjudicationsForPeriod(year, month) {
  try {
    const payload = await fetchArtemisIssues(
      { related_project: "ADJUDI", issue_summary: issueSummaryFromPeriod(year, month) },
      { columns: ["issue_descr"] },
    );

    return {
      meta: {
        source: "artemis_api",
        status: "verified",
      },
      columns: ADJUDICATION_COLUMNS,
      rows: parseAdjudicationsFromArtemis(payload),
    };
  } catch (error) {
    console.warn("No se pudieron cargar adjudicados desde Artemis.", error);
    const backup = await loadSafeArtemisBackup();
    const periodKey = `${year}-${padTwoDigits(month)}`;
    const period = backup?.adjudications?.periods?.[periodKey];
    if (period) {
      return {
        meta: {
          ...backupMeta(backup, "adjudications"),
          periodKey,
        },
        columns: backup?.adjudications?.columns || ADJUDICATION_COLUMNS,
        rows: period.rows || [],
      };
    }

    return {
      meta: {
        source: "artemis_api",
        status: "pending_validation",
      },
      columns: ADJUDICATION_COLUMNS,
      rows: [],
    };
  }
}

export async function loadHomeData() {
  const [site, planCatalog, resources, draws, homeAdjudications, socialReviews, recruitment, videos] = await Promise.all([
    loadSite(),
    loadPlanCatalog(),
    loadResources(),
    loadDraws(),
    loadHomeAdjudications(),
    loadSocialReviews(),
    loadRecruitment(),
    loadVideos(),
  ]);

  return { site, planCatalog, resources, draws, homeAdjudications, socialReviews, recruitment, videos };
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

export function getDrawStimuli(drawsData) {
  return [...(drawsData?.stimuli || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
}

export function getAdjudicationYears() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - ADJUDICATION_LOOKBACK_YEARS + 1;
  return Array.from({ length: ADJUDICATION_LOOKBACK_YEARS }, (_, index) => currentYear - index).filter((year) => year >= startYear);
}

export function getAdjudicationMonths(year) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const maxMonth = Number(year) === currentYear ? today.getMonth() : 12;

  return {
    months: Array.from({ length: maxMonth }, (_, index) => index + 1),
    status: "verified",
  };
}

export function getAdjudicationColumns() {
  return ADJUDICATION_COLUMNS;
}

export function normalizeInternalTarget(target) {
  if (isBlank(target)) return "";

  return target;
}
