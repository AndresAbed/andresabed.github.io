import { withSiteBasePath } from "../../data/api.js";
import { createButton } from "../../components/plan-components.js";
import { clear, el, qs } from "../../utils/dom.js";
import { createHomeSectionHeader, enableHorizontalSwipe } from "./shared.js";

const ADJUDICATION_IMAGE_TIMEOUT_MS = 2200;

function scrollAdjudications(track, direction) {
  if (!track) return;
  const card = track.querySelector(".home-adjudication-card");
  const gap = 24;
  const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.86;
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

function createAdjudicationMedia(item) {
  const imageUrl = withSiteBasePath(item.imageUrl);
  const media = el("div", {
    className: "home-adjudication-card__media",
    attrs: { "data-image-state": imageUrl ? "loading" : "unavailable" },
    children: [el("span", { className: "home-adjudication-card__image-fallback", text: "Imagen no disponible" })],
  });

  if (!imageUrl) return media;

  const image = el("img", {
    attrs: {
      src: imageUrl,
      alt: "",
      loading: "lazy",
    },
  });

  const imageTimeout = window.setTimeout(() => {
    if (media.dataset.imageState !== "loading") return;
    media.dataset.imageState = "unavailable";
    image.remove();
  }, ADJUDICATION_IMAGE_TIMEOUT_MS);

  image.addEventListener("load", () => {
    window.clearTimeout(imageTimeout);
    media.dataset.imageState = "ready";
  });
  image.addEventListener("error", () => {
    window.clearTimeout(imageTimeout);
    media.dataset.imageState = "unavailable";
    image.remove();
  });

  media.append(image);
  return media;
}

function createAdjudicationCard(item) {
  return el("article", {
    className: "home-adjudication-card",
    children: [
      createAdjudicationMedia(item),
      el("div", {
        className: "home-adjudication-card__body",
        children: [
          el("div", {
            className: "home-adjudication-card__meta",
            children: [
              el("span", { className: "home-adjudication-card__installment", text: `Cuota ${item.installment}` }),
              el("span", { className: "home-adjudication-card__date", text: item.drawDate }),
            ],
          }),
          el("h3", { text: item.name }),
          el("dl", {
            className: "home-adjudication-card__facts",
            children: [
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--prize",
                children: [el("dt", { text: "Premio" }), el("dd", { text: item.prize })],
              }),
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--place",
                children: [el("dt", { text: "Residencia" }), el("dd", { text: item.residence })],
              }),
              el("div", {
                className: "home-adjudication-card__fact home-adjudication-card__fact--date",
                children: [el("dt", { text: "Fecha de sorteo" }), el("dd", { text: `Sorteo del ${item.drawDate}` })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export function renderHomeAdjudications(data) {
  const target = qs("[data-home-adjudications]");
  if (!target) return;

  const adjudications = data.homeAdjudications || {};
  const items = adjudications.items || [];
  const section = adjudications.section || {};
  if (!items.length) return;

  const trackId = "home-adjudications-track";
  const track = el("div", {
    className: "home-adjudications__track",
    attrs: { id: trackId, tabindex: "0" },
    children: items.map(createAdjudicationCard),
  });

  clear(target);
  target.append(
    el("div", {
      className: "home-adjudications",
      children: [
        el("div", {
          className: "home-adjudications__head",
          children: [
            createHomeSectionHeader({
              eyebrow: section.eyebrow || "Adjudicados",
              title: section.title || "Conocé a nuestros adjudicados",
              id: "home-adjudications-title",
              intro: section.intro || "",
              align: "center",
            }),
          ],
        }),
        el("div", {
          className: "home-adjudications__viewport",
          children: [
            el("button", {
              className: "home-adjudications__control home-adjudications__control--prev",
              text: "Anterior",
              attrs: { type: "button", "aria-controls": trackId },
            }),
            track,
            el("button", {
              className: "home-adjudications__control home-adjudications__control--next",
              text: "Siguiente",
              attrs: { type: "button", "aria-controls": trackId },
            }),
          ],
        }),
        el("div", {
          className: "home-adjudications__footer",
          children: [
            createButton({
              label: section.cta?.label || "Ver más adjudicados",
              href: section.cta?.href || "/adjudicados/",
              variant: "primary",
            }),
          ],
        }),
      ],
    }),
  );

  target.querySelector(".home-adjudications__control--prev")?.addEventListener("click", () => scrollAdjudications(track, -1));
  target.querySelector(".home-adjudications__control--next")?.addEventListener("click", () => scrollAdjudications(track, 1));
  enableHorizontalSwipe(track);
}
