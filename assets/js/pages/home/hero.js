import { createButton } from "../../components/plan-components.js";
import { clear, el, qs } from "../../utils/dom.js";
import { FALLBACK_TEXT, resolveValueState } from "../../utils/status.js";

function getHeroVideo(videosData) {
  return (
    (videosData?.items || []).find((item) => item.id === "hero-capitalizacion-ahorro") ||
    (videosData?.items || []).find((item) => item.youtubeUrl) ||
    null
  );
}

function formatDrawDate(rawDate) {
  const value = String(rawDate || "").trim();
  const badgeMatch = value.match(/\bLOTBA\b/i);

  return {
    date: value.replace(/\s*\bLOTBA\b\s*/i, "").trim(),
    badge: badgeMatch ? badgeMatch[0].toUpperCase() : "",
  };
}

function getHeroStats(site) {
  const priority = ["Suscriptores", "Adjudicados", "Trayectoria"];
  const stats = site.club?.stats || [];

  return priority.map((label) => stats.find((item) => item.label === label)).filter(Boolean);
}

function createHeroStat(item) {
  return el("article", {
    className: "home-hero-stat",
    children: [
      el("span", {
        className: `home-hero-stat__icon home-hero-stat__icon--${item.icon || "stat"}`,
        attrs: { "aria-hidden": "true" },
      }),
      el("strong", { text: item.value }),
      el("span", { text: item.label }),
    ],
  });
}

function withAutoplay(url) {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}autoplay=1&rel=0`;
}

function setupHeroVideoModal({ trigger, modal, frame, closeButton, video }) {
  if (!trigger || !modal || !frame || !closeButton || !video?.youtubeUrl) return;

  let previousFocus = null;

  const setOpen = (open) => {
    modal.dataset.open = open ? "true" : "false";
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("site-video-open", open);

    if (open) {
      previousFocus = document.activeElement;
      closeButton.removeAttribute("tabindex");
      frame.setAttribute("tabindex", "0");
      frame.setAttribute("src", withAutoplay(video.youtubeUrl));
      window.requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
    } else {
      frame.removeAttribute("src");
      frame.setAttribute("tabindex", "-1");
      closeButton.setAttribute("tabindex", "-1");
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus({ preventScroll: true });
      }
    }
  };

  trigger.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.dataset.open !== "true") return;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Tab") {
      const focusable = [closeButton, frame];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function createHeroVideo(video) {
  if (!video?.youtubeUrl) return null;

  const modalId = "hero-video-modal";
  const titleId = "hero-video-title";
  const trigger = el("button", {
    className: "home-hero-video__trigger",
    attrs: {
      type: "button",
      "aria-controls": modalId,
      "aria-expanded": "false",
    },
    children: [
      el("span", { className: "home-hero-video__play", attrs: { "aria-hidden": "true" } }),
      el("span", {
        className: "home-hero-video__text",
        children: [
          el("strong", { text: "Vos también podés ser el próximo" }),
          el("small", { text: "Conocé más sobre Club San Jorge" }),
        ],
      }),
    ],
  });
  const frame = el("iframe", {
    attrs: {
      title: video.title || "Video de Club San Jorge Capitalización y Ahorro",
      loading: "lazy",
      tabindex: "-1",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      referrerpolicy: "strict-origin-when-cross-origin",
      allowfullscreen: true,
    },
  });
  const closeButton = el("button", {
    className: "home-hero-video-modal__close",
    text: "Cerrar",
    attrs: { type: "button", "aria-label": "Cerrar video", tabindex: "-1" },
  });
  const modal = el("div", {
    className: "home-hero-video-modal",
    attrs: {
      id: modalId,
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": "true",
      "aria-labelledby": titleId,
      "data-open": "false",
    },
    children: [
      el("div", {
        className: "home-hero-video-modal__panel",
        children: [
          el("div", {
            className: "home-hero-video-modal__head",
            children: [
              el("h2", { text: video.title || "Club San Jorge", attrs: { id: titleId } }),
              closeButton,
            ],
          }),
          el("div", {
            className: "home-hero-video-modal__frame",
            children: [frame],
          }),
        ],
      }),
    ],
  });

  const videoBlock = el("article", {
    className: "home-hero-video",
    children: [trigger],
  });

  document.getElementById(modalId)?.remove();
  document.body.append(modal);
  setupHeroVideoModal({ trigger, modal, frame, closeButton, video });

  return videoBlock;
}

function createHeroLead(site) {
  const defaultLead = "Con cada cuota, ahorrás y todos los meses estás un paso más cerca de ser uno de nuestros cientos de adjudicados.";
  const lead = site.club?.supportingClaim || defaultLead;
  const highlight = "más cerca de ser uno de nuestros cientos de adjudicados.";
  const highlightIndex = lead.indexOf(highlight);

  if (highlightIndex === -1) {
    return el("p", { className: "home-hero-v5__lead", text: lead });
  }

  return el("p", {
    className: "home-hero-v5__lead",
    children: [
      lead.slice(0, highlightIndex),
      el("strong", { text: highlight }),
    ],
  });
}

function createHeroDraws(draws) {
  const stimuli = (draws?.stimuli || []).sort((a, b) => (a.position || 0) - (b.position || 0)).slice(0, 3);
  const lastState = resolveValueState(draws?.lastDraw?.date, draws?.lastDraw?.status);
  const nextState = resolveValueState(draws?.nextDraw?.date, draws?.nextDraw?.status);
  const lastDrawDate = formatDrawDate(draws?.lastDraw?.date);
  const nextDrawDate = formatDrawDate(draws?.nextDraw?.date);
  const drawBadge = lastDrawDate.badge || nextDrawDate.badge;

  return el("article", {
    className: "home-hero-drawcard",
    attrs: { "aria-label": "Información de sorteos Club San Jorge" },
    children: [
      el("div", {
        className: "home-hero-drawcard__last",
        attrs: { "data-state": lastState },
        children: [
          drawBadge ? el("span", { className: "home-hero-drawcard__badge", text: drawBadge }) : null,
          el("div", {
            className: "home-hero-drawcard__head",
            children: [
              el("div", {
                className: "home-hero-drawcard__title",
                children: [el("span", { text: "Último sorteo" })],
              }),
              el("strong", {
                className: "home-hero-drawcard__last-date",
                text: lastDrawDate.date || FALLBACK_TEXT.updating,
              }),
            ],
          }),
          el("div", {
            className: "home-hero-drawcard__numbers",
            children: stimuli.map((item) =>
              el("div", {
                className: "home-hero-drawcard__number",
                attrs: {
                  "data-state": resolveValueState(item.winningNumber, item.status),
                  title: item.label,
                },
                children: [
                  el("strong", { text: item.winningNumber || FALLBACK_TEXT.updating }),
                  el("span", { text: item.label }),
                ],
              }),
            ),
          }),
        ],
      }),
      el("div", {
        className: "home-hero-drawcard__next",
        children: [
          el("div", {
            className: "home-hero-drawcard__date",
            attrs: { "data-state": nextState },
            children: [
              el("span", { text: "Próximo sorteo" }),
              el("strong", { text: nextDrawDate.date || FALLBACK_TEXT.updating }),
            ],
          }),
          el("div", {
            className: "home-hero-drawcard__actions",
            children: [
              el("a", {
                className: "button button--secondary home-hero-drawcard__payment",
                text: "Pagar mi boleta",
                attrs: {
                  href: "https://clubsanjorge.com.ar/capitalizacion-y-ahorro/paga-tu-cuota",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export function renderHero(data) {
  const target = qs("[data-home-hero]");
  if (!target) return;

  const { site, draws, videos } = data;
  const stats = getHeroStats(site);
  const video = getHeroVideo(videos);
  const headline = site.club?.headline || "Suscribite, ahorrá y ganá";

  clear(target);
  target.append(
    el("div", {
      className: "container home-hero-v5",
      children: [
        el("div", {
          className: "home-hero-v5__intro",
          children: [
            el("div", {
              className: "home-hero-v5__copy",
              children: [
                el("h1", {
                  attrs: { id: "home-title" },
                  text: headline.toLocaleUpperCase("es-AR"),
                }),
                createHeroLead(site),
                el("div", {
                  className: "home-hero-v5__actions",
                  children: [
                    createButton({ label: "Ver planes", href: "/planes/", variant: "primary" }),
                    createButton({ label: "Cómo funciona", href: "/como-funciona/", variant: "green" }),
                  ],
                }),
                createHeroVideo(video),
              ],
            }),
            createHeroDraws(draws),
          ],
        }),
      ],
    }),
    el("div", {
      className: "home-hero-stats-band",
      children: [
        el("div", {
          className: "container home-hero-v5__proof",
          attrs: { "aria-label": "Números de confianza" },
          children: stats.map(createHeroStat),
        }),
      ],
    }),
  );
}
