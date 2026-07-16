import { loadPrivacy } from "../data/api.js";
import { clear, el, qs } from "../utils/dom.js";
import { initScrollSpy } from "../utils/scroll-spy.js?v=20260715-1";
import { isBlank } from "../utils/validators.js";

function formatUpdatedAt(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function createSection(section) {
  return el("section", {
    className: "privacy-article__section",
    attrs: {
      id: section.id,
      "aria-labelledby": `privacy-${section.id}-title`,
    },
    children: [
      el("h2", {
        text: section.title,
        attrs: { id: `privacy-${section.id}-title` },
      }),
      ...(section.body || []).map((paragraph) => el("p", { text: paragraph })),
    ],
  });
}

function createToc(sections) {
  return el("nav", {
    className: "privacy-toc",
    attrs: { "aria-label": "Contenido de privacidad" },
    children: [
      el("p", { text: "Contenido" }),
      el("ul", {
        children: sections.map((section) =>
          el("li", {
            children: [
              el("a", {
                text: section.title,
                attrs: { href: `#${section.id}` },
              }),
            ],
          }),
        ),
      }),
    ],
  });
}

function createContactBlock(privacy, site) {
  const email = site?.agency?.contactEmail;
  const hasEmail = !isBlank(email);
  const contact = privacy.contact || {};

  return el("section", {
    className: "privacy-contact",
    attrs: { "aria-labelledby": "privacy-contact-title" },
    children: [
      el("div", { className: "privacy-contact__mark", attrs: { "aria-hidden": "true" } }),
      el("div", {
        children: [
          el("h2", { text: contact.title || "Consultas sobre privacidad", attrs: { id: "privacy-contact-title" } }),
          el("p", {
            text:
              contact.body ||
              "Si tenés una consulta sobre el tratamiento de tus datos, escribinos por los canales publicados en el sitio.",
          }),
          hasEmail
            ? el("a", { className: "privacy-contact__link", text: email, attrs: { href: `mailto:${email}` } })
            : el("span", { className: "privacy-contact__pending", text: contact.emailFallback || "Email en actualización" }),
        ],
      }),
    ],
  });
}

function createPrivacyPage(privacy, site) {
  const hero = privacy.hero || {};
  const sections = privacy.sections || [];
  const updatedAt = formatUpdatedAt(privacy.meta?.updatedAt);

  return el("div", {
    className: "privacy-page__inner",
    children: [
      el("header", {
        className: "privacy-hero",
        children: [
          el("p", { className: "eyebrow", text: hero.eyebrow || "Privacidad" }),
          el("h1", { text: hero.title || "Privacidad y tratamiento de datos" }),
          el("p", {
            className: "privacy-hero__intro",
            text:
              hero.intro ||
              "Usamos los datos que nos dejás para responder consultas comerciales vinculadas a Club San Jorge.",
          }),
          updatedAt
            ? el("p", {
                className: "privacy-hero__meta",
                text: `Última actualización: ${updatedAt}`,
              })
            : null,
        ],
      }),
      el("div", {
        className: "container privacy-layout",
        children: [
          createToc(sections),
          el("article", {
            className: "privacy-article",
            children: [
              privacy.notice
                ? el("p", {
                    className: "privacy-article__notice",
                    text: privacy.notice,
                  })
                : null,
              ...sections.map(createSection),
              createContactBlock(privacy, site),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function initPrivacyPage(site) {
  const mount = qs("[data-privacy-page]");
  if (!mount) return;

  const privacy = await loadPrivacy();
  clear(mount);
  mount.append(createPrivacyPage(privacy, site));

  const navigation = mount.querySelector(".privacy-toc");
  const article = mount.querySelector(".privacy-article");
  initScrollSpy({
    navigation,
    sections: mount.querySelectorAll(".privacy-article__section"),
    region: article,
  });
}
