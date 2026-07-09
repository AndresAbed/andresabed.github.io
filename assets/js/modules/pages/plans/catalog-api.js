import { loadPlanCatalog } from "../../data/api.js";
import { withPlanMediaMetadata } from "./catalog-assets.js";
import { normalizeLivePlan, normalizeSnapshotPlan, sortPlans } from "./catalog-normalize.js";

const ARTEMIS_PLAN_CATALOG_URL =
  "https://artemis.clubsanjorge.com.ar/api/stream/whJeJzzt07DTV9RS7HIkGPND1uptZxvl/media/listapre";
const ARTEMIS_PLAN_TIMEOUT_MS = 4500;

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

export async function loadCatalogPlans() {
  try {
    const rows = await fetchLiveRows();
    const items = await withPlanMediaMetadata(normalizeLiveRows(rows));
    return {
      meta: {
        source: "artemis_api",
        status: "verified",
        loadedAt: new Date().toISOString(),
      },
      items,
    };
  } catch (error) {
    console.warn("No se pudo cargar el catalogo vivo desde Artemis.", error);
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
}
