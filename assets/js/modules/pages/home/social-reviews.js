import { clear, el, qs } from "../../utils/dom.js";
import { createHomeSectionHeader, enableHorizontalSwipe } from "./shared.js?v=20260714-41";

function scrollSocialReviews(track, direction) {
  if (!track) return;
  const card = track.querySelector(".home-social-review");
  const gap = 24;
  const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.82;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const tolerance = 8;

  if (direction > 0 && track.scrollLeft >= maxScroll - tolerance) {
    track.scrollTo({ left: 0, behavior: "smooth" });
    return;
  }

  if (direction < 0 && track.scrollLeft <= tolerance) {
    track.scrollTo({ left: maxScroll, behavior: "smooth" });
    return;
  }

  track.scrollBy({ left: direction * step, behavior: "smooth" });
}
function updateSocialReviewProgress(track, progress) {
  if (!track || !progress) return;
  const maxScroll = track.scrollWidth - track.clientWidth;
  const ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
  progress.style.setProperty("--review-progress", String(Math.min(1, Math.max(0, ratio))));
}
function createSocialReviewCard(item, index) {
  const source = item.source || "social";
  const avatar = item.avatar === "male" ? "male" : "female";

  return el("article", {
    className: `home-social-review ${index === 0 ? "home-social-review--featured" : ""}`,
    children: [
      el("div", {
        className: "home-social-review__bubble",
        children: [
          el("span", {
            className: `home-social-review__network home-social-review__network--${source}`,
            attrs: { role: "img", "aria-label": item.sourceLabel || "Red social" },
          }),
          el("blockquote", {
            attrs: { cite: item.sourceLabel || undefined },
            children: [el("p", { text: item.quote })],
          }),
        ],
      }),
      el("div", {
        className: "home-social-review__head",
        children: [
          el("span", {
            className: `home-social-review__avatar home-social-review__avatar--${avatar}`,
            attrs: { "aria-hidden": "true" },
          }),
          el("div", {
            className: "home-social-review__person",
            children: [
              el("h3", { text: item.name }),
              el("span", {
                className: "home-social-review__tag",
                text: "Opinión en redes",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function renderSocialReviews(data) {
  const target = qs("[data-social-reviews]");
  if (!target) return;

  const section = data.socialReviews?.section || {};
  const items = data.socialReviews?.items || [];
  if (!items.length) return;
  const trackId = "home-social-reviews-track";
  const track = el("div", {
    className: "home-social-proof__track",
    attrs: { id: trackId, tabindex: "0", "aria-label": "Opiniones de clientes" },
    children: items.map(createSocialReviewCard),
  });

  clear(target);
  target.append(
    el("div", {
      className: "home-social-proof",
      children: [
        createHomeSectionHeader({
          eyebrow: section.eyebrow || "Opiniones",
          title: section.title || "Experiencias compartidas",
          id: "home-social-reviews-title",
          intro: section.intro || "Comentarios reales compartidos por clientes en redes.",
          align: "center",
        }),
        el("div", {
          className: "home-social-proof__showcase",
          children: [
            el("aside", {
              className: "home-social-proof__panel",
              children: [
                el("span", {
                  className: "home-social-proof__quote",
                  attrs: { "aria-hidden": "true" },
                }),
                el("h3", { text: "Lo que comparten nuestros clientes" }),
                el("p", {
                  text: "Comentarios publicados por clientes en redes sociales.",
                }),
                el("div", {
                  className: "home-social-proof__controls",
                  children: [
                    el("button", {
                      className: "home-social-proof__control home-social-proof__control--prev",
                      text: "←",
                      attrs: { type: "button", "aria-controls": trackId, "aria-label": "Ver opinión anterior" },
                    }),
                    el("span", {
                      className: "home-social-proof__progress",
                      attrs: { "aria-hidden": "true" },
                    }),
                    el("button", {
                      className: "home-social-proof__control home-social-proof__control--next",
                      text: "→",
                      attrs: { type: "button", "aria-controls": trackId, "aria-label": "Ver opinión siguiente" },
                    }),
                  ],
                }),
              ],
            }),
            track,
          ],
        }),
      ],
    }),
  );

  const progress = target.querySelector(".home-social-proof__progress");
  let progressFrame = null;
  const syncProgress = () => {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    progressFrame = requestAnimationFrame(() => updateSocialReviewProgress(track, progress));
  };

  syncProgress();
  track.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("resize", syncProgress);
  target.querySelector(".home-social-proof__control--prev")?.addEventListener("click", () => scrollSocialReviews(track, -1));
  target.querySelector(".home-social-proof__control--next")?.addEventListener("click", () => scrollSocialReviews(track, 1));
  enableHorizontalSwipe(track);
}
