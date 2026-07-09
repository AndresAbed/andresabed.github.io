---
target: como-funciona/index.html
total_score: 29
p0_count: 0
p1_count: 1
timestamp: 2026-07-09T00-55-21Z
slug: como-funciona-index-html
---
⚠️ DEGRADED: single-context (no sub-agent/Task tool exposed)

Method: degraded single-context (manual design review + deterministic detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Page state and active nav are clear; PDF preview loading/embedded state can look like a dark block on mobile. |
| 2 | Match System / Real World | 3 | Content uses mostly plain language, but terms like endoso, rescate and valor nominal still ask a lot from first-timers. |
| 3 | User Control and Freedom | 3 | PDF can be opened/downloaded; FAQ is collapsible. No strong local navigation or "where to go next" after learning. |
| 4 | Consistency and Standards | 3 | Visual language matches the site, but the embedded PDF viewer breaks the surface language. |
| 5 | Error Prevention | 3 | Copy prevents major false expectations; more hierarchy could clarify what is always true vs conditional. |
| 6 | Recognition Rather Than Recall | 2 | 24 FAQ items require scanning/remembering topics; no quick index or featured questions. |
| 7 | Flexibility and Efficiency | 2 | Fine for reading, weak for fast lookup. No topic shortcuts/search within FAQ. |
| 8 | Aesthetic and Minimalist Design | 3 | Cleaner after polish, but still leans on repeated cards/panels and a long FAQ stack. |
| 9 | Error Recovery | 3 | Low-error page; external PDF fallback exists through open/download. |
| 10 | Help and Documentation | 4 | Strong amount of help content and contract access. |
| **Total** | | **29/40** | **Good foundation; needs stronger lookup/navigation and a less heavy contract treatment.** |

## Anti-Patterns Verdict

**LLM assessment**: It does not immediately read as generic AI output. The brand red, dark gray, green accent, real Plan 330 content and contract preview give it specificity. The risk is more subtle: the lower half becomes a conventional documentation page with many accordions, and several sections still rely on similar panel/card treatments.

**Deterministic scan**: `detect.mjs --json como-funciona assets/js/pages/info-pages.js` returned `[]`. No automated slop findings.

**Visual overlays**: Browser injection was attempted, but this browser evaluation surface is read-only, so no reliable user-visible overlay is available. Browser screenshots and DOM metrics were used instead.

## Overall Impression

The page is useful and trustworthy, but it is still more "well-styled documentation" than "guided explanation". The biggest opportunity is to help a visitor decide what to read first and what to do next after understanding the system.

## What's Working

- The hero and first Plan 330 panel establish the topic clearly and feel aligned with the rest of the site.
- The copy avoids dangerous promises: it separates references, nominal value, cuota, sorteo and contract conditions with care.
- The page works technically across desktop, tablet and mobile: no horizontal overflow, active navigation is clear, and the contract links work.

## Priority Issues

**[P1] FAQ is too long without prioritization**
- **Why it matters**: 24 questions are valuable, but a first-time user has to scan a lot before finding the important ones.
- **Fix**: Add a compact "Preguntas clave" or topic index before the FAQ, then keep the full accordion below.
- **Suggested command**: `/impeccable distill como-funciona`

**[P2] Contract preview feels like an external product inside the page**
- **Why it matters**: On desktop it introduces a large dark PDF UI; on mobile it can look like a blank dark block before the PDF renders.
- **Fix**: Replace the always-visible iframe with a lighter preview card: document summary, first-page thumbnail if available, and open/download actions. Keep iframe optional behind "Ver vista previa".
- **Suggested command**: `/impeccable layout como-funciona`

**[P2] The page lacks a next-step bridge**
- **Why it matters**: After explaining the system, the user is not guided toward "ver planes", "consultar una opción", or "hablar con la agencia" inside the page body.
- **Fix**: Add one restrained CTA block after important notes or after the contract: "¿Ya entendés la base del Plan 330? Revisá opciones disponibles o consultá con un asesor."
- **Suggested command**: `/impeccable craft como-funciona`

**[P2] Mobile reading path is long before the first useful action**
- **Why it matters**: On 390px, the user scrolls through hero, summary, fact and steps before reaching contract/actions/FAQ.
- **Fix**: On mobile, add a small jump nav after the summary: "Puntos clave · Contrato · Preguntas"; or move contract access closer as a secondary action.
- **Suggested command**: `/impeccable adapt como-funciona`

**[P3] Visual composition still repeats panels and cards**
- **Why it matters**: The improved polish is clean, but concepts, notes, contract and FAQ could have more varied rhythm.
- **Fix**: Make one section more editorial/list-based and another more utility-focused, so the page does not feel like a sequence of similar blocks.
- **Suggested command**: `/impeccable bolder como-funciona`

## Persona Red Flags

**Jordan, first-time user**: Understands the main idea, but likely gets stuck deciding which of the 24 FAQ items matter most. Terms are explained, but not progressively prioritized.

**Casey, distracted mobile user**: Page is readable, but the primary useful actions are far down. The embedded PDF preview is especially heavy on mobile.

**Sam, accessibility-dependent user**: Semantic structure is mostly good, native `details/summary` helps keyboard access, and focus states exist. Risk remains in the embedded PDF viewer, whose internal accessibility and mobile rendering are outside the page's control.

## Minor Observations

- "Contrato Plan 330" is useful, but visually it could be less dominant than "Lo más importante antes de avanzar".
- "Preguntas para revisar antes de consultar" is accurate, though slightly heavy as a title. It could become "Preguntas frecuentes sobre el Plan 330".
- The "330 cuotas mensuales" fact works well, but it may be doing all the visual storytelling alone.

## Questions to Consider

- Should this page behave more like a guided explainer or more like a reference center?
- What are the 5 questions a user must understand before contacting the agency?
- Does the contract need to be previewed inline, or is strong access/download enough?
