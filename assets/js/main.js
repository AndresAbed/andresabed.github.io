import { loadAgencyContact, loadSite } from "./modules/data/api.js";
import { renderShell } from "./modules/components/shell.js?v=20260714-20";
import { initHomePage } from "./modules/pages/home.js?v=20260714-22";
import { initAdjudicationsPage, initSystemGuidePage } from "./modules/pages/info-pages.js";
import { initPlansHub } from "./modules/pages/plans/index.js";
import { initPrivacyPage } from "./modules/pages/privacy.js";
import { initReferralProgramPage } from "./modules/pages/referral-program.js?v=20260714-23";

const LOADER_EXIT_MS = 420;
const CRITICAL_ASSET_TIMEOUT_MS = 2800;

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function imageReady(image) {
  return image.complete && image.naturalWidth > 0;
}

function waitForImage(image) {
  if (imageReady(image) || (!image.currentSrc && !image.src)) return Promise.resolve();

  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function isCriticalImage(image) {
  if (image.loading !== "lazy") return true;

  const bounds = image.getBoundingClientRect();
  return bounds.top < window.innerHeight * 1.25 && bounds.bottom > -window.innerHeight * 0.25;
}

async function waitForCriticalAssets() {
  const images = [...document.images].filter(isCriticalImage);
  const fontReady = document.fonts?.ready?.catch?.(() => null) || Promise.resolve();

  await Promise.race([
    Promise.all([...images.map(waitForImage), fontReady]),
    delay(CRITICAL_ASSET_TIMEOUT_MS),
  ]);
}

function finishAppLoading() {
  const root = document.documentElement;
  if (window.__appLoadingFallback) window.clearTimeout(window.__appLoadingFallback);

  if (!root.classList.contains("app-loading")) {
    root.classList.remove("app-loading-exit");
    root.classList.add("app-ready");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      root.classList.add("app-loading-exit");
      root.classList.remove("app-loading");

      window.setTimeout(() => {
        root.classList.remove("app-loading-exit");
        root.classList.add("app-ready");
        resolve();
      }, LOADER_EXIT_MS);
    });
  });
}

function startPageController(site, agencyContact) {
  if (document.body.dataset.page === "home") {
    return initHomePage(site);
  }

  if (document.body.dataset.page === "planes") {
    return initPlansHub(site);
  }

  if (document.body.dataset.page === "adjudicados") {
    return initAdjudicationsPage(site);
  }

  if (document.body.dataset.page === "como-funciona") {
    return initSystemGuidePage(site);
  }

  if (document.body.dataset.page === "privacidad") {
    return initPrivacyPage(site);
  }

  if (document.body.dataset.page === "recomenda-y-gana") {
    return initReferralProgramPage(site, agencyContact);
  }

  return null;
}

async function boot() {
  try {
    const [site, agencyContact] = await Promise.all([
      loadSite(),
      loadAgencyContact().catch((error) => {
        console.warn("No se pudo cargar la configuracion de contacto.", error);
        return null;
      }),
    ]);
    renderShell(site, agencyContact);

    await startPageController(site, agencyContact);
    await waitForCriticalAssets();
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    await finishAppLoading();
  }
}

boot();
