# BigBrain Solutions — Claude Code Implementation Roadmap

Companion document to *BigBrain Solutions — Website Audit & Redesign Proposal*. Read that document first — it contains the reasoning behind every decision baked into these tasks (architecture choice, design system, motion system, multilingual approach).

**Target stack:** Astro (static output) · Tailwind CSS · Markdown/MDX content collections · Astro built-in i18n (hr default, en secondary) · GSAP (islands-only) + native CSS scroll-driven animations + View Transitions API · Cloudflare Pages + Pages Functions · Cloudflare Turnstile for form spam protection.

**How to use this doc:** Work phases in order. Do not start Phase 2 (architecture setup) until Phase 0 (discovery) is complete and reviewed with the site owner — Phase 0 may change assumptions in later phases. Within a phase, respect the listed Dependencies. Every task should end with its own commit; do not batch multiple Task IDs into one commit.

**Owner decisions log (confirmed 2026-08-18, supersedes any conflicting placeholder in the tasks below):**
1. **HomeStock must be publicly featured, not just teased.** The owner confirms the privacy-policy-only exposure was intentional at the time (the URL exists purely to satisfy the App Store's privacy-policy-link requirement) — it was never meant to be permanently hidden marketing-wise. Direction now: promote HomeStock to a first-class, fully public part of the site — its own nav-level page, not a homepage footnote. See updated `HOME-001` and `CONTENT-003` below.
2. **Quality bar is non-negotiable "top notch" across the board** — every phase (design, motion, performance, accessibility, content) should be executed to the highest standard specified in the audit doc, not the minimum that technically satisfies an acceptance criterion. Where a task offers a "good enough" vs. "excellent" implementation choice and both are listed as options, default to the more polished one.
3. **Owner has delegated remaining open decisions to Claude Code's judgment** (exact pricing figures, Croatian copy drafting, case-study detail level) rather than blocking on further owner input — Claude Code should make the most reasonable, premium-appropriate call, clearly flag it as an assumption in `docs/decisions.md`, and proceed rather than stall the roadmap waiting on answers.

---

## Phase 0 — Discovery (confirm/replace estimates with real data)

### DISCOVERY-001
**Objective:** Produce a hard-data technical crawl of the live production site to confirm or correct the qualitative estimates in the audit doc.
**Context:** The audit was written from a sandboxed content-fetch tool with no live browser/network access to the production site — animation inventory, exact script/plugin list, and Core Web Vitals are informed estimates, not measurements.
**Files/components affected:** none (read-only against production); output is a new file `docs/discovery-report.md`.
**Implementation:** Use Playwright to load `/`, `/services/`, `/about/`, `/contact/`, `/homestock-privacy-policy/` at 375px/768px/1440px viewports. Capture: full screenshot per page per viewport; every `<script src>` and `<link rel="stylesheet">`; every element with a CSS animation/transition running on an infinite loop (query computed styles for `animation-iteration-count: infinite`); WordPress plugin folder names from asset URLs; whether any analytics/tracking script is present. Run Lighthouse (mobile + desktop) against all 5 pages and save JSON + scores. Run axe-core against all 5 pages for accessibility violations.
**Acceptance criteria:** `docs/discovery-report.md` exists with screenshots, a table of infinite-loop animated elements (selector + animation name), full script/stylesheet inventory, Lighthouse scores for all 5 pages × 2 viewports, and axe-core violations list.
**Dependencies:** none — first task.
**Testing:** Manually spot-check 2 of the Lighthouse runs against PageSpeed Insights web UI for the same URLs to confirm numbers aren't sandbox artifacts.
**Rollback:** N/A — read-only task, nothing to roll back.

### DISCOVERY-002
**Objective:** Confirm with the site owner which findings from `discovery-report.md` change scope before Phase 1 begins.
**Context:** Specifically needs a human decision on: (a) whether any infinite animations found are ones the owner actually likes and wants kept in spirit, (b) whether Croatian copy will be owner-written or should be drafted by Claude Code from the existing English copy for owner review, (c) confirm target domain structure (`/` hr, `/en/` en) is acceptable.
**Files/components affected:** none.
**Implementation:** Present `discovery-report.md` findings as a short decision list; do not proceed to Phase 1 until answered.
**Acceptance criteria:** Written answers to (a), (b), (c) captured in `docs/decisions.md`.
**Dependencies:** DISCOVERY-001.
**Testing:** N/A.
**Rollback:** N/A.

---

## Phase 1 — Design System Foundation

### DESIGN-001
**Objective:** Create the design token system as code (not just documentation).
**Context:** Every component in later phases must consume tokens, not hardcoded values, so the visual system stays coherent and themeable (dark/light).
**Files/components affected:** new `src/styles/tokens.css` (CSS custom properties) and `tailwind.config.mjs`.
**Implementation:** Encode the full token set from the audit doc Section 11: color (background/surface/primary/accent/text/muted/border/semantic, both dark and light via `[data-theme]` attribute), type scale (Space Grotesk for display, Inter for body — self-hosted via `@fontsource`, not Google Fonts CDN), spacing scale (4px base, steps to 128px), radii (12/24/999px), shadow tokens (dark/light variants), breakpoints (375/768/1024/1280/1536). Wire Tailwind's theme to reference the CSS custom properties so both raw CSS and Tailwind utility classes stay in sync.
**Acceptance criteria:** A `/design-tokens` preview route renders every color swatch, type scale step, spacing step, and shadow, in both dark and light mode, toggled via a `data-theme` attribute on `<html>`.
**Dependencies:** Phase 0 complete.
**Testing:** Visual review of the preview route in both themes; run `axe-core` against it to confirm text/background contrast pairs meet WCAG AA.
**Rollback:** Token file is additive/new; delete file and Tailwind config changes to revert with no impact elsewhere (nothing consumes it yet).

### DESIGN-002
**Objective:** Build the core reusable component library.
**Context:** Header/hero/page implementations in later phases must not hand-roll one-off buttons/cards — components need to exist first.
**Files/components affected:** new `src/components/`: `Button.astro` (primary/secondary/ghost variants, hover/active/focus states per audit Section 11), `Card.astro` (service + case-study variants), `Badge.astro`, `StatCounter.astro`, `TestimonialCard.astro`, `SectionHeading.astro`, `CTABand.astro`.
**Implementation:** Each component consumes only design tokens from DESIGN-001. Buttons: 150ms ease-out hover scale/glow per motion system, visible focus ring meeting WCAG (not `outline: none`). Cards: 4px hover lift + shadow transition. StatCounter: count-up-on-scroll-into-view via IntersectionObserver, static value shown immediately if `prefers-reduced-motion` is set.
**Acceptance criteria:** Each component has a Storybook-style demo in `/design-tokens` or a `/components` preview route showing all variants and states (default/hover/focus/disabled). Keyboard-only navigation reaches every interactive state.
**Dependencies:** DESIGN-001.
**Testing:** Keyboard-nav test (Tab through all components, confirm visible focus), axe-core pass, manual `prefers-reduced-motion` emulation check in DevTools.
**Rollback:** New files only; delete to revert.

---

## Phase 2 — Architecture Setup

### ARCH-001
**Objective:** Scaffold the new Astro project with the target folder structure and i18n routing.
**Context:** This is the foundation everything else builds on; get the routing/content-collection shape right before any real page content goes in.
**Files/components affected:** new repo (or new `/website-v2` directory if working alongside the existing WP export for reference) — `astro.config.mjs`, `src/content/config.ts`, `src/pages/`, `src/content/pages/hr/`, `src/content/pages/en/`.
**Implementation:** Astro `i18n` config with `defaultLocale: "hr"`, `locales: ["hr", "en"]`, `routing: { prefixDefaultLocale: false }` (hr at `/`, en at `/en/`). Define a `pages` content collection with a schema (title, description, ogImage, sections) shared across both locale subfolders. Set up `src/layouts/BaseLayout.astro` with `<html lang>` set dynamically per locale, and slots for per-page hreflang alternates.
**Acceptance criteria:** `astro build` produces both `/` and `/en/` output for a placeholder homepage with correct `lang` attributes; `astro dev` runs cleanly.
**Dependencies:** DISCOVERY-002 (domain/routing decision confirmed).
**Testing:** `astro build` succeeds with zero errors/warnings; manually verify output HTML `<html lang="hr">` vs `<html lang="en">`.
**Rollback:** New project directory — no production impact until deployment (Phase 11).

### ARCH-002
**Objective:** Stand up Cloudflare Pages project and connect it to the git repo, deploying to a preview subdomain only.
**Context:** Need a real staging URL for stakeholder review throughout the build, without touching the production DNS/site.
**Files/components affected:** Cloudflare Pages project config; no production DNS changes.
**Implementation:** Create a new Cloudflare Pages project pointed at the repo, build command `astro build`, output `dist/`. Leave it on its default `*.pages.dev` preview URL — do not attach the production custom domain yet.
**Acceptance criteria:** Every push to the main branch auto-deploys and is reachable at the `*.pages.dev` URL.
**Dependencies:** ARCH-001.
**Testing:** Push a trivial change, confirm it appears at the preview URL within the expected build time.
**Rollback:** Delete the Pages project — zero production impact, since custom domain was never attached.

### ARCH-003
**Objective:** Implement the contact form submission backend.
**Context:** Static hosting has no native PHP form handler like WordPress did; needs a replacement that delivers submissions reliably.
**Files/components affected:** new `functions/api/contact.ts` (Cloudflare Pages Function), `src/components/ContactForm.astro`.
**Implementation:** Pages Function validates required fields server-side, checks a Cloudflare Turnstile token, then sends the submission via a transactional email API (e.g. Resend) to the business inbox. Rate-limit by IP (basic in-memory or Cloudflare's built-in rate limiting rules).
**Acceptance criteria:** Submitting the form from a deployed preview delivers a real email; invalid/missing Turnstile token is rejected with a clear inline error; rate limit blocks rapid repeat submissions.
**Dependencies:** ARCH-002.
**Testing:** Manual end-to-end submission test on the preview URL; automated test hitting the function directly with valid/invalid/spam payloads.
**Rollback:** Function is isolated; disable route or revert commit with no effect on static pages.

---

## Phase 3 — Homepage

### HOME-001
**Objective:** Build the new homepage information architecture that segments visitors by intent (home/personal, business/IT, software & web development), replacing the current single generic hero + feature list.
**Context:** Audit Section 3 identified the lack of audience segmentation as the top UX gap; audit Section 9 says keep the warranty/testimonials/founder authenticity, replace the generic stacking order.
**Files/components affected:** `src/content/pages/hr/home.md`, `src/content/pages/en/home.md`, `src/pages/index.astro`, `src/pages/en/index.astro`, uses components from DESIGN-002.
**Implementation:** Section order: (1) Hero — outcome-led headline + subhead + primary CTA + 3 audience-entry chips ("For your home", "For your business", "Web & software") that scroll-anchor to the relevant section below; (2) three audience blocks (home/business/dev), each with its own mini-CTA; (3) 60-day warranty band, elevated prominence per audit; (4) stat counters (years experience, warranty days, projects/clients); (5) testimonials carousel (5 existing, keep all); (6) featured case study teaser (Ubique Safety Consultants — see CONTENT-002) + a full-width **HomeStock product spotlight band** (not a small teaser — per owner decisions log, HomeStock is now a first-class public feature: app icon/screenshots, one-line value prop, "View HomeStock" CTA linking to the new dedicated `/products/homestock` page from CONTENT-003); (7) final CTA band. Hero entrance animation per motion system (staggered headline/subhead/CTA, one-shot, `prefers-reduced-motion`-aware). **Primary nav must include a "HomeStock" or "Products" item** linking to the new dedicated page — it is not buried in a footer or sub-menu.
**Acceptance criteria:** Homepage renders correctly at all 5 breakpoints; all 3 audience chips scroll-anchor correctly; Lighthouse mobile performance ≥95 on this page; content is present in both `hr` and `en` and reviewed against DISCOVERY-002 decision (b).
**Dependencies:** ARCH-001, DESIGN-002, CONTENT-001/002/003 (copy must exist before final content pass, but page can be built with placeholder copy in parallel).
**Testing:** Cross-browser check (Chrome/Firefox/Safari), mobile device emulation, Lighthouse run, manual reduced-motion check.
**Rollback:** Isolated to `index.astro`/`en/index.astro` + homepage content files; revert commit.

---

## Phase 4 — Remaining Pages

### PAGE-001 — Services
**Objective:** Rebuild Services with clearer segmentation and directional pricing signals.
**Context:** Audit Section 3/9: no pricing signal currently exists, increasing friction for cold B2B traffic.
**Files/components affected:** `src/content/pages/{hr,en}/services.md`, `src/pages/[locale]/usluge or services`.
**Implementation:** Group the 7 existing services into the 3 audience tracks from HOME-001 (home/business/dev), each service as a `Card` with an icon, 1–2 sentence description, and a directional price signal ("From €X" or "Custom quote" badge — exact figures to be supplied by site owner, use placeholder tokens `{{PRICE_X}}` until provided). Each card CTA deep-links to Contact with the service pre-selected in the existing dropdown.
**Acceptance criteria:** All 7 services present, grouped by track, each with a price signal (even if placeholder), deep-linking works and pre-fills the Contact form's service dropdown.
**Dependencies:** DESIGN-002, HOME-001 (shared audience-track taxonomy).
**Testing:** Click every card CTA, confirm correct pre-fill on Contact; Lighthouse pass.
**Rollback:** Isolated to this page's files.

### PAGE-002 — About
**Objective:** Rebuild About with corrected heading hierarchy and founder-led story, FAQ split out.
**Context:** Audit Section 8 flagged a double-H1 pattern; Section 3 flagged FAQ being in the wrong location.
**Files/components affected:** `src/content/pages/{hr,en}/about.md`.
**Implementation:** Single H1, founder bio and story kept largely as-is per "KEEP: founder-led positioning," add a short "why BigBrain Solutions exists" narrative paragraph if the owner wants to expand it (optional, confirm with owner). Remove the FAQ section from this page (moved in PAGE-003/PAGE-001).
**Acceptance criteria:** One H1 only, correct heading nesting (h1→h2→h3), FAQ content no longer duplicated here.
**Dependencies:** DESIGN-002.
**Testing:** Heading-structure audit via axe-core/Lighthouse a11y.
**Rollback:** Isolated to this page.

### PAGE-003 — Contact
**Objective:** Rebuild Contact with the new form (wired to ARCH-003), retained map/hours/info, plus relevant FAQ moved here.
**Context:** Audit Section 3: FAQ answering buying-decision questions belongs near the conversion point.
**Files/components affected:** `src/content/pages/{hr,en}/contact.md`, `src/components/ContactForm.astro` (from ARCH-003), new `src/components/FAQAccordion.astro`.
**Implementation:** Retain all existing fields (name, email, individual/business, service dropdown, message), add Turnstile widget, keep Google Maps embed but lazy-load it (only load the iframe on scroll-into-view or click-to-load, to avoid it blocking initial page performance), move buying-relevant FAQ items here as an accessible accordion.
**Acceptance criteria:** Form submits successfully (tested in ARCH-003), map lazy-loads (confirm via network panel it doesn't fire on initial load), FAQ accordion is keyboard-operable.
**Dependencies:** ARCH-003, DESIGN-002.
**Testing:** End-to-end form submission test, Lighthouse (confirm map isn't counted against initial LCP/load), keyboard nav test on accordion.
**Rollback:** Isolated to this page.

### PAGE-004 — Privacy Policy (both apps)
**Objective:** Bring the orphaned HomeStock privacy policy into the site's IA properly, plus add a general site privacy policy if one doesn't exist separately.
**Context:** Audit Section 2: currently orphaned, not linked from anywhere.
**Files/components affected:** `src/content/pages/{hr,en}/privacy-homestock.md`, footer component update.
**Implementation:** Port existing HomeStock privacy policy content as-is (verified legitimate and accurate in audit), link it from the footer and from the new HomeStock case-study section (CONTENT-003).
**Acceptance criteria:** Page reachable via footer link and from HomeStock case-study CTA; content matches the verified original.
**Dependencies:** CONTENT-003.
**Testing:** Link-check crawl confirms no orphaned pages remain.
**Rollback:** Isolated to this page + footer link.

---

## Phase 5 — New Content (Case Studies)

### CONTENT-001
**Objective:** Draft Croatian and English copy for all rebuilt pages, based on existing English source content, for owner review — per DISCOVERY-002 decision (b).
**Context:** No Croatian content exists today; this is new content creation, not translation-toggle.
**Files/components affected:** all `src/content/pages/hr/*.md` and `src/content/pages/en/*.md` files.
**Implementation:** English content is a refined/restructured version of the existing site copy (per HOME-001/PAGE-001-003 structure). Croatian content is drafted in parallel — natural, locally-appropriate Croatian (not machine-translation-literal), by Claude Code, then flagged clearly for the owner's native-speaker review before launch.
**Acceptance criteria:** Every page has complete copy in both locales; a `docs/content-review-checklist.md` lists every Croatian string for owner sign-off.
**Dependencies:** HOME-001, PAGE-001, PAGE-002, PAGE-003 structures defined.
**Testing:** Proofreading pass; confirm no leftover placeholder/lorem ipsum text ships.
**Rollback:** Content-only change; revert file.

### CONTENT-002
**Objective:** Build a full case study for the Ubique Safety Consultants engagement.
**Context:** Audit Section 1/9: currently only exists as a testimonial fragment; this is the strongest available trust/credibility asset.
**Files/components affected:** new `src/content/case-studies/ubique-safety-consultants.md` (new content collection), `src/pages/{locale}/case-studies/[slug].astro`, homepage teaser card.
**Implementation:** Structure: challenge → approach/stack → outcome, using only information the owner confirms is accurate/shareable (do not fabricate scope details beyond what's verifiable). Requires a short input round with the owner for details beyond what's on the public testimonial.
**Acceptance criteria:** Case study page live in both locales, linked from homepage teaser and Services (dev track).
**Dependencies:** owner-provided project details (blocking — flag if not received).
**Testing:** Content accuracy sign-off from owner before merge.
**Rollback:** New collection entry; delete to revert, no dependency risk elsewhere.

### CONTENT-003
**Objective:** Build a dedicated, fully public HomeStock product page — not a footnote.
**Context:** Audit Section 1 + owner decisions log: HomeStock is a real shipped product the owner explicitly wants featured for everyone, at nav level, not hidden behind a privacy-policy URL anymore. This is one of the strongest "we build real software" trust signals available and should be treated as a flagship page, built to the same "top notch" bar as the homepage.
**Files/components affected:** new `src/pages/{locale}/products/homestock.astro` (or `src/pages/en/products/homestock.astro` for the en locale), new `src/content/products/homestock.md` content entry, header nav update (add "HomeStock"/"Products" item), homepage spotlight band (see updated `HOME-001`), footer link, `PAGE-004` (privacy policy) cross-linked from here.
**Implementation:** Full page treatment: hero with app icon/screenshots/mockup (device-frame imagery), what it does (home inventory management, receipt scanning, household sharing — per the verified privacy policy content), why it exists / the problem it solves, tech stack callout (Supabase, Firebase Crashlytics — reinforces "we build real technical products," fits the "technically advanced" positioning goal), App Store badge/link (and Google Play if it exists — confirm with owner), and a closing CTA connecting it back to the core business ("Want something like this built for you?" → Contact, service pre-filled to Web Application Development). Apply the same motion system (entrance reveal, scroll reveals) as other flagship pages — no shortcuts because it's "just an app page."
**Acceptance criteria:** Page reachable directly from primary nav (not just homepage/footer), fully built in both locales, includes real App Store link, links to PAGE-004, includes a CTA back into the core funnel, and passes the same Lighthouse/accessibility bar as the homepage (Phase 9/10 thresholds) — no lower standard for this page.
**Dependencies:** owner-provided App Store link and any additional screenshots; falls back to icon + description only if screenshots aren't provided, but must still ship at "top notch" polish either way.
**Testing:** Link-check (App Store link resolves), Lighthouse pass, content accuracy sign-off, nav-visibility check from every other page.
**Rollback:** New page + nav entry; remove nav item and page to revert with no dependency risk elsewhere.

---

## Phase 6 — Motion System Implementation

### MOTION-001
**Objective:** Implement the global `prefers-reduced-motion` handling at the token/base-style level, once, so no component can ship an inaccessible animation by omission.
**Context:** Audit Section 12 — this must be structural, not per-component discipline.
**Files/components affected:** `src/styles/tokens.css` or a new `src/styles/motion.css` imported globally.
**Implementation:** A `@media (prefers-reduced-motion: reduce)` block that collapses all `animation` and `transition` durations to near-zero and disables `scroll-behavior: smooth`, applied via a global `*` rule plus explicit overrides for any JS-driven (GSAP) animations checked at runtime via `window.matchMedia`.
**Acceptance criteria:** With OS-level reduced-motion enabled, no page has any moving/animating element except instant state changes; verified across all pages.
**Dependencies:** DESIGN-001.
**Testing:** DevTools "emulate CSS prefers-reduced-motion: reduce" check on every page.
**Rollback:** Global CSS addition; revert file.

### MOTION-002
**Objective:** Implement scroll-triggered entrance reveals site-wide using CSS scroll-driven animations with an IntersectionObserver fallback.
**Context:** Audit Section 12 — "keep the intent, rebuild cleanly," no large JS library needed for this tier.
**Files/components affected:** new `src/scripts/reveal.ts`, applied via a `data-reveal` attribute convention across section/card components.
**Implementation:** Feature-detect `animation-timeline` support; use native CSS scroll-driven animation where supported, IntersectionObserver + CSS class toggle fallback otherwise. Respects MOTION-001.
**Acceptance criteria:** Section headings and cards fade/slide into view once per page load, do not re-trigger on scroll-up/down repeatedly, fallback verified in a browser without scroll-timeline support (e.g. via a feature-detection override for testing).
**Dependencies:** MOTION-001.
**Testing:** Manual scroll test on all pages; forced fallback-path test.
**Rollback:** Script + attribute additions; revert.

### MOTION-003
**Objective:** Implement View Transitions API page transitions.
**Context:** Audit Section 12 — identified as the highest-leverage "feels expensive" addition, currently entirely absent (WordPress does hard page reloads).
**Files/components affected:** `astro.config.mjs` / `<ClientRouter />` (Astro's View Transitions integration) in `BaseLayout.astro`.
**Implementation:** Enable Astro's built-in View Transitions, define a subtle shared-element crossfade (200–250ms) between routes, ensure it degrades gracefully (instant navigation) in browsers without support, and disable per MOTION-001 when reduced-motion is set.
**Acceptance criteria:** Navigating between Home/Services/About/Contact shows a smooth crossfade in supporting browsers, instant nav elsewhere, no flash-of-unstyled-content or layout jump.
**Dependencies:** MOTION-001, all Phase 3/4 pages built.
**Testing:** Manual nav test in Chrome (supports) and Firefox (may not, verify graceful fallback).
**Rollback:** Remove `<ClientRouter />` integration; pages fall back to standard Astro navigation.

### MOTION-004
**Objective:** Build the hero's choreographed GSAP sequence and the optional case-study scroll-scrubbed narrative, as isolated islands.
**Context:** Audit Section 12 — GSAP only where it earns its complexity, loaded only where needed.
**Files/components affected:** `src/components/HeroAnimation.astro` (with `client:visible` or `client:load` island directive), optional `src/components/CaseStudyScroll.astro`.
**Implementation:** GSAP timeline for hero (staggered headline/subhead/CTA/audience-chips), imported only inside these islands so it never ships on pages that don't use it. Respects MOTION-001.
**Acceptance criteria:** GSAP bundle appears only in the network tab on pages using these components, not globally; hero sequence plays once, reduced-motion shows final state immediately.
**Dependencies:** MOTION-001, HOME-001.
**Testing:** Network tab audit per page to confirm no unnecessary GSAP loading; reduced-motion check.
**Rollback:** Remove island component usage; GSAP dependency can be fully removed if unused elsewhere.

### MOTION-005
**Objective:** Audit and remove/replace any infinite decorative animations found in DISCOVERY-001.
**Context:** Primary suspected cause of "feels cheap"/distracting per audit Section 5.
**Files/components affected:** depends on DISCOVERY-001 findings — likely none, since this is a rebuild (nothing carries over by default) — this task exists as an explicit checkpoint to confirm none were reintroduced.
**Implementation:** Cross-check the final built site against the `discovery-report.md` list of infinite-loop animations; confirm none were unintentionally reintroduced; if the owner specifically requested keeping the intent of one (per DISCOVERY-002 decision (a)), rebuild it as a restrained, `prefers-reduced-motion`-aware, mobile-disabled version only.
**Acceptance criteria:** Zero unintentional infinite-loop animations in the shipped site; any intentionally-kept one is documented and passes MOTION-001/mobile-disable checks.
**Dependencies:** DISCOVERY-002, all Phase 6 tasks.
**Testing:** Manual page-by-page visual audit, CPU/battery profiling in DevTools Performance tab (confirm no continuous repaint/layout activity when idle).
**Rollback:** N/A — verification task.

---

## Phase 7 — Multilingual Completion

### I18N-001
**Objective:** Implement `hreflang` alternates, `x-default`, and locale-aware sitemap.
**Context:** Audit Section 13 — must be correct from day one, not retrofitted.
**Files/components affected:** `BaseLayout.astro` `<head>`, `src/pages/sitemap.xml.ts` (or `@astrojs/sitemap` integration config).
**Implementation:** Every page emits `<link rel="alternate" hreflang="hr" href=".../">`, `hreflang="en" href=".../en/...">`, and `hreflang="x-default"` pointing to the hr version. Sitemap includes both locale URLs with `xhtml:link` alternate annotations.
**Acceptance criteria:** Google's Rich Results/URL Inspection tool (or a hreflang validator) shows no errors for every page pair.
**Dependencies:** ARCH-001, Phase 4 complete.
**Testing:** Run an hreflang validator against the deployed preview for every page.
**Rollback:** Isolated to layout head + sitemap config.

### I18N-002
**Objective:** Build the language switcher component.
**Context:** Audit Section 3/11/13 — must be visible, elegant, and preserve the current page across locale switch.
**Files/components affected:** new `src/components/LanguageSwitcher.astro`, added to header.
**Implementation:** Text-based "HR / EN" toggle (no flags, per audit Section 11), maps current route to its counterpart in the other locale using the content collection's slug mapping, falls back to the other locale's homepage only if no counterpart exists.
**Acceptance criteria:** From any page in either locale, switching language lands on the direct counterpart page, not the homepage (except where none exists).
**Dependencies:** I18N-001, all Phase 4 pages.
**Testing:** Manual click-through test from every page in both directions.
**Rollback:** Isolated component; remove from header to revert.

### I18N-003
**Objective:** Localized 404 pages for both locales.
**Context:** Audit Section 13, explicit requirement.
**Files/components affected:** `src/pages/404.astro`, `src/pages/en/404.astro`.
**Implementation:** Locale-appropriate copy, links back to that locale's homepage and Services.
**Acceptance criteria:** Visiting a nonexistent URL under `/` shows the Croatian 404; under `/en/` shows the English 404.
**Dependencies:** ARCH-001.
**Testing:** Manual test against a nonexistent path in both locale prefixes.
**Rollback:** Isolated files.

---

## Phase 8 — SEO Implementation

### SEO-001
**Objective:** Implement per-page, per-locale meta descriptions, Open Graph, and Twitter Card metadata (currently missing entirely).
**Context:** Audit Section 7.
**Files/components affected:** content collection schema (add `description`, `ogImage` fields), `BaseLayout.astro` head.
**Implementation:** Every content-collection entry requires a non-empty `description` (build should fail/warn if missing); OG image generated or supplied per page; Twitter Card set to `summary_large_image`.
**Acceptance criteria:** Every page has a unique meta description in the correct locale and valid OG/Twitter tags (verified via a social-preview debugger).
**Dependencies:** Phase 4/5 content complete.
**Testing:** Facebook Sharing Debugger / Twitter Card Validator against the deployed preview for at least 3 pages.
**Rollback:** Isolated to schema + layout head.

### SEO-002
**Objective:** Implement `LocalBusiness` and `Service` JSON-LD structured data.
**Context:** Audit Section 7 — currently entirely absent.
**Files/components affected:** new `src/components/StructuredData.astro`, included in `BaseLayout.astro` (LocalBusiness sitewide) and PAGE-001 (Service per offering).
**Implementation:** `LocalBusiness` schema with name, address (Dubrovnik), phone, hours, `sameAs: [LinkedIn URL]`; `Service` schema per service card on Services page.
**Acceptance criteria:** Google's Rich Results Test validates both schema types with zero errors.
**Dependencies:** PAGE-001.
**Testing:** Rich Results Test against deployed preview.
**Rollback:** Isolated component; remove include to revert.

---

## Phase 9 — Performance Optimization

### PERF-001
**Objective:** Implement responsive, modern-format images site-wide.
**Context:** Audit Section 6.
**Files/components affected:** all image usage — convert to Astro's built-in `<Image />`/`<Picture />` components.
**Implementation:** All images served as AVIF/WebP with sensible fallback, explicit width/height to prevent CLS, `loading="lazy"` below the fold and `loading="eager"`/`fetchpriority="high"` on the LCP hero image only.
**Acceptance criteria:** Zero CLS from images in Lighthouse; hero LCP element identified and prioritized.
**Dependencies:** Phase 3/4 pages built with real imagery.
**Testing:** Lighthouse CLS/LCP audit per page.
**Rollback:** Revert to standard `<img>` if the Image integration causes build issues; isolated change.

### PERF-002
**Objective:** Self-host and subset fonts, remove any Google Fonts CDN dependency.
**Context:** Audit Section 6 — CDN font loading adds a render-blocking round trip.
**Files/components affected:** `@fontsource` packages for Space Grotesk + Inter, `src/styles/tokens.css` `@font-face` declarations.
**Implementation:** Self-host subset (Latin + Croatian diacritics — č/ć/đ/š/ž must be included in the subset) woff2 files, preload the primary body weight.
**Acceptance criteria:** No third-party font requests in the network tab; Croatian diacritics render correctly in the chosen typeface (explicitly verify č/ć/đ/š/ž glyphs exist).
**Dependencies:** DESIGN-001.
**Testing:** Network tab audit; visual check of Croatian text rendering.
**Rollback:** Isolated to font loading config.

### PERF-003
**Objective:** Full Lighthouse pass and remediation across all pages/locales/breakpoints.
**Context:** Definition of Done target: ≥95 performance/accessibility/best-practices, 100 SEO, mobile and desktop.
**Files/components affected:** whatever the audit turns up — likely script-loading order, unused CSS, third-party embed deferral.
**Implementation:** Run Lighthouse CI against every page × locale × mobile/desktop combination; fix any finding below target thresholds.
**Acceptance criteria:** All combinations meet or exceed the stated thresholds; results committed to `docs/lighthouse-final.md`.
**Dependencies:** All prior phases substantially complete.
**Testing:** Lighthouse CI, ideally wired into the deploy pipeline as a non-blocking report initially.
**Rollback:** N/A — remediation task, changes tracked per-fix.

---

## Phase 10 — Accessibility

### A11Y-001
**Objective:** Full WCAG 2.1 AA pass across the site.
**Context:** Audit Section 8, Definition of Done.
**Files/components affected:** site-wide, informed by DISCOVERY-001's axe-core baseline and any new violations introduced during the rebuild.
**Implementation:** Run axe-core against every page/locale; fix contrast, focus-order, ARIA-label, and heading-hierarchy issues; verify the mobile menu and language switcher are fully keyboard- and screen-reader-operable (test with VoiceOver or NVDA at least once).
**Acceptance criteria:** Zero critical/serious axe-core violations across all pages/locales.
**Dependencies:** All content/component phases complete.
**Testing:** axe-core automated pass + one manual screen-reader walkthrough of the homepage and contact form.
**Rollback:** N/A — remediation task.

---

## Phase 11 — Testing & Deployment

### TEST-001
**Objective:** Cross-browser/device testing pass.
**Context:** Definition of Done, audit Section 10 mobile-first mandate.
**Files/components affected:** N/A — verification only.
**Implementation:** Test on real or emulated: iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari/Edge, at all 5 breakpoints. Specifically re-verify MOTION-003/004 fallback behavior and mobile animation-disable rules from MOTION-005.
**Acceptance criteria:** No layout breakage, no console errors, motion system behaves per spec on every combination tested.
**Dependencies:** All prior phases.
**Testing:** This task is the testing.
**Rollback:** N/A.

### DEPLOY-001
**Objective:** Cut over the production domain from WordPress to the new Cloudflare Pages site.
**Context:** Final step — must be low-risk and reversible given this is a live business's only website.
**Files/components affected:** Cloudflare DNS/Pages custom domain config.
**Implementation:** Attach `www.bigbrain-solutions.com` and `bigbrain-solutions.com` as custom domains on the Cloudflare Pages project; keep the WordPress install/database intact and accessible at a temporary internal URL (not deleted) for a minimum 30-day rollback window; verify SSL, redirect `bigbrain-solutions.com` → `www` (or vice versa, matching current canonical), verify old URLs that changed slug (if localized Croatian slugs were adopted per audit Section 13) 301-redirect to their new locations to preserve any existing search equity.
**Acceptance criteria:** Production domain serves the new Astro site over HTTPS with no mixed-content warnings; all legacy URLs 301-redirect correctly; WordPress backup/export retained.
**Dependencies:** TEST-001, PERF-003, A11Y-001 all passed.
**Testing:** Post-cutover Lighthouse + hreflang + structured-data re-validation directly against the live production domain; monitor Cloudflare analytics for 48 hours for error-rate spikes.
**Rollback:** Cloudflare Pages custom-domain attachment can be detached and DNS pointed back to the original WordPress hosting within minutes, since the WordPress install is retained untouched during the 30-day window.

---

## Phase 12 — Post-Launch

### POST-001
**Objective:** Submit both locale sitemaps to Google Search Console, monitor indexing.
**Dependencies:** DEPLOY-001. **Testing:** Confirm both locale URL sets get indexed within 1–2 weeks; monitor for hreflang errors in GSC.

### POST-002
**Objective:** Review Cloudflare Web Analytics after 2–4 weeks of production traffic; decide with the owner whether GA4 is warranted.
**Dependencies:** DEPLOY-001.

### POST-003
**Objective:** Owner content check-in — confirm Croatian copy (drafted in CONTENT-001) reads naturally to a native speaker in production context, not just in review; amend any strings that feel translated rather than native.
**Dependencies:** DEPLOY-001, at least 1 week of the owner using the live site.

---

## Complexity & Dependency Summary

| Phase | Task count | Relative complexity | Can start after |
|---|---|---|---|
| 0 — Discovery | 2 | Low | Immediately |
| 1 — Design System | 2 | Medium | Phase 0 |
| 2 — Architecture | 3 | Medium | Phase 0 (routing decision) |
| 3 — Homepage | 1 (large) | High | Phase 1, 2 |
| 4 — Other Pages | 4 | Medium | Phase 1, 2 |
| 5 — Case Study Content | 3 | Medium (owner input needed) | Phase 3/4 structures |
| 6 — Motion System | 5 | High | Phase 1 |
| 7 — Multilingual | 3 | Medium | Phase 4 |
| 8 — SEO | 2 | Low-Medium | Phase 4/5 |
| 9 — Performance | 3 | Medium | Phase 3/4 |
| 10 — Accessibility | 1 (broad) | Medium | All content phases |
| 11 — Testing & Deploy | 2 | High-stakes, low technical complexity | Everything above |
| 12 — Post-launch | 3 | Low | Deploy |

**Definition of Done (full):** both locales complete and owner-approved; Lighthouse ≥95 performance/accessibility/best-practices and 100 SEO on mobile + desktop for every page; zero critical axe-core violations; all animations respect `prefers-reduced-motion` and mobile-disable rules; hreflang/sitemap/structured data validate with zero errors; contact form verified end-to-end in production; WordPress retained as rollback for 30 days post-launch; owner has done a full native-speaker read-through of the Croatian content in production.
