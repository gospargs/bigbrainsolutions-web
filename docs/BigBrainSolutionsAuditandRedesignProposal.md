# BigBrain Solutions — Website Audit & Redesign Proposal

**Prepared for:** Gordan Sentić, Founder, BigBrain Solutions (bigbrain-solutions.com)
**Prepared by:** Claude, acting as Senior Product Manager / Software Architect / Creative Director
**Date:** August 18, 2026
**Status:** Phase 0 deliverable — analysis and recommendation only. No changes have been made to the live site.

---

## How this audit was performed, and one important limitation

Everything in this document is based on live inspection of `https://www.bigbrain-solutions.com` (all 5 indexed pages, robots.txt, sitemap, meta tags, rendered content) done from this session. This sandbox does not have raw browser/network access to your domain (only a content-fetching tool, no Lighthouse/Playwright against your live site), so I could not pull exact Core Web Vitals numbers or a byte-for-byte script/plugin inventory here. Everything performance- and animation-related below is a qualified, expert assessment based on what WordPress + Elementor 4.1.4 sites of this shape typically ship, plus what was observable. **The very first Claude Code task (`DISCOVERY-001` in the companion roadmap doc) is a full Playwright + Lighthouse crawl of the production site**, which will confirm or correct the estimates below with hard numbers before any design work begins. I'm flagging this openly rather than presenting estimates as measurements.

---

## 1. Executive Summary

BigBrain Solutions is a one-person IT/web services business ("obrt", sole proprietorship) based in Dubrovnik, Croatia, run by founder Gordan Sentić. The current site is a 5-page WordPress + Elementor 4.1.4 build: Home, Services, About, Contact, plus an orphaned privacy-policy page for a separate mobile app ("HomeStock") that isn't linked or mentioned anywhere else on the site.

Three findings should reshape the brief before any redesign work starts:

1. **The site is not currently in Croatian.** Every page (Home, Services, About, Contact) is written entirely in English, with no language switcher and no Croatian version anywhere. The sitemap only lists the English pages. This is a real gap, not a translation touch-up — Croatian content needs to be *written*, not just toggled on, and it should become the true default per your brief.
2. **The positioning is split between two different businesses.** Half the site (web application development, custom software, 6+ years dev experience, a real 3-year enterprise web-app engagement for Ubique Safety Consultants) reads like a boutique software/web studio. The other half (computer repair, virus removal, hardware installation, home Wi-Fi setup) reads like a local PC-repair callout service. Both are legitimate and both can stay, but a "premium modern technology company" design pop only works if the information architecture clearly separates *who this is for* — a homeowner with a broken laptop is not shopping the same way as a business needing a custom web application, and right now they're mixed into the same hero, same nav, same cards.
3. **You already have your best case study and it isn't on the site.** HomeStock — a real shipped mobile app with Supabase/Firebase backend — only surfaced via a privacy-policy URL required by the App Store, which the owner has confirmed was intentional at the time (not an oversight) but is no longer the desired outcome: HomeStock is now to be featured publicly, at navigation level, for every visitor. For a company trying to look "technically advanced," a real product you built and shipped is worth more than any amount of visual polish — this becomes a flagship page, not a footnote (see Section 9 and the companion roadmap's `CONTENT-003`).

The recommendation in this document is to rebuild on **Astro, deployed to Cloudflare Pages**, with a proper design system, an intentional motion system, and Croatian as the true default locale with English as a fully-localized secondary locale — not a "keep WordPress and add plugins" patch job, and not a "move to a heavy headless stack" overcorrection either. Full reasoning in Section 10.

---

## 2. Current Site Inventory

| Page | URL | Notes |
|---|---|---|
| Home | `/` | Hero, 3 value-prop blocks, 6 differentiators, 5 testimonials, warranty section, CTA band |
| Services | `/services/` | 7 services listed as cards, no pricing, single generic CTA |
| About | `/about/` | Company story, founder bio (Gordan Sentić), 6-item FAQ |
| Contact | `/contact/` | Form (name, email, individual/business, service dropdown, message), Google Maps embed, hours, phone, email |
| HomeStock Privacy Policy | `/homestock-privacy-policy/` | Legitimate but completely orphaned — not linked from nav, footer, or any other page |

Total: 5 pages. Last content update per sitemap: September 16, 2025 (privacy policy updated August 2026). Robots.txt and sitemap are correctly configured and unblocked. One sitemap oddity worth fixing regardless of platform: WordPress is also publishing a `wp-sitemap-users-1.xml` that exposes author/user archive URLs — low risk on a one-person site but unnecessary attack-surface/information disclosure and worth removing.

**Contact information found:** Dubrovnik, Croatia · +385 99 649 9274 · Mon–Sat 6am–6pm · LinkedIn linked in footer. No visible analytics/tracking script was detected on the page (this should be confirmed in DISCOVERY-001) — if true, you currently have no visibility into visitor behavior at all.

---

## 3. UX Audit

**What works:**
- The core offer is clear once you read the page: reliable, personal, warrantied IT/web help from a real local expert, not a call center.
- Five testimonials with full names is good, unusual trust signal for a company this size.
- The 60-day warranty is a strong, concrete differentiator — most competitors don't offer this.
- Single consistent CTA ("Request An Estimate") throughout — no competing calls to action.

**What's weak:**
- **No segmentation.** A visitor can't quickly self-identify as "I'm a homeowner with a broken PC" vs. "I'm a business that needs a custom web app" vs. "I'm looking for the HomeStock app." These are three different buyers with three different decision speeds and price sensitivities, all funneled into one generic form.
- **Services have no pricing signal at all**, not even "starting from" ranges. For repair/support services this is normal, but for web/software development it creates friction — serious B2B buyers bounce off "request an estimate" with zero pricing context faster than they would with even a rough range.
- **No case studies.** The Ubique Safety Consultants three-year engagement is mentioned only inside a testimonial quote. That should be a full case study with what was built, the stack, and the outcome.
- **The FAQ lives only on the About page**, which is an odd location — FAQs there answer logistics questions (repair turnaround, warranty terms) that belong nearer Services/Contact, where the buying decision actually happens.
- **No visible language switcher**, and no Croatian at all, in a business physically located in Croatia serving (per phone number and hours) a presumably majority-local clientele.

---

## 4. UI / Visual Audit

Based on rendered content and Elementor's default component patterns (to be confirmed pixel-for-pixel in DISCOVERY-001):
- Visual identity is generic Elementor-theme default: no evidence of a defined color system, custom iconography, or a distinctive type pairing beyond default Google Fonts loading.
- Logo asset is a `.webp` file reused identically across all pages — fine technically, but there's no supporting brand system (no secondary marks, no consistent icon set for services, no photography or illustration direction beyond "a design illustration" and "an FAQ-related graphic" on the About page).
- Card-based service layout is the expected/safe Elementor pattern — not wrong, but currently undifferentiated from thousands of other local-service WordPress sites.
- No dark mode, no distinctive section-to-section rhythm described in the content structure (hero → value props → differentiators → testimonials → warranty → CTA → footer is a fairly generic stacking order).

**Verdict:** there is no real "premium tech company" visual identity yet to preserve — this section of the brief (Sections 4–6 below) is closer to a green-field design system than a refinement of an existing one. That's good news: less to unlearn.

---

## 5. Animation Audit (qualified — confirm in DISCOVERY-001)

You described elements that move constantly. In Elementor sites at this tier, "constantly moving" almost always comes from one or more of:
1. Elementor's built-in **entrance animations** (fadeIn/slideIn on scroll) — usually fine, low-cost, one-shot.
2. **Continuous CSS keyframe "floating" effects** on decorative shapes/icons (very common in Elementor addon packs like Premium Addons / Happy Addons / Essential Addons) — these run forever, on every page, whether or not anyone's looking at them, and are the most common source of both "feels busy/cheap" complaints and unnecessary battery/CPU draw on mobile.
3. Elementor's **mouse-parallax "motion effects"** on hero images — can feel premium when subtle, feel gimmicky when overdone, and are usually implemented with no `prefers-reduced-motion` handling at all in stock Elementor.

Until DISCOVERY-001 confirms which of these is present, my working assessment: infinite decorative float/pulse animations are the most likely culprit behind "feels cheap," and are also the easiest to fix — they should be replaced entirely, not tuned. Scroll-triggered entrance reveals are worth *keeping the intent of* but rebuilding cleanly. See Section 12 for the target motion system.

---

## 6. Performance Audit (qualified — confirm in DISCOVERY-001)

Structural risk factors present in any WordPress + Elementor 4.1.4 site of this shape, regardless of this specific build's optimization level:
- Elementor ships its own CSS/JS runtime (frontend bundle + webpack runtime) on every page load, on top of WordPress core, jQuery (still an Elementor dependency), and the active theme's assets — this is meaningfully more JS/CSS than a 5-page brochure site needs.
- Google Fonts are loading with `font-display: swap` (confirmed from meta), which avoids invisible text but doesn't eliminate the extra render-blocking font request round trip typical of default Elementor/Google Fonts integration.
- No evidence of a CDN/image-optimization layer beyond whatever Cloudflare's default proxy provides — WordPress media library images are frequently shipped oversized and in legacy formats (JPEG/PNG rather than AVIF/WebP) unless a plugin is actively converting them.
- PHP + MySQL round-trip on every request (unless a full-page cache plugin is active, which wasn't detectable from here) adds latency a static export architecture doesn't have at all.

**Bottom line:** for a 5-page site that changes a few times a year, static-first architecture (Section 10) removes essentially the entire WordPress performance tax at the source rather than requiring ongoing plugin/cache tuning to fight it.

---

## 7. SEO Audit

- Title tags exist and follow a sane `Page – Big Brain Solutions` pattern; meta descriptions were not detected on any page — likely missing or not populated, which means Google is auto-generating snippets from page content. This should be fixed regardless of architecture.
- Canonical URLs are present and correctly self-referential.
- `robots.txt` and sitemap are valid and unblocked.
- No structured data (JSON-LD) was detected — a `LocalBusiness` schema (with address, hours, phone, `sameAs` for LinkedIn) and `Service` schema per offering are low-effort, high-value additions for a local business and are currently entirely absent.
- No `hreflang` exists (expected — there's no second language yet), but this needs to be designed correctly from day one of the multilingual build (Section 13), not bolted on after.
- The `wp-sitemap-users-1.xml` author-archive sitemap is unnecessary exposure and should not exist on the rebuilt site.
- No blog/content section exists — for a services business, this is a missed long-tail SEO channel (e.g. "computer repair Dubrovnik", "web application development Dubrovnik"), but adding one is a strategic decision for you to make, not a default recommendation — only add it if you're willing to actually publish to it.

---

## 8. Accessibility Audit

Cannot fully verify contrast ratios, focus states, or ARIA structure without rendered DOM access (DISCOVERY-001 will run axe-core/Lighthouse a11y checks). Structural note from content inspection: the About page reportedly uses "Primary Heading" and "Secondary Heading" as two H1-level style headings in sequence — this needs to be corrected to a proper single-H1 hierarchy in the rebuild. Target for the new build: WCAG 2.1 AA as a hard minimum, including full `prefers-reduced-motion` support (Section 12) and keyboard-operable navigation/mobile menu.

---

## 9. Content & Business Audit — Keep / Improve / Remove / Replace / Add

**KEEP**
- The 60-day warranty — genuinely strong differentiator, feature it more prominently, not less.
- The five named testimonials — real trust signal, keep and expand.
- The founder-led, personal-service positioning ("Gordan Sentić, Founder and Lead Application Developer") — authenticity is an asset for a solo operator competing against faceless agencies; don't sand this down into generic corporate copy.
- The 7-service offering structure — the list itself is fine, it's the presentation and hierarchy that need work.

**IMPROVE**
- Hero copy — currently a features list ("computer repairs, IT support, website development, networking, software services"). Needs to lead with outcome/positioning, not a service inventory, and needs a visible path to split by audience (home vs. business vs. software/web).
- FAQ — move/duplicate the buying-relevant questions to Services and Contact, not only About.
- Services page — add at least directional pricing signals ("from €X" or "custom quote" tiers) to reduce contact-form friction for cold traffic.

**REMOVE**
- The `wp-sitemap-users-1.xml` exposure (platform-level cleanup, applies regardless of architecture decision).
- Any infinite/decorative CSS float animations that aren't earning their keep (confirm exact elements in DISCOVERY-001).

**REPLACE**
- The entire visual system — there isn't a defined one to preserve (Section 4).
- The generic "hero → value props → CTA" stacking with a structure that segments by visitor intent (Section 11 IA).

**ADD**
- A real case study for the Ubique Safety Consultants engagement (and any others you can get sign-off on).
- A **dedicated, nav-level HomeStock product page** (not a homepage footnote) — confirmed by the owner as a deliberate priority: HomeStock should be visible to every visitor, built to the same design/motion/performance bar as the rest of the site, with App Store link, screenshots, and a CTA back into the core service funnel.
- Croatian as the true default language, properly localized (Section 13).
- `LocalBusiness` + `Service` structured data.
- Basic analytics (privacy-respecting — see Section 18).
- A visible, elegant language switcher.

---

## 10. Architecture Decision

### Option A — Keep WordPress + Elementor, optimize in place
*Performance:* capped — can improve materially (caching, image optimization, script cleanup) but cannot reach static-site-tier Core Web Vitals; Elementor's runtime overhead is structural, not a config issue.
*SEO:* fine with plugins (Yoast/RankMath), nothing architecture-blocks this.
*Dev complexity:* lowest — no migration.
*Maintenance:* ongoing WP core/plugin/theme updates forever; WordPress is the most-attacked CMS on the internet, and that burden falls entirely on a one-person business with no dedicated ops.
*Content editing:* easiest for a non-technical editor — but you're a developer, so this advantage matters less for you specifically.
*Multilingual:* WPML (paid, ~$99+/yr, heavier) or Polylang (free tier limited) — both add real weight and complexity to an already-heavy Elementor stack.
*Animations:* achievable but fighting the platform — GSAP/View Transitions integrate awkwardly inside Elementor's DOM/JS lifecycle.
*Scalability:* fine for 5–20 pages, no advantage beyond that here.
*Hosting/cost:* needs PHP+MySQL hosting (~$5–25/mo typical), plus plugin licenses (page builder pro tier, security plugin, translation plugin can easily add $150–300+/yr).
*Security:* largest attack surface of all four options.
*Migration difficulty:* none — it's the status quo.

### Option B — WordPress as headless CMS + modern frontend (e.g. Next.js)
*Performance/SEO:* can be excellent.
*Dev complexity:* highest of all options — you're running and securing a WordPress instance *and* building/maintaining a separate frontend app, for content that changes a handful of times a year.
*Maintenance:* two systems instead of one; WP still needs security patching even though it's "just an API."
*Verdict:* this is the right call for a content-heavy site with a real editorial team publishing constantly. This is not that site. Not recommended here — it adds the worst parts of both worlds (WP's security/maintenance burden *and* a second app to run) without a workload that justifies it.

### Option C — Astro + Git-based content, deployed to Cloudflare Pages
*Performance:* best available option — Astro ships zero JS by default and only hydrates the specific interactive "islands" (contact form, animated components, language switcher) that need it. This is the most direct path to excellent Core Web Vitals.
*SEO:* excellent — full control over every meta tag, structured data, and `hreflang` per page, static HTML means nothing to render-block indexing.
*Dev complexity:* low-to-moderate, and squarely within what a developer-founder can maintain himself.
*Maintenance:* effectively minimal — no database, no PHP runtime, no plugin-update treadmill, no WP security surface at all.
*Content editing:* content lives as Markdown/MDX in Astro **content collections**, one file per language per page. You already write code — this is a natural fit; if you later want a visual editor for non-technical help, a git-based headless CMS (Decap CMS or TinaCMS) can be layered on top without re-architecting anything.
*Multilingual:* Astro's built-in i18n routing handles this cleanly and is the natural fit for exactly the HR-default/EN-secondary structure you described (Section 13).
*Animations:* first-class — CSS scroll-driven animations, View Transitions API, and GSAP (only where it earns its complexity) all integrate cleanly with Astro's islands model, with zero framework fighting.
*Scalability:* very good — content collections scale to hundreds of pages without architectural change if the business grows (blog, more case studies, more languages).
*Hosting/cost:* Cloudflare Pages is free at this traffic tier, and your DNS is *already on Cloudflare* — this is a genuinely rare case where the "best" technical answer is also the cheapest and requires no new vendor relationship.
*Security:* smallest attack surface of all options — static files, no database, no server-side runtime to exploit (form submission handled via a small serverless function, not a monolithic app).
*Migration difficulty:* moderate, one-time cost — 5 pages of content to port, a design system to build, a contact form to re-platform (e.g. Cloudflare Pages Function → email via Resend, or a service like Web3Forms). This is exactly what the Claude Code roadmap in the companion document is scoped to do.

### Option D — Other (e.g. Webflow, Framer, Squarespace)
Considered and rejected: these trade the WordPress lock-in for a different vendor lock-in, cap custom animation/performance control below what Astro allows, and don't materially reduce the migration effort versus Option C while giving up long-term flexibility and cost (recurring SaaS fees vs. Cloudflare Pages' free tier).

### Recommendation

**Option C: Astro + Markdown/MDX content collections, hosted on Cloudflare Pages.**

This is not a "move to what's newest" call — it's the option that best fits *this specific site*: a small, infrequently-updated, performance- and design-sensitive brochure site, run by a technically capable founder, on a domain already living on the exact platform (Cloudflare) that hosts Astro output for free with a global edge network. WordPress + Elementor is the wrong tool for a 5-page site that needs to feel premium and load instantly — its overhead exists to serve a use case (non-technical editors, huge content volumes, a plugin ecosystem) that doesn't apply here. If BigBrain Solutions later becomes a content-marketing-heavy business publishing multiple articles a week with a non-technical team, that recalculation changes — worth revisiting then, not now.

---

## 11. Design Direction & Design System

**Direction:** confident, technical, quietly premium — closer to a boutique dev studio's site than a template-driven local-service site, while still making the repair/support side feel trustworthy and approachable rather than sterile. Avoid the two failure modes explicitly called out in your brief: generic SaaS-gradient-blob aesthetics, and animation-for-its-own-sake.

### Typography
- **Primary (display/headings):** a confident geometric or grotesque sans with real personality at large sizes — e.g. **Space Grotesk** or **General Sans** — used for H1/H2 and hero statements.
- **Secondary (body/UI):** a highly legible, neutral sans for body copy and UI — e.g. **Inter** — used for paragraphs, nav, forms, buttons.
- **Scale:** modular scale (1.25 ratio), base 16px/1rem. H1 clamp(2.5rem, 5vw, 4rem), H2 clamp(1.75rem, 3vw, 2.5rem), H3 1.5rem, body 1rem, caption 0.875rem.
- **Weights:** 400 body, 500 UI/buttons, 600 subheads, 700 H1/H2.

### Color System
- **Background:** near-black `#0B0D10` (dark-first premium feel) with a light-mode equivalent `#FAFAF9`.
- **Surface:** `#14171B` (dark) / `#FFFFFF` (light), used for cards, elevated panels.
- **Primary:** a confident deep blue or electric indigo, e.g. `#3B5BFF` — used for primary CTAs, links, active states.
- **Accent:** a single warm/energetic accent used *sparingly* (badges, hover glows, chart/graphic highlights) — e.g. `#00E5A0` (signals "technical/software") — not to be overused.
- **Text:** `#F5F5F4` (dark) / `#111114` (light) primary text; `#9A9A9F` muted text for captions/secondary copy.
- **Borders:** `#22262B` (dark) / `#E7E5E4` (light), 1px, used sparingly to define card edges.
- **Semantic:** success `#22C55E`, warning `#F59E0B`, error `#EF4444` — standard, not overdesigned.
- Support both dark (default, matches "premium tech" positioning) and light mode via `prefers-color-scheme`, with a manual toggle in the header.

### Layout
- **Max content width:** 1280px, with a 1440px "wide" variant for full-bleed hero/imagery sections.
- **Grid:** 12-column, 24px gutter desktop / 16px mobile.
- **Spacing scale:** 4px base — 4/8/12/16/24/32/48/64/96/128, used consistently for all padding/margin (no arbitrary values).
- **Section spacing:** 96–128px vertical rhythm desktop, 48–64px mobile.
- **Border radius:** 12px cards/buttons, 24px large feature panels, 999px pills/badges.
- **Shadows:** one soft ambient shadow token for dark mode (`0 8px 32px rgba(0,0,0,0.4)`), one for light mode (`0 4px 16px rgba(0,0,0,0.08)`) — no heavy drop shadows.
- **Breakpoints:** 375 (mobile), 768 (tablet), 1024 (laptop), 1280 (desktop), 1536 (large desktop).

### Components (defined in full detail in the Claude Code roadmap)
Header/nav with scroll-aware compact state · primary/secondary/ghost button system with defined hover/active/focus states · service card and case-study card variants · testimonial carousel · animated stat counters · CTA band · footer with sitemap, language switcher, and contact block · accessible mobile menu (full-screen overlay, not a dropdown) · language switcher (flag-free, text-based "HR / EN" toggle in header, elegant not gimmicky) · form components with inline validation states.

---

## 12. Motion / Animation System

**Principle:** motion should confirm and guide, not decorate. Every animation must answer "what is this telling the user," or it's cut.

**Keep the intent of, rebuild cleanly:**
- Scroll-triggered entrance reveals for section headings and cards — implemented via native **CSS scroll-driven animations** (`animation-timeline: view()`) where supported, with an IntersectionObserver-based fallback — no large JS animation library required for this alone.
- Hero entrance — a single, restrained, one-shot sequence (headline → subhead → CTA staggered by ~80ms) on page load, respecting `prefers-reduced-motion`.

**Add (currently missing, would read as premium):**
- Shared-element page transitions between routes using the **View Transitions API** (Astro has first-class support) — this alone will make navigation feel dramatically more "app-like" and expensive versus a standard WordPress full-page reload.
- Micro-interactions: button hover states with a subtle scale/glow (150ms ease-out), card hover lift (4px translate + shadow), link underline draw-on-hover.
- Animated stat counters (e.g. "6+ years", "60-day warranty", "5-star reviews") that count up once when scrolled into view — cheap to build, reads as polish.

**Remove entirely:**
- Any infinite/looping decorative float/pulse/bounce animation that runs regardless of user attention (confirm exact instances in DISCOVERY-001) — these are the primary suspect behind "feels cheap" and behind unnecessary mobile battery/CPU load.

**Use sparingly, only where it earns complexity:**
- **GSAP** — only for the hero's more choreographed sequence and any scroll-scrubbed timeline (e.g. a case-study scroll narrative), not for basic reveals. Load it only on the pages that need it (Astro islands make this trivial), never globally.
- Cursor-follow / mouse-parallax effects — desktop-only, disabled on touch devices by default, not just via a media query fallback.

**Mobile behavior:** entrance/reveal animations still run (cheap, CSS-only), but parallax, cursor-follow, and GSAP-scrubbed timelines are disabled below the `768px` breakpoint — not just "reduced," fully off, since they're the highest-cost-lowest-value animations on a touch device.

**`prefers-reduced-motion`:** a global CSS rule collapses all entrance/parallax/hover-transform animations to instant or opacity-only transitions when this is set — implemented once at the design-token level (see `MOTION-001` in the roadmap), not per-component, so it can't be missed.

---

## 13. Multilingual Architecture

**Finding to act on:** there is currently *no* Croatian content on the live site at all, despite Croatian being the intended default. This is not a toggle — Croatian copy needs to be written (or professionally translated from a source you approve) for every page, not machine-translated wholesale.

**Recommended approach:** Astro's built-in i18n routing, with Croatian as the default locale at the root (`/`) and English at `/en/` — content stored as parallel Markdown/MDX files per locale inside Astro content collections (e.g. `src/content/pages/hr/services.md` and `src/content/pages/en/services.md`).

**Why not WPML/Polylang/TranslatePress:** those are the right tools *inside WordPress*, but since Section 10 recommends leaving WordPress, they're moot — Astro's native i18n does everything they'd offer (locale routing, per-locale metadata) with no plugin licensing cost and no runtime overhead, since it's resolved at build time into fully static pages per locale.

**Requirements to implement correctly (all specified as tasks in the roadmap):**
- Croatian at `/`, English at `/en/…`, with a clean 1:1 URL mapping between locales (e.g. `/usluge/` ↔ `/en/services/` if you want localized slugs, or `/services/` ↔ `/en/services/` if you prefer identical slugs — recommend localized slugs for SEO, e.g. `/o-nama/` for `/about/`).
- `hreflang` alternate tags on every page pointing to its counterpart in the other locale, plus `x-default` pointing to the Croatian version.
- Fully localized `<title>`, meta description, and Open Graph/Twitter metadata per locale — not just body copy.
- A locale-aware sitemap (either one sitemap with both locale URLs and hreflang annotations, or two sitemaps referenced from one index).
- Localized 404 pages for both locales.
- Visible, elegant language switcher in the header that preserves the current page when switching locale (i.e. switching from `/services/` goes to `/en/services/`, not to the English homepage).
- Architecture allows adding a third language later (e.g. German or Italian, common for Dubrovnik's tourism-adjacent client base) by adding one more locale folder — no structural change needed.

---

## 14–18. SEO / Performance / Hosting / Security / Analytics Strategy (forward-looking)

**SEO strategy:** localized on-page SEO per Section 13, `LocalBusiness` + `Service` JSON-LD structured data, meta descriptions on every page (currently missing), clean localized URL slugs, internal linking from Home/Services into the new case-study content, submit both locale sitemaps to Google Search Console post-launch.

**Performance strategy:** static-first Astro output eliminates most of the WordPress tax at the source (Section 6); on top of that: serve all images as responsive `<picture>` sets in AVIF/WebP with explicit width/height (no CLS), self-host and subset the chosen fonts with `font-display: swap`, ship zero JS by default and hydrate only interactive islands, defer/lazy-load below-the-fold content and the Google Maps embed on Contact.

**Hosting/deployment architecture:** Cloudflare Pages for the Astro static output (build-on-git-push from a GitHub/GitLab repo), Cloudflare Pages Functions (or a lightweight transactional email service like Resend) for contact-form submission handling, DNS stays exactly where it is today on Cloudflare — this is the lowest-friction possible hosting move given your existing setup.

**Security considerations:** moving off WordPress removes the single largest recurring security burden (core/plugin/theme CVEs); remaining surface is the contact-form endpoint (needs rate-limiting and spam protection — Cloudflare Turnstile, not a visible/annoying CAPTCHA) and standard Cloudflare-level protections (already available: WAF, bot management) which should be turned on regardless of frontend architecture.

**Analytics/tracking:** no tracking currently detected — recommend a privacy-respecting, cookie-consent-light option such as **Cloudflare Web Analytics** (free, already native to your DNS provider, no cookie banner legally required in most interpretations since it's not tracking individuals) as the default, with GA4 as an optional add-on only if you specifically want audience/funnel reporting beyond basic traffic.

---

## 19. Definition of Done / Launch Checklist (summary)

Full phase-by-phase detail is in the companion document, *BigBrain Solutions — Claude Code Implementation Roadmap*. At a high level, launch is ready when: both locales are fully built and content-reviewed by you in Croatian and English; Lighthouse scores are ≥95 performance / ≥95 accessibility / 100 SEO / ≥95 best-practices on mobile and desktop for every page; all animations respect `prefers-reduced-motion` and are disabled appropriately on mobile; the contact form delivers real submissions end-to-end in production; `hreflang`, sitemap, and structured data validate cleanly; and the site has been checked on real iOS/Android devices in addition to browser emulation.

---

## Sources consulted

- [Big Brain Solutions — homepage](https://bigbrain-solutions.com/)
- [Big Brain Solutions — About](https://bigbrain-solutions.com/about/)
- [Big Brain Solutions — Services](https://bigbrain-solutions.com/services/)
- [Big Brain Solutions — Contact](https://bigbrain-solutions.com/contact/)
- [Big Brain Solutions — HomeStock Privacy Policy](https://bigbrain-solutions.com/homestock-privacy-policy/)
- [Big Brain Solutions — LinkedIn](https://hr.linkedin.com/company/bigbrain-solutions?trk=similar-pages)
