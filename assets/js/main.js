import { loadAgencyContact, loadSite } from "./modules/data/api.js";
import { renderShell } from "./modules/components/shell.js";
import { initHomePage } from "./modules/pages/home.js";
import { initAdjudicationsPage, initSystemGuidePage } from "./modules/pages/info-pages.js";
import { initPlansHub } from "./modules/pages/plans/index.js";
import { initPrivacyPage } from "./modules/pages/privacy.js";

function finishAppLoading() {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("app-loading");
    document.documentElement.classList.add("app-ready");
  });
}

function startPageController(site) {
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
    finishAppLoading();

    await startPageController(site);
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    finishAppLoading();
  }
}

boot();
