import { loadAgencyContact, loadSite } from "./modules/data/api.js?v=20260715-2";
import { renderShell } from "./modules/components/shell.js?v=20260714-21";

const LOADER_EXIT_MS = 220;

function waitForSiteStyles() {
  const stylesheet = document.querySelector("[data-site-styles]");
  if (!stylesheet || stylesheet.dataset.loaded === "true" || stylesheet.sheet) return Promise.resolve();

  return Promise.race([
    new Promise((resolve) => {
      stylesheet.addEventListener("load", resolve, { once: true });
      stylesheet.addEventListener("error", resolve, { once: true });
    }),
    new Promise((resolve) => window.setTimeout(resolve, 4000)),
  ]).then(
    () =>
      new Promise((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
      }),
  );
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

async function startPageController(site, agencyContact) {
  if (document.body.dataset.page === "home") {
    const { initHomePage } = await import("./modules/pages/home.js?v=20260714-41");
    return initHomePage(site);
  }

  if (document.body.dataset.page === "planes") {
    const { initPlansHub } = await import("./modules/pages/plans/index.js?v=20260714-40");
    return initPlansHub(site);
  }

  if (document.body.dataset.page === "adjudicados") {
    const { initAdjudicationsPage } = await import("./modules/pages/info-pages.js?v=20260715-2");
    return initAdjudicationsPage(site);
  }

  if (document.body.dataset.page === "como-funciona") {
    const { initSystemGuidePage } = await import("./modules/pages/info-pages.js?v=20260715-3");
    return initSystemGuidePage(site);
  }

  if (document.body.dataset.page === "privacidad") {
    const { initPrivacyPage } = await import("./modules/pages/privacy.js?v=20260715-3");
    return initPrivacyPage(site);
  }

  if (document.body.dataset.page === "recomenda-y-gana") {
    const { initReferralProgramPage } = await import("./modules/pages/referral-program.js?v=20260714-30");
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
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    await waitForSiteStyles();
    await finishAppLoading();
  }
}

boot();
