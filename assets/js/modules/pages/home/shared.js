import { normalizeInternalTarget, withSiteBasePath } from "../../data/api.js";
import { el } from "../../utils/dom.js";

export function getPrimaryCta(site) {
  const cta = site?.cta?.primary;
  return {
    label: cta?.label || "Hablar por WhatsApp",
    href: normalizeInternalTarget(cta?.target) || normalizeInternalTarget("/planes/"),
  };
}

export function createHomeSectionHeader({ eyebrow, title, intro, id, align = "start" }) {
  return el("div", {
    className: `home-section-header home-section-header--${align}`,
    children: [
      eyebrow ? el("span", { className: "home-eyebrow", text: eyebrow }) : null,
      el("h2", { text: title, attrs: id ? { id } : {} }),
      intro ? el("p", { text: intro }) : null,
    ],
  });
}

export function enableHorizontalSwipe(track) {
  if (!track || !window.PointerEvent) return;

  const threshold = 8;
  let gesture = null;

  const resetGesture = () => {
    const completedGesture = gesture;
    gesture = null;
    delete track.dataset.dragging;

    if (completedGesture?.direction === "horizontal") {
      const scrollPadding = Number.parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const target = [...track.children].reduce((nearest, card) => {
        const cardPosition = Math.max(0, Math.min(maxScroll, card.offsetLeft - scrollPadding));
        return Math.abs(cardPosition - track.scrollLeft) < Math.abs(nearest - track.scrollLeft)
          ? cardPosition
          : nearest;
      }, 0);

      track.scrollTo({ left: target, behavior: "smooth" });
    }
  };

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: track.scrollLeft,
      direction: null,
    };
  });

  track.addEventListener("pointermove", (event) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (!gesture.direction) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return;
      gesture.direction = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";

      if (gesture.direction === "vertical") {
        resetGesture();
        return;
      }

      track.setPointerCapture?.(event.pointerId);
      track.dataset.dragging = "true";
    }

    if (gesture.direction !== "horizontal") return;

    event.preventDefault();
    track.scrollLeft = gesture.startScrollLeft - deltaX;
  }, { passive: false });

  track.addEventListener("pointerup", resetGesture);
  track.addEventListener("pointercancel", resetGesture);
  track.addEventListener("lostpointercapture", resetGesture);
  track.addEventListener("dragstart", (event) => event.preventDefault());
}

export function createPlanVisual(item, className = "home-plan-visual") {
  if (!item?.imageUrl) return null;

  return el("img", {
    className,
    attrs: {
      src: withSiteBasePath(item.imageUrl),
      alt: "",
      loading: "lazy",
    },
  });
}
