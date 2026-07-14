import {
  hasCompleteHomeAdjudications,
  loadArtemisBackup,
  loadHomeData,
  loadPlanCatalog,
  loadRecruitment,
  loadReferralProgram,
  loadResources,
  loadSocialReviews,
  loadVideos,
} from "../data/api.js?v=20260714-33";
import { renderHero } from "./home/hero.js";
import { renderPlanRoutes } from "./home/plan-routes.js";
import { renderHomeAdjudications } from "./home/adjudications.js";
import { renderSocialReviews } from "./home/social-reviews.js";
import { renderSubscriberResources } from "./home/subscriber-resources.js";
import { renderRecruitment } from "./home/recruitment.js?v=20260714-29";
import { renderReferralProgram } from "./home/referral-program.js?v=20260714-25";

function renderHomeSections(data) {
  renderHero(data);
  renderPlanRoutes(data);
  renderHomeAdjudications(data);
  renderSocialReviews(data);
  renderSubscriberResources(data);
  renderReferralProgram(data);
  renderRecruitment(data);
}

async function loadHomeFallbackData(site) {
  const [planCatalog, resources, artemisBackup, socialReviews, recruitment, referralProgram, videos] = await Promise.all([
    loadPlanCatalog(),
    loadResources(),
    loadArtemisBackup(),
    loadSocialReviews(),
    loadRecruitment(),
    loadReferralProgram(),
    loadVideos(),
  ]);

  return {
    site,
    planCatalog,
    resources,
    draws: artemisBackup?.draws || {},
    homeAdjudications: hasCompleteHomeAdjudications(artemisBackup?.homeAdjudications) ? artemisBackup.homeAdjudications : {},
    socialReviews,
    recruitment,
    referralProgram,
    videos,
  };
}

export function initHomePage(site) {
  return loadHomeData()
    .then(renderHomeSections)
    .catch(async (error) => {
      console.warn("No se pudo cargar Home completa. Se intenta renderizar el respaldo inicial.", error);
      const fallbackData = await loadHomeFallbackData(site);
      renderHomeSections(fallbackData);
    });
}
