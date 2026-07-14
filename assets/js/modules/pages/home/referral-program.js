import { normalizeInternalTarget } from "../../data/api.js";
import { clear, el, qs } from "../../utils/dom.js";

export function renderReferralProgram(data) {
  const target = qs("[data-referral-program-home]");
  const content = data.referralProgram?.home;
  if (!target || !content) return;

  clear(target);
  target.append(
    el("article", {
      className: "home-referral-program",
      attrs: { "aria-labelledby": "home-referral-program-title" },
      children: [
        el("div", {
          className: "home-referral-program__visual",
          attrs: { "aria-hidden": "true" },
          children: [
            el("span", { className: "home-referral-program__person home-referral-program__person--primary" }),
            el("span", { className: "home-referral-program__path" }),
            el("span", { className: "home-referral-program__person home-referral-program__person--secondary" }),
            el("span", { className: "home-referral-program__ticket", text: "RYG" }),
          ],
        }),
        el("div", {
          className: "home-referral-program__copy",
          children: [
            el("p", { className: "home-referral-program__label", text: content.label }),
            el("h2", { attrs: { id: "home-referral-program-title" }, text: content.title }),
            el("p", { text: content.body }),
            content.note ? el("p", { className: "home-referral-program__note", text: content.note }) : null,
          ],
        }),
        el("div", {
          className: "home-referral-program__action",
          children: [
            el("a", {
              className: "button button--primary",
              text: content.cta?.label || "Quiero participar",
              attrs: { href: normalizeInternalTarget(content.cta?.href || "/recomenda-y-gana/") },
            }),
          ],
        }),
      ],
    }),
  );
}
