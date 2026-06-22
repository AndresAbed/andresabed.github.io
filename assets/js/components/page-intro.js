import { el } from "../utils/dom.js";

export function createPageIntro({ eyebrow, title, intro }) {
  return el("section", {
    className: "page-intro",
    children: [
      el("div", {
        className: "container page-intro__content",
        children: [
          eyebrow ? el("span", { className: "badge", text: eyebrow }) : null,
          el("h1", { text: title }),
          intro ? el("p", { text: intro }) : null,
        ],
      }),
    ],
  });
}
