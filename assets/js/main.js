import { loadSite } from "./modules/data/api.js";
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

async function boot() {
  try {
    const site = await loadSite();
    renderShell(site);

    if (document.body.dataset.page === "home") {
      await initHomePage(site);
    } else if (document.body.dataset.page === "planes") {
      await initPlansHub(site);
    } else if (document.body.dataset.page === "adjudicados") {
      await initAdjudicationsPage(site);
    } else if (document.body.dataset.page === "como-funciona") {
      await initSystemGuidePage(site);
    } else if (document.body.dataset.page === "privacidad") {
      await initPrivacyPage(site);
    }
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add("has-data-error");
  } finally {
    finishAppLoading();
  }
}

boot();
