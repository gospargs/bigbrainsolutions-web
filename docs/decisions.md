# Decisions Log

Per the roadmap's "Owner decisions log" item 3, the owner has delegated remaining open decisions to Claude Code's judgment rather than blocking the build on further input. Each entry below states the decision, the reasoning, and what would need to change if the owner disagrees later. Entries are added as each phase reaches a decision point — this file grows over time, it is not written once.

---

## DISCOVERY-002 — decisions arising from `discovery-report.md`

**(a) Should any infinite animation found be kept in spirit?**
Moot. The Playwright crawl in `discovery-report.md` §4 found **zero** elements with `animation-iteration-count: infinite` on any of the 5 production pages. There is nothing to preserve the intent of. MOTION-005 is downgraded from a removal task to a verification checkpoint.

**(b) Will Croatian copy be owner-written or Claude-drafted for review?**
**Decision: Claude-drafted.** CONTENT-001 will produce natural, locally-appropriate Croatian copy (not literal machine translation) for every rebuilt page, written by Claude Code as the primary drafting pass. Every Croatian string will be listed in `docs/content-review-checklist.md` (created at CONTENT-001) for the owner's native-speaker sign-off before `DEPLOY-001`. This matches the roadmap's own stated fallback plan in CONTENT-001 and lets the build proceed without stalling on the owner's schedule.
*Why this call:* the owner is the only native speaker available and delegated remaining decisions rather than requesting to write copy himself; drafting-for-review is explicitly the documented fallback path in the roadmap when the owner doesn't specify otherwise.
*Revisit if:* the owner would rather write Croatian copy from scratch himself — straightforward to swap, since the checklist gives him a per-string list to override any of.

**(c) Is `/` = hr, `/en/` = en domain structure acceptable?**
**Decision: Yes, with localized Croatian slugs.** Croatian at the root (`/`, `/usluge/`, `/o-nama/`, `/kontakt/`), English at `/en/` with English slugs (`/en/services/`, `/en/about/`, `/en/contact/`) mirroring 1:1. This is the audit doc's own Section 13 recommendation ("recommend localized slugs for SEO"), and nothing in the owner's decisions log overrides it.
*Why this call:* localized slugs outperform identical-slug-across-locales for Croatian-language search intent, and Astro's i18n routing makes the 1:1 mapping (required for the language switcher, I18N-002) equally easy either way, so there's no cost to taking the better-for-SEO option.
*Revisit if:* the owner has an existing brand reason to want identical slugs across locales (none surfaced in the audit).

---

## DESIGN-001 — token implementation deviations from the audit doc's literal spec

**Tailwind v4 CSS-first theming instead of `tailwind.config.mjs`.** The roadmap's file list assumes a Tailwind JS config file; Tailwind CSS v4 (installed via `astro add tailwind`, current stable) replaced that with an `@theme` block directly in CSS. `src/styles/tokens.css` defines the runtime dark/light custom properties and maps them into Tailwind's theme namespace there — functionally identical outcome (Tailwind utilities and raw CSS both read from the same tokens), just no `tailwind.config.mjs` file exists because the current version of the tool doesn't have one.
*Why this call:* the roadmap's intent ("Wire Tailwind's theme to reference the CSS custom properties so both raw CSS and Tailwind utility classes stay in sync") is better served by v4's native CSS-first approach than by fighting it into a v3-style JS config on a brand-new project.

**Light-mode `muted` text color corrected from the audit's spec.** The audit doc lists a single `#9A9A9F` muted-text value for both dark and light mode. Measured contrast: `#9A9A9F` on the light-mode background (`#FAFAF9`) is **2.68:1** — fails WCAG AA (needs 4.5:1 for normal-size text). Confirmed via axe-core against the `/design-tokens` preview route. Changed the light-mode value to `#6B6B70` (5.07:1 against `#FAFAF9`, 5.30:1 against white surface) — same visual role (secondary/caption text), passes AA. Dark mode keeps the audit's original `#9A9A9F` (6.42–6.95:1, already well within AA).
*Why this call:* A11Y-001's zero-critical/serious-violations target and the general WCAG 2.1 AA hard minimum in the audit doc (Section 8) override a specific hex value when the two conflict — this was caught at the token level specifically so no later component inherits a failing color pair.

---

## DESIGN-002 — text-safe color variants added

Verified via axe-core against `/components` in both themes: the audit's raw `primary`/`success`/`warning`/`error`/`accent` hex values are fine as backgrounds, borders, and large graphics, but several fail WCAG AA as small text against their expected surfaces (`primary` #3B5BFF on dark backgrounds: 3.5–3.8:1; the semantic colors as badge text on their own 15%-tint light-mode backgrounds: 1.4–2.0:1). Added theme-aware `-text`/`-fg` token variants (`--color-primary-text`, `--color-success-fg`, `--color-warning-fg`, `--color-error-fg`, `--color-accent-fg`) used specifically for text-on-tinted-surface cases (Badge component, SectionHeading eyebrow); the original vivid values stay unchanged for backgrounds/borders/large graphics where they already pass. All combinations re-verified at 4.5:1+ against the actual rendered composite backgrounds, not just against plain white/black.
*Why this call:* same reasoning as the DESIGN-001 muted-color fix — A11Y's zero-critical/serious target overrides a literal hex value from the audit when the two conflict, caught at the component level before any real page consumes these colors.

---

## ARCH-003 — contact form backend: email delivery deliberately deferred

Cloudflare Email Sending requires the `from` domain to be onboarded, which adds DKIM/verification DNS records to that domain's live zone. Since `bigbrain-solutions.com`'s DNS is explicitly off-limits until `DEPLOY-001`, `functions/api/contact.ts` implements validation, Turnstile bot verification, and the email payload construction, but only actually calls `env.EMAIL.send()` when `CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL` are configured — until then submissions are accepted (still going through full validation + Turnstile checks) and logged, not emailed. Also, Cloudflare Pages Functions (as opposed to plain Workers) don't support the `send_email` or `ratelimits` keys in `wrangler.jsonc` in the currently installed Wrangler version — those bindings, if used, need to be added via the Cloudflare Pages dashboard's Functions/bindings settings instead, at the same time the domain is onboarded. The rate-limit check in the function code already fails open (allows the request) if the binding isn't present, so nothing breaks in the meantime.

A **Turnstile widget was created** (via `wrangler turnstile widget create`, safe — it's an API-side resource, not a DNS change) covering `bigbrainsolutions-web.pages.dev`, `bigbrain-solutions.com`, `www.bigbrain-solutions.com`, and `localhost`. The secret key is stored as a Cloudflare Pages secret (`TURNSTILE_SECRET_KEY`, production environment), never committed to the repo; the site key is public and lives in the component prop.

*Why this call:* respects the explicit "no production DNS changes before DEPLOY-001" boundary literally (email domain verification is a DNS change) while still shipping a fully-functional, testable form today. *Revisit at:* `DEPLOY-001`, or sooner if the owner explicitly approves adding the email DNS records early.

---

## HOME-001 / CONTENT-003 / PAGE-004 — real content, and a few slug/URL calls

**Testimonials are real, not invented.** All 5 testimonials on the homepage (Mario Cvinar, John Walkden/Ubique Safety Consultants, Siniša Kalinić, Marina Franić, Leo Raguž) were extracted from the live production site via Playwright and translated naturally into Croatian for that locale — never fabricated. Fabricating customer testimonials attributed to real names would be dishonest regardless of "premium" framing.

**HomeStock URL slug: `/homestock/` (hr) and `/en/homestock/` (en)**, not `/products/homestock/` as the roadmap's literal file-path example suggested. "HomeStock" is a proper product name, not translated (same treatment as leaving "Big Brain Solutions" untranslated) — a bare `/homestock/` is cleaner than adding an English "products" segment onto an otherwise-Croatian URL.
*Revisit if:* the owner wants a `/proizvodi/` (products) section for future additional products.

**HomeStock privacy policy keeps its exact original slug for English** (`/en/homestock-privacy-policy/` — same path as the live site's `/homestock-privacy-policy/`, just relocated under the `/en/` locale prefix). This is almost certainly the URL registered as HomeStock's privacy policy link in App Store Connect / Google Play Console. Croatian gets a natural translated slug (`/privatnost-homestock/`) since there's no compliance reason to keep it in English there.
*Action needed at `DEPLOY-001`:* the owner should update the App Store Connect / Play Console privacy policy URL to `https://www.bigbrain-solutions.com/en/homestock-privacy-policy/` if it currently points to the bare (no `/en/`) path — flagging now so it isn't missed at cutover.

**No App Store link exists for HomeStock yet.** The roadmap's CONTENT-003 explicitly allows shipping without one ("falls back to icon + description only if screenshots aren't provided, but must still ship at top notch polish either way") — applied the same logic to the link itself: a "Coming soon" badge instead of a fabricated or placeholder App Store URL, since a fake link on a real business site is worse than no link.

---

## BRAND-001 — final logo integrated, supersedes earlier placeholder branding

Final logo (brain + circuit mark, Canva concept 3) is now the real brand asset across the site: `src/assets/logo-full.png` (full lockup, header desktop/tablet), `src/assets/logo-icon.png` (icon-only, mobile header + PWA/favicon source), `src/assets/og/og-default.png` (1200×630 OG/social card), and derived `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icons/icon-{192,512}.png`, `public/site.webmanifest`. This supersedes whatever placeholder/default branding existed before this task (the repo's only prior icon asset was Astro's own default rocket-logo favicon.ico/favicon.svg from the initial scaffold — removed now that a real brand asset exists).

**Both Canva exports arrived fully opaque, not actually transparent.** Verified by sampling raw pixel data: every background pixel had alpha=255 with a uniform fill around RGB(24,38,45) — not the "already transparent, no chroma-keying needed" the brief assumed. Rather than either (a) shipping opaque dark rectangles behind the logo everywhere, or (b) silently guessing at a fix, ran a distance-threshold color-key with edge despill (`scripts/process-logo-assets.mjs`) and verified the result visually on both light and dark composites before using it anywhere — zero visible fringing/halo on the linework or the green accent dots, background is genuinely uniform enough that this worked cleanly. Both master assets (`logo-full.png`, `logo-icon.png`) are now true alpha-transparent PNGs.

**Real, unresolved issue: the mark has poor-to-unusable contrast on light backgrounds.** This is not a chroma-key artifact — confirmed by screenshotting the actual live header in both themes at both breakpoints (`astro preview` + Playwright). In dark mode (desktop and mobile) it looks clean and sharp. In light mode: the wordmark ("Big Brain Solutions") is cream-on-near-white and essentially unreadable; even the icon-only mark (which has a thin edge outline the wordmark lacks) is noticeably washed out. This is a legitimate brand-asset limitation — the mark was evidently designed against a dark surface — not something to patch by auto-recoloring a raster asset (that's a brand decision, not an engineering one, and a naive recolor of multi-tone line art risks looking wrong/unapproved). **Flagging for a decision rather than guessing:** either (a) get a light-mode variant of the lockup from Canva/the designer, or (b) accept dark-mode-only branding and reconsider whether the manual light/dark toggle should stay in the header at all, or (c) something else the owner prefers. Header wiring itself is otherwise complete and works correctly in both themes at both breakpoints — this is purely an asset-contrast gap, not a code defect.

*Why proceed rather than block:* the roadmap's own instruction for this exact class of finding is "confirm contrast... flag it if weak rather than guessing a fix" — implemented literally as asked (logo-full.png in the header, logo-icon.png for mobile/compact), verified the result is clean where it works, and surfaced the one place it doesn't rather than shipping it silently or inventing an unauthorized brand variation.

---

## INFRA-001 — www→apex redirect fix: blocked, not just deferred

Asked to fix the DISCOVERY-001 redirect-hop finding at the Cloudflare edge (Redirect Rule/Page Rule) rather than in application code. **Checked first, rather than attempting it: the active Cloudflare API token only has `zone:read` scope** (confirmed via `wrangler whoami` and the token's stored scope list in `.wrangler/config/default.toml` — no `zone:edit`, no page-rules/redirect-rules write permission anywhere in the granted scopes). This isn't a judgment call to make carefully; it's a hard permission wall — the token cannot create or modify zone-level rules on `bigbrain-solutions.com` regardless of intent, so no attempt was made against production.

**Exact fix to apply, for whoever has zone-edit access** (Cloudflare dashboard → `bigbrain-solutions.com` → Rules → Redirect Rules → Create rule):
- **When incoming requests match:** Hostname equals `www.bigbrain-solutions.com`
- **Then:** Dynamic redirect, target URL expression `concat("https://bigbrain-solutions.com", http.request.uri.path)`, status code 301, "Preserve query string" enabled
- This moves the host redirect from WordPress's application layer (confirmed via the `X-Redirect-By: WordPress` response header seen in DISCOVERY-001) to Cloudflare's edge, so `www` requests never round-trip to the PHP origin just to get redirected — the fix the ~800ms Lighthouse "avoid multiple redirects" finding is asking for.
- Low-risk, fully reversible (delete the rule), doesn't touch DNS records or WordPress, doesn't change the final destination — only removes the origin round-trip currently needed to produce the same redirect.

*Why not skip silently or work around it:* a wrong guess here touches the live production domain, and reporting "done" when it wasn't would be worse than reporting the exact blocker and the exact fix needed.

---

## CONTENT-002 — Ubique Safety Consultants case study: real but intentionally thin

Built at `/studije-slucaja/ubique-safety-consultants/` (hr) and `/en/case-studies/ubique-safety-consultants/` (en), linked from the homepage case-study card (previously pointed at Contact as a placeholder) and from a new callout on the Services page's dev track.

**Content is limited to what's actually verifiable:** the real testimonial (John Walkden, Managing Director, Ubique Safety Consultants) and the fact of a three-year engagement — both already public on the live site. The original roadmap's CONTENT-002 template (challenge → approach/stack → outcome) needs specifics — what was actually built, what stack, what measurable outcome — that only the owner or the client can confirm, and the roadmap itself says explicitly not to fabricate scope details beyond what's verifiable. Rather than inventing a stack or feature list to fill out that template, the page is honest about being narrower than a full case study for now, with a visible note saying so, and reframes around what's genuinely demonstrable (a long client relationship) rather than invented specifics.
*Revisit if:* the owner (or Ubique, if willing) can provide real project details — dropping them in transforms this from a testimonial-plus-context page into the full challenge/approach/outcome case study the roadmap originally specified.

---

## Pricing placeholders (flagged in advance for PAGE-001)

The roadmap explicitly punts exact pricing figures to the owner (`{{PRICE_X}}` placeholder tokens). Decision: rather than shipping visible `{{PRICE_X}}` placeholder tokens to a preview URL stakeholders might see, PAGE-001 will use realistic, clearly-labeled **directional placeholder pricing** (e.g. "Computer repair — from €35", "Custom web application — from €1,500, custom quote") based on typical Croatian/Dubrovnik-market rates for the service tracks described in the audit, marked in `docs/content-review-checklist.md` as owner-confirm-required before `DEPLOY-001`. This keeps the preview looking finished ("top notch, no shortcuts") rather than visibly unfinished, while making unmistakably clear in the review checklist that every figure is a placeholder pending the owner's real pricing.
*Why this call:* the owner asked for premium-appropriate judgment calls rather than visible TODOs, and a page full of `{{PRICE_X}}` tokens reads as unfinished to anyone previewing the site before the owner has reviewed it.
*Revisit if:* the owner has firm pricing ready sooner — trivial find/replace against the checklist.

**Figures used (PAGE-001, both locales):** Computer Repair & Installation from €35 · Virus & Malware Removal from €30 · Network Setup & Support from €45 · Hardware Services from €25 · Software Services from €20 · Website Design & Development from €800 · Web Application Development: custom quote (too variable in scope for a "from" figure to be honest). All of these are directional estimates for the Dubrovnik market, not researched competitor pricing — every figure needs the owner's real sign-off before `DEPLOY-001`.
