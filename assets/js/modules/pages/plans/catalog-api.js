import { loadPlanCatalog } from "../../data/api.js";
import { withPlanMediaMetadata } from "./catalog-assets.js";
import { normalizeLivePlan, normalizeSnapshotPlan, sortPlans } from "./catalog-normalize.js";

const ARTEMIS_PLAN_CATALOG_URL =
  "https://artemis.clubsanjorge.com.ar/api/stream/whJeJzzt07DTV9RS7HIkGPND1uptZxvl/media/listapre";
const ARTEMIS_PLAN_TIMEOUT_MS = 1400;
const MIN_LIVE_PLAN_ROWS = 10;

const PLAN_COLUMNS = Object.freeze([
  "activo",
  "plan",
  "descsart",
  "articulo",
  "orden",
  "impocuo",
  "impovn",
  "cantprem",
  "cate",
  "subcate",
]);

function catalogUrl() {
  const url = new URL(ARTEMIS_PLAN_CATALOG_URL);
  url.searchParams.set("q", JSON.stringify({ activo: 1 }));
  url.searchParams.set("h", JSON.stringify({ columns: PLAN_COLUMNS }));
  return url.toString();
}

async function fetchLiveRows() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ARTEMIS_PLAN_TIMEOUT_MS);
  const response = await fetch(catalogUrl(), {
    signal: controller.signal,
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
  }).finally(() => {
    window.clearTimeout(timeout);
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el catalogo Artemis (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("El catalogo Artemis no devolvio una lista valida.");
  }
  return payload;
}

function normalizeLiveRows(rows) {
  return sortPlans(rows.map(normalizeLivePlan).filter((item) => item.article && item.displayName));
}

function normalizeFallbackSnapshot(snapshot) {
  return sortPlans((snapshot?.items || []).map(normalizeSnapshotPlan).filter((item) => item.article && item.displayName));
}

export async function loadSnapshotCatalogPlans() {
  const fallback = await loadPlanCatalog();
  const items = await withPlanMediaMetadata(normalizeFallbackSnapshot(fallback));

  return {
    meta: {
      source: "local_snapshot_fallback",
      status: "partial",
      loadedAt: new Date().toISOString(),
    },
    items,
  };
}

function hasUsableCatalog(catalog) {
  return (catalog?.items || []).length >= MIN_LIVE_PLAN_ROWS;
}

export async function loadLiveCatalogPlans() {
  const rows = await fetchLiveRows();
  if (rows.length < MIN_LIVE_PLAN_ROWS) {
    throw new Error("El catalogo Artemis devolvio una lista incompleta.");
  }

  const items = await withPlanMediaMetadata(normalizeLiveRows(rows));
  if (items.length < MIN_LIVE_PLAN_ROWS) {
    throw new Error("El catalogo Artemis no tiene suficientes planes validos.");
  }

  return {
    meta: {
      source: "artemis_api",
      status: "verified",
      loadedAt: new Date().toISOString(),
    },
    items,
  };
}

export async function loadCatalogPlans() {
  let snapshot = null;

  try {
    snapshot = await loadSnapshotCatalogPlans();
    if (hasUsableCatalog(snapshot)) return snapshot;

    console.warn("El catalogo local no tiene suficientes planes. Se intenta Artemis como segunda opcion.");
  } catch (error) {
    console.warn("No se pudo cargar el catalogo local de planes. Se intenta Artemis como segunda opcion.", error);
  }

  try {
    return await loadLiveCatalogPlans();
  } catch (error) {
    if (snapshot?.items?.length) {
      console.warn("Artemis no devolvio un catalogo usable. Se mantiene el catalogo local disponible.", error);
      return snapshot;
    }

    throw error;
  }
}
