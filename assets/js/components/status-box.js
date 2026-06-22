import { el } from "../utils/dom.js";
import { UI_STATES } from "../utils/status.js";

const STATE_LABELS = {
  [UI_STATES.READY]: "Listo",
  [UI_STATES.PARTIAL]: "Informacion en actualizacion",
  [UI_STATES.EMPTY]: "Contenido en preparacion",
  [UI_STATES.DISABLED]: "Canal en configuracion",
};

export function createStatusBox({ title, body, state = UI_STATES.EMPTY, action } = {}) {
  return el("article", {
    className: "status-box stack",
    attrs: { "data-state": state },
    children: [
      el("span", { className: state === UI_STATES.PARTIAL ? "badge badge--warning" : "badge", text: STATE_LABELS[state] }),
      el("div", {
        children: [
          title ? el("h3", { text: title }) : null,
          body ? el("p", { text: body }) : null,
        ],
      }),
      action,
    ],
  });
}
