import { loadHomeData } from "../data/api.js";
import { renderHero } from "./home/hero.js";
import { renderPlanRoutes } from "./home/plan-routes.js";
import { renderHomeAdjudications } from "./home/adjudications.js";
import { renderSocialReviews } from "./home/social-reviews.js";
import { renderSubscriberResources } from "./home/subscriber-resources.js";
import { renderRecruitment } from "./home/recruitment.js";

export async function initHomePage() {
  const data = await loadHomeData();
  renderHero(data);
  renderPlanRoutes(data);
  renderHomeAdjudications(data);
  renderSocialReviews(data);
  renderSubscriberResources(data);
  renderRecruitment(data);
}
