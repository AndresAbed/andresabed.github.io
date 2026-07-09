import { loadHomeData } from "../data/api.js";
import { renderHero } from "./home/hero.js";
import { renderPlanRoutes } from "./home/plan-routes.js";
import { renderHomeAdjudications } from "./home/adjudications.js";
import { renderSocialReviews } from "./home/social-reviews.js";
import { renderSubscriberResources } from "./home/subscriber-resources.js";
import { renderRecruitment } from "./home/recruitment.js";

function createInitialHomeData(site) {
  return {
    site,
    draws: {
      lastDraw: {},
      nextDraw: {},
      stimuli: [],
    },
    videos: {
      items: [],
    },
  };
}

function renderHomeSections(data) {
  renderHero(data);
  renderPlanRoutes(data);
  renderHomeAdjudications(data);
  renderSocialReviews(data);
  renderSubscriberResources(data);
  renderRecruitment(data);
}

export function initHomePage(site) {
  renderHero(createInitialHomeData(site));

  loadHomeData()
    .then(renderHomeSections)
    .catch((error) => {
      console.error(error);
      document.documentElement.classList.add("has-data-error");
    });
}
