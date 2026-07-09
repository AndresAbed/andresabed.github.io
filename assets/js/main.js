import { loadSite } from "./data/api.js";
import { renderShell } from "./components/shell.js";
import { initContactPage } from "./pages/contact.js";
import { initHomePage } from "./pages/home.js";
import { initAdjudicationsPage, initDrawsPage, initResourcesPage, initSystemGuidePage } from "./pages/info-pages.js";
import { initPlansHub } from "./pages/plans/index.js";

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
    } else if (document.body.dataset.page === "sorteos") {
      await initDrawsPage(site);
    } else if (document.body.dataset.page === "adjudicados") {
      await initAdjudicationsPage(site);
    } else if (document.body.dataset.page === "recursos") {
      await initResourcesPage(site);
    } else if (document.body.dataset.page === "como-funciona") {
      await initSystemGuidePage(site);
    } else if (document.body.dataset.page === "contacto") {
      await initContactPage(site);
    }
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    finishAppLoading();
  }
}

boot();
