import { loadSite } from "./data/api.js";
import { renderShell } from "./components/shell.js?v=header-scroll-3";
import { initContactPage } from "./pages/contact.js";
import { initHomePage } from "./pages/home.js?v=home-drawcard-v6";
import { initAdjudicationsPage, initDrawsPage, initFaqPage, initResourcesPage } from "./pages/info-pages.js";
import { initPlanDetail, initPlansHub } from "./pages/plans.js";
import { initBasePage } from "./pages/base.js";

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
