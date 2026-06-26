# Club San Jorge / Agencia Abed — Project Agent Guide

## 1. Project context

This repository is a **commercial + informational website** for a **Club San Jorge agency in Argentina**.

It is **not**:
- a SaaS product
- a dashboard
- an admin panel
- a full transactional subscription app
- a generic corporate website
- a classic ecommerce

It **is**:
- a static marketing/informational site
- a commercial catalog of Club San Jorge plans
- a lead generation and assisted inquiry site
- a trust-building and explanation layer for a Club San Jorge agency
- a website that must reduce confusion about how the system works

The site is for an agency that commercializes Club San Jorge plans nationwide and assists users online.

---

## 2. Primary business goals

The website must help the agency:

1. Capture qualified leads
2. Generate WhatsApp / contact / assisted pre-subscription inquiries
3. Explain the system clearly before a user contacts the agency
4. Build trust in both:
   - Club San Jorge as the underlying system
   - the agency as the commercial/advisory channel
5. Reduce misunderstandings and misleading expectations around:
   - how plans work
   - what “330” means
   - what the user gets at the end of the plan
   - what drawings / adjudications / prizes mean
   - what is official system information vs agency guidance

---

## 3. Core UX goals

The site must:

- explain first, convert second
- avoid misleading or ambiguous wording
- make plan differences understandable
- help users compare options without cognitive overload
- make the agency feel trustworthy, serious and clear
- feel modern, sober, commercial and professional
- work especially well on mobile

This project must **not** feel like a generic SaaS landing page or a quick template.

---

## 4. Project constraints

### Tech stack
- Static multipage site
- HTML + CSS + vanilla JS
- No Next.js
- No SPA requirement
- No backend required for V1
- Data source is local JSON under `data_pack_v2/`

### Current product scope
The current site is **not** a full online enrollment flow.
For now it should support:
- browsing
- learning
- comparing
- contacting
- assisted inquiry / pre-solicitud

A future backend or enrollment/payment flow may be added later, but current implementation must not assume a full transactional app.

---

## 5. Source of truth

`data_pack_v2/` is the editable source of truth for site content and operational data.

Do not create shadow copies of the same business data in multiple places.

If a page needs:
- plan information
- FAQ
- resources
- draws
- adjudications
- contact configuration
- site-wide brand or legal copy

use the corresponding JSON from `data_pack_v2/`.

---

## 6. Content model: official system vs agency layer

This project has **two content layers** that must stay conceptually separate even when shown together.

## A. Official / system content
This includes information that belongs to Club San Jorge or to the plan system itself, for example:
- plans and plan conditions
- how the system works
- draws / sorteos
- adjudications
- official resources and payment links
- official FAQs
- official stats if validated

Rules:
- write carefully
- do not invent or infer missing contractual facts
- do not exaggerate
- do not transform partial information into commercial promises
- prefer clarity and precision over persuasion

## B. Agency / commercial layer
This includes:
- agency positioning
- trust-building copy
- advisory role of the agency
- “why consult with us”
- commercial CTAs
- lead capture
- assisted inquiry flow
- explanatory blocks designed to reduce confusion

Rules:
- this layer should feel human, clear and commercially useful
- it can be more persuasive than the official/system layer
- but it must never contradict or distort official plan behavior

---

## 7. Critical business truths that must be respected

When working on copy, UI or information architecture, always preserve these ideas:

1. **“330” is not a commercial plan name.**
   It is part of the plan/sistema logic and must not be treated like a flashy product tier name.

2. **Do not imply automatic vehicle delivery.**
   Users must understand that the system forms capital / savings and participates in the corresponding mechanics and conditions.

3. **Do not present plans like SaaS subscriptions.**
   This is one of the biggest failure modes in previous iterations.

4. **Do not reduce the catalog to 3 abstract plan cards.**
   `/planes/` must work like a **commercial catalog** with categories, items, metadata and assisted CTA paths.

5. **Do not flood the site with legalistic disclaimers.**
   The site needs clarity and trust, not defensive repetitive warnings.

6. **Do not use fake confidence language.**
   No empty “industry leader / excellence / your dreams” type copy.

7. **The site must reduce confusion, not add more.**
   If a block, label or CTA could create a wrong expectation, rewrite it.

---

## 8. Design direction

The site should feel:

- modern
- sober
- commercial
- editorial enough to feel trustworthy
- visually stronger than a generic bootstrap-style landing
- structured, calm and clear
- brand-aware, but not overloaded with institutional style

### Avoid these visual failure modes
- generic SaaS landing look
- repeated “title + paragraph + 3 cards” sections
- weak visual hierarchy
- too many equally styled boxes
- giant disclaimer banners
- fake pricing-table layouts
- homepage that feels thin or underdeveloped
- empty decorative sections with no real information

### Prefer
- stronger visual hierarchy
- sections with distinct visual intent
- better use of whitespace and density contrast
- catalog sections that actually look like a catalog
- editorial explanation blocks when teaching the system
- clearer rhythm between informative and commercial sections
- better CTA hierarchy and better scanability

---

## 9. How to think about the main pages

## Home
The homepage is **not** a generic hero + 3 cards landing.
It must behave like a commercial/informational hub with:

- a strong hero
- clear entry into plan categories
- system explanation
- featured catalog content
- trust / agency explanation
- draws / adjudications / FAQ / resources previews
- strong but sober CTA paths

## /planes/
This is a **catalog page**, not a SaaS pricing page.

It should:
- group options by category
- show actual catalog items or representative commercial options
- expose relevant metadata
- support scanning and comparison
- route users to assisted contact / plan detail

## Plan detail pages
These are **commercial + explanatory detail pages**, not contract dumps and not pricing tables.
They must help the user understand:
- what the plan category is
- what the user is paying into
- what the term means
- what the system logic is
- what is important before contacting

## Sorteos / adjudicados / recursos / FAQ
These pages exist to reduce friction and confusion.
They should feel useful, scannable and trustworthy—not like legal appendices.

## Contacto
This page is for assisted inquiry / pre-solicitud, not a fake “complete your subscription now” checkout.

---

## 10. Data quality and rendering rules

The project already uses concepts like:
- `verified`
- `pending_validation`
- `mock`
- `partial_mock`

Respect them.

### Rules
- Never present mock data as real public information.
- Treat pending or partial contractual data cautiously.
- If data is incomplete, prefer:
  - a partial state
  - “A confirmar”
  - “Información en actualización”
  - a route to the official source
instead of inventing missing facts.

---

## 11. Brand rules

Use Club San Jorge brand assets carefully and consistently.

Known brand guidance:
- primary red: `#be002f`
- dark gray: `#292929`
- green accent: `#61af54`
- medium gray: `#939389`

General brand interpretation for the site:
- red and dark gray should carry most of the visual weight
- green is an accent, not the dominant UI color
- the site should feel aligned with Club San Jorge but more polished and modern than the official site

Do not:
- distort the logo
- add random effects to the logo
- invent new logo lockups that violate brand rules
- overload the site with too many accent colors

---

## 12. Tone of voice

Tone must be:

- clear
- sober
- helpful
- commercial but not pushy
- trustworthy
- professional
- human
- direct without sounding cold
- explanatory without sounding bureaucratic

Avoid:
- hype
- “dream fulfillment” clichés
- aggressive sales language
- excessive institutional wording
- generic legal fear language

---

## 13. Required skill usage

When relevant, combine multiple skills.

### Always use `marketing-expert` for:
- homepage messaging
- CTA strategy
- conversion structure
- value proposition
- trust and lead-gen decisions

### Always use `product-content-expert` for:
- explanatory copy
- FAQs
- plan explanation
- help content
- trust / clarity / “how it works” blocks

### Always use `ui-ux-expert` for:
- responsive layout
- accessibility
- interaction and form UX
- component consistency
- frontend structure

### Always use `landing-page-architect` for:
- homepage planning
- section order
- conversion-aware information architecture
- marketing site structure

### Always use `catalog-page-designer` for:
- `/planes/`
- category listings
- catalog cards
- plan comparison structures
- plan listing / scanning / filtering decisions

### Always use `frontend-art-director` for:
- visual hierarchy upgrades
- section redesigns
- homepage polish
- catalog polish
- any task where the site risks looking generic or visually weak

---

## 14. Default implementation standards

Every implemented block/page should aim for:

- semantic HTML
- accessible headings and landmarks
- strong mobile behavior
- visible focus states
- good spacing rhythm
- reusable components where it makes sense
- no fake or placeholder-ish production UI
- no unnecessary complexity

---

## 15. Definition of done for any page/block

A page/block is not “done” just because it renders.

It should only be considered done if:

1. the information hierarchy is clear
2. the copy does not create misleading expectations
3. the visual hierarchy feels intentional
4. mobile layout is resolved
5. CTA logic is coherent
6. empty/partial states are handled
7. the result does not feel like a generic SaaS template
8. the page actually supports the business goal of trust + explanation + assisted conversion
