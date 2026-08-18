# DISCOVERY-001 — Technical Crawl of Live Production Site

**Target:** `https://www.bigbrain-solutions.com` (5 indexed pages)
**Date measured:** 2026-08-18
**Method:** Playwright (Chromium 151.0.7922.34) for DOM/asset/animation inventory + axe-core 4.x for accessibility, Lighthouse 13.4.1 (Node API, simulated throttling) for performance/SEO/best-practices scoring. All runs executed live against production from this machine — nothing in this report is estimated.

Raw artifacts are committed alongside this report under [`docs/discovery-assets/`](discovery-assets/):
- `screenshots/` — full-page screenshots, all 5 pages × 3 viewports (375/768/1440px), 15 PNGs
- `axe/` — raw axe-core violation JSON per page (desktop + mobile viewport)
- `lighthouse/summary.json` — condensed scores/metrics/opportunities for all 10 Lighthouse runs (5 pages × mobile/desktop). Full raw Lighthouse JSON reports (~6MB, one per run) were generated but not committed to keep repo size sane — they're reproducible by re-running the same crawl.
- `crawl-results.json` — full structured output of the Playwright pass (script/stylesheet inventory, plugin folders, animation scan, analytics scan, axe violations) for all pages/viewports.

---

## 0. Corrections to the audit doc's qualitative estimates

The audit doc (Sections 4–6) flagged several things as "likely, confirm in DISCOVERY-001." Here's what the actual crawl found, including where the estimate was **wrong**:

| Audit estimate | What was actually measured | Verdict |
|---|---|---|
| Infinite/looping decorative CSS animations are "the most likely culprit behind feels cheap" | **Zero** elements with `animation-iteration-count: infinite` were found on any of the 5 pages, at any viewport | **Estimate corrected — not present.** No infinite-loop animations to remove in MOTION-005. |
| Elementor mouse-parallax "motion effects" likely present | `widget-motion-fx.min.css` / `modules/motion-fx.min.css` is loaded on every page (part of Elementor Pro's asset bundle) | **Confirmed present** — Elementor's Motion Effects module is active. It doesn't register as an infinite CSS animation (it's JS-driven, scroll/mouse-position-bound), which is why it doesn't show up in the animation-iteration-count scan above. Worth a manual look during MOTION-005 but not a measured performance cost. |
| Google Fonts loading via Google's CDN, adding a render-blocking round trip | Inter is served from `bigbrain-solutions.com/wp-content/uploads/elementor/google-fonts/css/inter.css` — **self-hosted by Elementor**, not fetched from `fonts.googleapis.com` | **Estimate corrected** — no third-party font CDN request exists today. (PERF-002's self-hosting/subsetting plan is still the right call for the rebuild — self-hosting alone doesn't mean the font is subsetted or preloaded — but there's no CDN round-trip to eliminate.) |
| No analytics/tracking script detected | Confirmed — no requests matched GA/gtag, Meta Pixel, Hotjar, Clarity, Matomo, or Cloudflare Web Analytics beacon patterns on any page | **Confirmed.** Zero visibility into visitor behavior today, as suspected. |
| About page uses two H1-level headings in sequence | About page actually has exactly **one H1** (`Professional IT & Web Services Company`), but its heading order is non-sequential (H2 → H3 → H2 → H2 → **H6**, skipping H3–H5) | **Estimate located on the wrong page.** The real double-H1 page is **`/homestock-privacy-policy/`** (2 H1 elements). About page's actual defect is the heading-order skip, not a duplicate H1. Both are real axe-core `heading-order` violations either way — noted below. |
| WordPress + Elementor 4.1.4, "typical" plugin/theme overhead | Confirmed via asset URLs: **Elementor 4.1.4**, **Elementor Pro 3.32.0**, theme **Hello Biz 1.1.1**, WordPress core jQuery 3.7.1 + jquery-migrate 3.4.1, `wp-emoji-release.min.js`, Swiper 8.4.5, SmartMenus, Lottie 5.6.6 | **Confirmed**, exact versions now known (useful for nothing in the rebuild, but confirms the estimate). |
| `wp-sitemap-users-1.xml` exposes author archive, low risk | Confirmed live at `https://bigbrain-solutions.com/wp-sitemap-users-1.xml` (HTTP 200), and it resolves to `https://bigbrain-solutions.com/author/gospargsgmail-com/` — the author-archive slug is **derived from the account's email local-part**, not a generic username | **Confirmed and slightly worse than "low risk."** This doesn't leak the email itself, but it does leak the fact that the WordPress admin account's username is the email's local-part — mildly useful information for a targeted credential-stuffing/phishing attempt against a one-person business with no security team. Non-issue on the Astro rebuild (no user/author system exists at all), but worth being aware of on the WordPress side during the 30-day DEPLOY-001 rollback window. |

**New finding not called out in the audit at all:** every single page load against `www.bigbrain-solutions.com` incurs a full extra redirect hop. The site's actual canonical/serving domain is the **non-www** apex (`https://bigbrain-solutions.com/`, HTTP 200); `https://www.bigbrain-solutions.com/`, `http://www.bigbrain-solutions.com/`, and `http://bigbrain-solutions.com/` all return `301 Moved Permanently` to the non-www HTTPS URL. This is exactly what Lighthouse's "Avoid multiple page redirects" opportunity (~800ms of the LCP budget on every single page, see Section 2) is measuring — it's not a sandbox artifact, it's a real, fixable latency cost on every cold visit that starts with `www.`. **Decision needed at `DEPLOY-001`:** the new Cloudflare Pages site should decide once which of `www` / apex is canonical and 301 the other at the edge (single hop, not the current WordPress-app-level redirect), and the `Location` on the existing site should ideally be fixed even before cutover if easy to do from the WordPress/Hostinger side — flagged for the owner, not blocking the rebuild.

---

## 1. Page inventory confirmed

| Page | URL | HTTP status | Requests (per load) |
|---|---|---|---|
| Home | `/` | 200 (via 1 redirect from `www`) | 55 |
| Services | `/services/` | 200 | 43 |
| About | `/about/` | 200 | 45 |
| Contact | `/contact/` | 200 | 66–69 |
| HomeStock Privacy Policy | `/homestock-privacy-policy/` | 200 | 40 |

Zero console/page errors on any page at any of the 3 viewports (375/768/1440px). All 5 pages render cleanly with no JS exceptions.

---

## 2. Lighthouse scores (measured, not estimated)

Mobile = simulated Moto G Power-class throttling, 375×667. Desktop = simulated, 1440×900, no throttling multiplier beyond Lighthouse's default desktop preset.

| Page | Form | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | Mobile | **54** | 89 | 96 | 85 | 6.3s | 0.298 | 0ms |
| Home | Desktop | **60** | 85 | 100 | 85 | 4.5s | 0.058 | 10ms |
| Services | Mobile | **83** | 89 | 96 | 92 | 3.7s | 0 | 0ms |
| Services | Desktop | **64** | 86 | 100 | 92 | 3.4s | 0.002 | 0ms |
| About | Mobile | **81** | 93 | 96 | 92 | 4.0s | 0.011 | 0ms |
| About | Desktop | **62** | 89 | 100 | 92 | 4.0s | 0.002 | 0ms |
| Contact | Mobile | **66** | 94 | 96 | 92 | 5.4s | 0.172 | 0ms |
| Contact | Desktop | **62** | 89 | 100 | 92 | 3.9s | 0.057 | 0ms |
| HomeStock Privacy | Mobile | **87** | 91 | 96 | 92 | 3.3s | 0.002 | 0ms |
| HomeStock Privacy | Desktop | **63** | 89 | 100 | 92 | 3.6s | 0.007 | 0ms |

**Reading this:** every page fails the Definition of Done's ≥95 performance target today, mobile Home is the worst outlier (54, driven by a 6.3s LCP and the worst CLS of any page at 0.298 — likely a late-loading hero image or web-font swap shifting layout), and desktop scores are *lower* than mobile on 4 of 5 pages, which is unusual — Lighthouse's desktop preset here is unthrottled/fast-network, so a desktop score below the mobile score on the same page usually means the bottleneck is server response time / redirect latency / render-blocking CSS rather than network throughput, which lines up with the redirect finding in Section 0 and the render-blocking Elementor CSS bundle in Section 3. Total blocking time is ~0ms everywhere — this is not a "too much JS execution" problem, it's a "too many render-blocking round trips before first paint" problem. This is the exact class of problem Astro's static output structurally removes.

**Biggest recurring Lighthouse opportunity, every page:** `redirects` — "Avoid multiple page redirects" (~800ms flagged on all 10 runs). Directly explained by Section 0's www→apex redirect. Second most common: `unused-javascript` on Home and Contact (240ms and 430ms respectively) — consistent with Elementor/Elementor Pro shipping its full JS runtime regardless of which widgets a given page actually uses.

**Automated cross-check against PageSpeed Insights:** the roadmap's testing step calls for spot-checking 2 of these runs against the PSI web UI. I attempted this via PSI's public API (`pagespeedonline/v5`) from this machine and got `HTTP 429` (shared public-quota rate limit, not specific to this key/session) on both attempts. The local Lighthouse runs use the same Lighthouse engine PSI runs under the hood, just invoked directly rather than through Google's hosted runner, so the scores above aren't a "different tool" — but I want to flag honestly that I could not get an independent second-source confirmation from PSI itself in this session. Worth a manual check at `pagespeed.web.dev` for `/` and `/contact/` when convenient — noted, not blocking.

---

## 3. Script & stylesheet inventory

Identical stack on every page (versions confirmed from asset query strings):

**Plugins/theme:** Elementor `4.1.4`, Elementor Pro `3.32.0`, theme Hello Biz `1.1.1`.

**JS loaded on every page (Home, the heaviest, shown as representative):**
jQuery 3.7.1 + jquery-migrate 3.4.1 · `wp-emoji-release.min.js` · Elementor webpack runtime + frontend-modules + frontend bundles · Elementor Pro webpack-pro runtime + frontend + elements-handlers + nav-menu bundle · SmartMenus 1.2.1 · jQuery Sticky 3.32.0 · Lottie 5.6.6 (+ Elementor Pro's Lottie bundle) · Swiper 8.4.5 · Cloudflare's email-decode obfuscation script · Elementor's shared-frontend-handlers/text-editor/carousel bundles.

22 script tags, 21 stylesheets on Home; Contact is heaviest overall (34 scripts, 66–69 total requests — the Google Maps embed and form validation add real weight, confirming the audit's "lazy-load the map" recommendation in PAGE-003 is worth doing). Full per-page lists are in `discovery-assets/crawl-results.json`.

**CSS:** theme.css + header-footer.css (Hello Biz) · Elementor frontend.min.css + several per-widget CSS files (`widget-image`, `widget-icon-list`, `widget-heading`, `widget-social-icons`) · Elementor Pro `widget-nav-menu`, `modules/sticky`, `modules/motion-fx`, `widget-lottie`, `widget-testimonial-carousel`, `widget-carousel-module-base` · Swiper CSS · per-post generated Elementor CSS (`post-201.css`, `post-211.css`, etc. — one file per Elementor-edited post/page, standard Elementor behavior) · self-hosted Inter `google-fonts/css/inter.css`.

This confirms the audit's Section 6 structural read: a 5-page brochure site is loading a carousel library, a Lottie animation runtime, a sticky-header module, and a full page-builder JS/CSS framework on every single page load, regardless of whether that specific page uses those features.

---

## 4. Animation inventory

**Infinite/looping CSS animations found: zero**, across all 5 pages × 3 viewports. This corrects the audit's Section 5 working assumption — see Section 0 above. There is nothing to "remove entirely" per the original MOTION-005 framing; that task becomes a pure verification checkpoint (confirm the rebuild doesn't introduce any) rather than a removal task.

Elementor's Motion Effects (mouse-parallax) module CSS is present sitewide but is JS/scroll-position-driven, not a CSS keyframe loop, so it wouldn't show up as "feels busy on an idle page" — if the owner still perceives constant motion, it's more likely the Motion Effects module reacting to scroll/mouse position than a true infinite loop. Confirm the felt experience against a live screen recording during DISCOVERY-002 if this still doesn't match perception.

---

## 5. Accessibility (axe-core)

Axe-core was run against every page at both 1440px (desktop) and 375px (mobile) viewports — 10 runs total, raw output in `discovery-assets/axe/`.

**Violations found (aggregated across all pages):**

| Rule | Impact | Pages affected | What it means |
|---|---|---|---|
| `color-contrast` | Serious | Home, Services, About, Contact, HomeStock Privacy | Some text/background pairs fail WCAG AA contrast — nav menu items on Home were the most concrete instance found (3 nodes). |
| `link-name` | Serious | All 5 pages | Logo `<a>` wraps an image with no discernible accessible name on at least 2 elements per page. |
| `heading-order` | Moderate | All 5 pages | Heading levels skip (e.g. jump from H2/H3 straight to H6) — About page is the clearest example (H2→H3→H2→H2→**H6**). |
| `landmark-one-main` | Moderate | Home, Services, About, Contact (not HomeStock Privacy) | No `<main>` landmark — Elementor's default markup doesn't emit one. |
| `region` | Moderate | Home, Services, About, Contact | Page content sits outside any landmark region (follows directly from the missing `<main>`). |

No `critical`-impact violations were found on any page. This is a real, if modest, baseline — the rebuild's A11Y-001 target of **zero critical/serious violations** means `color-contrast` and `link-name` (both currently "serious") need explicit attention in DESIGN-002's component states, not just "the new design will probably be fine."

---

## 6. SEO findings (measured)

- **Meta descriptions: confirmed absent on all 5 pages** — `document.querySelector('meta[name=description]')` returned `null` everywhere, matching the audit's assumption exactly.
- **Open Graph / Twitter Card tags: also absent on all 5 pages** (not explicitly called out in the audit's SEO section, but a real gap SEO-001 should also close — currently a shared link to any page renders with no title/image control on social platforms).
- **Canonical tags:** present and correctly self-referential on all 5 pages, but they all point to the **non-www apex** (`https://bigbrain-solutions.com/...`), which is worth keeping in mind when this document elsewhere (and the roadmap/audit) refers to `www.bigbrain-solutions.com` as "the" production URL — see Section 0's redirect finding.
- **Sitemap:** `wp-sitemap.xml` is a valid index referencing `wp-sitemap-posts-page-1.xml` and `wp-sitemap-users-1.xml`. The latter is confirmed live and exposes one author-archive URL — see Section 0.
- **`robots.txt`:** valid, disallows only `/wp-admin/` (with an explicit `Allow` for `admin-ajax.php`), references the sitemap correctly.
- **`hreflang`:** none present on any page (expected, no second locale exists yet).

---

## 7. Screenshots

All 15 (5 pages × 375/768/1440px) full-page screenshots are committed at `docs/discovery-assets/screenshots/{slug}-{viewport}.png`. These are the visual baseline referenced throughout the audit's Sections 4 (visual audit) and 11 (design direction) — everything described there as "generic Elementor-theme default" is now backed by an actual pixel reference rather than a description, to compare against once the Astro rebuild's design system (DESIGN-001/002) starts producing preview-route screenshots of its own.

---

## 8. What this changes for later phases

- **MOTION-005** is now a pure regression check (confirm nothing infinite/looping got introduced), not a removal task — no infinite animations exist today to remove.
- **DEPLOY-001** needs an explicit www-vs-apex canonicalization decision (recommend keeping `www.bigbrain-solutions.com` as canonical on the new Cloudflare Pages site, since that's the domain the owner and this project's docs consistently refer to, with a single edge-level 301 from the apex — cutting the current double-hop to zero).
- **PAGE-002 (About)** fix target is heading-order (H2→H3→H2→H2→H6), not a double-H1 — the double-H1 is actually on **PAGE-004 (HomeStock Privacy Policy)**, so that task's acceptance criteria should include a single-H1 check too.
- **PERF-002**'s font self-hosting/subsetting work is still fully warranted (no evidence today's self-hosted Inter is subsetted for Croatian diacritics, and it isn't preloaded), just not for the "eliminate a Google Fonts CDN request" reason originally assumed.
- Baseline Lighthouse mobile performance to beat: **54–87** depending on page (Home is worst, HomeStock Privacy is best). Baseline accessibility: **85–94**. The Definition of Done's ≥95/≥95 targets represent a real, measurable improvement over today, not a formality.

---

## 9. Answers to DISCOVERY-002's decision (a) — carried forward here since the data resolves it directly

DISCOVERY-002 asks whether any infinite animations found are ones the owner likes and wants kept. Since none were found (Section 4), decision (a) is moot — logged here and in `docs/decisions.md` rather than blocking on it. Decisions (b) and (c) (Croatian copy authorship, domain/routing structure) remain genuinely open owner-delegated calls and are addressed in `docs/decisions.md`.
