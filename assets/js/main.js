import { loadSite } from "./data/api.js?v=artemis-live-data-v1";
import { renderShell } from "./components/shell.js?v=artemis-live-data-v1";
import { initContactPage } from "./pages/contact.js?v=artemis-live-data-v1";
import { initHomePage } from "./pages/home.js?v=artemis-live-data-v1";
import { initAdjudicationsPage, initDrawsPage, initFaqPage, initResourcesPage } from "./pages/info-pages.js?v=artemis-live-data-v1";
import { initPlanDetail, initPlansHub } from "./pages/plans.js?v=artemis-live-data-v1";
import { initBasePage } from "./pages/base.js?v=artemis-live-data-v1";

function finishAppLoading() {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("app-loading");
    document.documentElement.classList.add("app-ready");
  });
}

async function boot() {
  try {
    const site = await loadSite();
    renderShell(site);

    if (document.body.dataset.page === "home") {
      await initHomePage(site);
    } else if (document.body.dataset.page === "planes") {
      await initPlansHub(site);
    } else if (document.body.dataset.page === "plan-detail") {
      await initPlanDetail(site);
    } else if (document.body.dataset.page === "sorteos") {
      await initDrawsPage(site);
    } else if (document.body.dataset.page === "adjudicados") {
      await initAdjudicationsPage(site);
    } else if (document.body.dataset.page === "recursos") {
      await initResourcesPage(site);
    } else if (document.body.dataset.page === "preguntas-frecuentes") {
      await initFaqPage(site);
    } else if (document.body.dataset.page === "contacto") {
      await initContactPage(site);
    } else {
      await initBasePage(site);
    }
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    finishAppLoading();
  }
}

boot();
