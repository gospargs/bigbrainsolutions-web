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

## BUGFIX-005 — header logo/height and favicon: three real, distinct bugs, all verified with real screenshots

**Header height token, now formally documented: `--header-height: 4.5rem` (72px).** Set as an explicit `min-height` on `.bb-header__inner`, independent of whatever logo asset renders inside it. Verified stable at 73px (72px content + 1px border) across every theme/breakpoint/locale combination tested.

**Problem 1 root cause (logo rendering as a distorted square):** two compounding bugs, not one.
1. `src/assets/logo-full.png` had never actually been cropped to its content — it was still the full untouched 2000×2000 Canva canvas (mostly transparent padding around the real ~2.27:1 icon+wordmark lockup). Its intrinsic aspect ratio was 1:1, so any height constraint produced a square.
2. Astro's `<Image>` was called with `sizes="248px"` — per the HTML responsive-images spec, an explicit fixed `sizes` value **is** a layout-affecting hint, not just a source-selection hint, so it overrode the `width: auto` CSS rather than being overridden by it. That's why the rendered box was 248×248 instead of respecting either the source aspect ratio or the CSS.

Fixed both: cropped `logo-full.png` to its real content bounding box (verified: now 1413×622px, 2.27:1 — screenshotted and visually confirmed), and dropped the `sizes`/`widths` responsive complexity entirely (a header logo doesn't need it). `.bb-header__logo-full .bb-logo-render` now sets `height: 32px; width: auto; object-fit: contain` and actually renders at the correct proportional width (measured: 72.7×32px) in every test.

**Problem 2 root cause (header appearing white with an invisible logo): not a CSS regression.** Traced it directly: `--bg` was resolving to the light value (`#fafaf9`) because the browser's `prefers-color-scheme` was `light` — which is exactly the intentional, deliberately-built light-theme behavior from `DESIGN-001` (confirmed: there's a real, working manual dark/light toggle in the codebase, so this is the "intentional light state" the bug report asked me to check for before touching the background). The actual bug was the *unresolved* half of what `BRAND-001` already flagged and left open: the logo has no legible variant for light backgrounds. Per the bug report's own instruction ("do not create a second dark-colored logo variant... unless you find clear evidence of an intentional light state" — which I did find), the fix is **not** forcing the header dark. Implemented the `BUGFIX-007` CSS-mask technique instead: the colorful original renders in dark theme (default + explicit `data-theme="dark"`); a `background-color: var(--color-foreground)` element masked by the same PNG's alpha channel renders in light theme (`prefers-color-scheme: light` + explicit `data-theme="light"`), for both the full lockup and the mobile icon. `--color-foreground` already flips correctly per theme, so one masked element handles both directions with no extra assets. (Hit a second-order bug while building this: an empty `<span>` has no intrinsic size for `width: auto` to resolve against, unlike an `<img>`, which silently collapsed the masked full-lockup to `width: 0` — fixed with an explicit `aspect-ratio: 1413 / 622` on that element.)

**Problem 3 (favicon/PWA icons showing as light-on-nothing): confirmed real, not re-litigated from the old commit message.** Checked actual pixel data before doing anything, per the bug report's instruction: `apple-touch-icon.png` was already correctly opaque (`rgb(11,13,16)` at all corners, alpha channel absent) — that one was fine. But `favicon.ico` (all three embedded BMP sizes, checked by hand-parsing the ICO/BMP byte structure since PNG tools don't read it), `icon-192.png`, and `icon-512.png` all had `alpha: 0` at every corner — genuinely transparent, exactly the bug described. Regenerated all three with the dark background token (`#0B0D10`) flattened in via `sharp().flatten()`, re-verified via raw pixel sampling (now `[11, 13, 16, 255]` everywhere), and confirmed visually in an actual browser tab (see below) — not just the file in isolation.

**Verification method for all three, matching what was asked:** real Playwright screenshots across a theme × breakpoint × locale matrix (dark/light via `colorScheme` context option × desktop/mobile × hr/en), plus — since Playwright screenshots can't show OS browser chrome — a real headed Chromium window captured via the Win32 `PrintWindow` API (not `SetForegroundWindow`, which Windows blocks for background automation) to get the literal browser tab with the favicon visible against real tab-bar chrome. All screenshots showed correct results before this was committed.

The roadmap explicitly punts exact pricing figures to the owner (`{{PRICE_X}}` placeholder tokens). Decision: rather than shipping visible `{{PRICE_X}}` placeholder tokens to a preview URL stakeholders might see, PAGE-001 will use realistic, clearly-labeled **directional placeholder pricing** (e.g. "Computer repair — from €35", "Custom web application — from €1,500, custom quote") based on typical Croatian/Dubrovnik-market rates for the service tracks described in the audit, marked in `docs/content-review-checklist.md` as owner-confirm-required before `DEPLOY-001`. This keeps the preview looking finished ("top notch, no shortcuts") rather than visibly unfinished, while making unmistakably clear in the review checklist that every figure is a placeholder pending the owner's real pricing.
*Why this call:* the owner asked for premium-appropriate judgment calls rather than visible TODOs, and a page full of `{{PRICE_X}}` tokens reads as unfinished to anyone previewing the site before the owner has reviewed it.
*Revisit if:* the owner has firm pricing ready sooner — trivial find/replace against the checklist.

**Figures used (PAGE-001, both locales):** Computer Repair & Installation from €35 · Virus & Malware Removal from €30 · Network Setup & Support from €45 · Hardware Services from €25 · Software Services from €20 · Website Design & Development from €500 (lowered from an initial €800 estimate per `CONTENT-004`, owner-directed) · Web Application Development: custom quote (too variable in scope for a "from" figure to be honest). All of these are directional estimates for the Dubrovnik market, not researched competitor pricing — every figure needs the owner's real sign-off before `DEPLOY-001`.

---

## BUGFIX-006 — digital rain: ruled out stale deployment first, then a decisive jump

Checked deployment freshness before touching the opacity again, as instructed: fetched the live site's HTML directly and confirmed `globalAlpha=.12` (the exact value from the prior commit) was actually being served, with `Cache-Control: public, max-age=0, must-revalidate` on the response — no caching layer was hiding a stale build. The 12% value genuinely just wasn't enough on a real screen; two small nudges (6%→12%) weren't converging, so per the bug report's instruction this was a decisive jump, not another increment: 12%→22% opacity, and swapped the character color from the muted-text token to the accent token (mint, `#00E5A0`) for more presence. Density and fall speed untouched.

Verified against the actual acceptance bar ("noticeable within 2-3 seconds without deliberately searching, still restrained") using a fresh, isolated Playwright context per check (no carried-over cache/state, matching incognito conditions) and screenshotting at ~2.5s post-load rather than after a longer settle time, so the test matches a real first-glance rather than a generous inspection window. Confirmed on both locales: individual green digits are now clearly noticeable at a glance without competing with the hero heading.

## BUGFIX-007 — logo dark-recolor via CSS mask (implemented as part of BUGFIX-005)

The CSS-mask technique for deriving a dark-colored logo from the single light-colored source asset (no second Canva export needed, ever) was implemented directly as the fix for `BUGFIX-005` Problem 2 — see that entry above for the full implementation (`background-color: var(--color-foreground)` masked by each PNG's alpha channel, swapped in for light-theme contexts only). Applied to exactly the two contexts that needed it (header full lockup + mobile icon, both light-theme states) and nowhere else, per the instruction to check what's actually needed before adding it in more places. The favicon files stay fixed the static-raster way (opaque background baked into the file, not CSS) since masking doesn't apply there. No dark wordmark variant was built, since there's no current use case for the wordmark on a light background beyond what the mask already covers.

---

## BUGFIX-008 — logo size increased within the fixed 72px header

Pushed the logo from 32px to 52px tall (up from a `72.6875 x 32` measured box to `118.125 x 52`, a genuine +62.5% size jump), using the vertical room the 72px header already had (`.bb-header__inner` has no vertical padding, only `align-items: center`, so 20px of breathing room remains -- ~10px top/bottom). Header height itself measured unchanged at 73px (72px content + 1px border) across every breakpoint/theme/locale tested -- confirmed via `getBoundingClientRect()`, not just visually. Checked for nav collision specifically at the 1024px breakpoint boundary (narrowest width where the full lockup + nav both show) and at 375px mobile (icon + lang pill + hamburger) -- no overlap in either case.

**Real limitation, flagged rather than worked around:** "bolder" via heavier stroke weight isn't achievable here. The icon is a flattened raster export from Canva (already established when building `BRAND-001`/`BUGFIX-007`), not an editable vector, so CSS can change its size and position but not redraw its stroke width. Size is the only lever available through code; a genuinely heavier-stroke mark would need a new Canva generation pass, not a follow-up bug report to me.

## BUGFIX-009 — digital rain: theme-aware color, moved to a shared layout-level top band

Moved `<DigitalRain />` from being mounted per-page inside `.bb-hero` (homepage only, in `src/pages/index.astro` and `en/index.astro`) to a single mount in `src/layouts/BaseLayout.astro`, so it now appears on every page automatically, including ones with no hero section of their own (verified on the Privacy Policy page, which has none). Confined to a fixed `31.25rem` (500px) top band via `position: absolute; top: 0` -- not `position: fixed`, so it scrolls away naturally with the page instead of stretching down the whole document or staying pinned during scroll. Verified via `getBoundingClientRect()` that the band height stays exactly 500px regardless of how long the underlying page is.

**Theme detection reuses the exact same logic as the logo's CSS-mask swap (`BUGFIX-007`)** -- `data-theme` attribute first, `prefers-color-scheme` as fallback -- implemented once as a small helper and called each frame, not a second/separate detection mechanism. Dark theme keeps the `BUGFIX-006` tuning (accent mint, 22%). Light theme switches to the `--color-muted` token (which already resolves to its own correct light-mode value, `#6B6B70`, via the existing token system -- no new color needed) at a separately-tuned 16%, verified visually rather than assumed to be the same number, since gray-on-white and mint-on-near-black have different contrast math.

**Performance note, addressed by the implementation rather than needing a follow-up:** the canvas is a fixed 500px band regardless of page length, and the animation loop doesn't hook into scroll at all (no scroll listeners, same capped-15fps `requestAnimationFrame` loop as before) -- so extending it sitewide doesn't scale with page length or introduce any new scroll-driven work. Nothing to flag here.

---

## POLISH-001 — digital rain: light-theme color darkened one more notch

`--color-muted` (#6B6B70) at 16% still read as too washed-out on a fresh look, per direct feedback. Moved to `--color-foreground` (the site's actual light-mode body-text color, #111114 -- already theme-aware via the existing token system, no new value needed) at 20% opacity -- both the color and the opacity moved together rather than just pushing opacity further on a lighter base color. Dark-theme value (accent mint, 22%) left untouched, confirmed via pixel sampling still exactly 22% after this change. Verified visually across 4 pages (including the Privacy Policy page, which has no hero section) and both locales: clearly darker/more present at a fresh glance, headings unaffected.

---

## DEPLOY-001 — production cutover prep: domain, redirects, sitemap/robots

Code-only prep, no DNS/dashboard changes made (per explicit instruction) -- this is committed and ready, waiting on the owner to confirm before anything points the live domain at Cloudflare Pages.

**Domain: `site` in `astro.config.mjs` changed to `https://bigbrain-solutions.com`** (apex, no www) -- was `https://www.bigbrain-solutions.com` since `ARCH-001`. This matches `INFRA-001`'s finding exactly (the live WordPress site's actual canonical destination is the non-www apex; `www` redirects to it, not the reverse), so no conflict with earlier decisions, just now made consistent everywhere. Every canonical/OG/sitemap URL site-wide is generated from this single `Astro.site` value (verified: zero hardcoded domain strings anywhere in `src/`), so this one change propagates correctly everywhere.

**`public/_redirects` created** with the 4 mappings for the WordPress site's real indexed URLs (confirmed via its own sitemap in `DISCOVERY-001`): `/contact/`, `/about/`, `/services/`, `/homestock-privacy-policy/` → their new slugs, all 301. Root `/` needs no entry. Verified all 4 redirect targets resolve 200 on a local build.

**Sitemap and robots.txt didn't exist at all before this task** (the roadmap's `I18N-001`/`SEO-002` were never reached earlier in the build) -- added `@astrojs/sitemap` and a `public/robots.txt` referencing it, since `DEPLOY-001` explicitly needs them correct and a production cutover with no sitemap would be a real gap regardless. Building this sitemap for the first time surfaced two real defects, fixed before committing rather than shipped:
1. **Internal QA-only routes were leaking into the sitemap** -- `/components/` and `/design-tokens/` (both already `noindex, nofollow`) were appearing as indexable URLs. Excluded via the integration's `filter` option.
2. **Automatic hreflang pairing silently failed for every localized-slug page.** `@astrojs/sitemap`'s built-in `i18n` option pairs hr/en URLs by matching identical path suffixes -- that only works for the two pages that happen to share a slug across locales (`/` ↔ `/en/`, `/homestock/` ↔ `/en/homestock/`). Every other page uses a deliberately localized Croatian slug (`/usluge/` vs `/en/services/`, etc. -- see `DISCOVERY-002c`), so 5 of 7 page pairs got zero hreflang links with the automatic option. Replaced with an explicit `serialize()` lookup table pairing all 7 known hr/en slug pairs plus `x-default`, verified in the built `sitemap-0.xml`: all 14 URLs now carry correct alternate links.

**Verification performed exactly as asked:** full production build, `grep -rn "pages\.dev" dist/` → zero matches (also checked `www.bigbrain-solutions` → zero matches), manually inspected `sitemap-0.xml` and a page's `<head>` (canonical + all `og:*` tags confirmed on the apex domain, no `www`, no `pages.dev`).

**Known remaining gap, not in this task's scope:** per-page `<link rel="alternate" hreflang="...">` tags in each page's own `<head>` (as opposed to the sitemap's `xhtml:link` entries, which are done) are still missing -- that's the rest of the roadmap's `I18N-001`, not something `DEPLOY-001`'s acceptance criteria asked for. Flagging so it isn't mistaken for finished.

---

## BUGFIX-010(1) / POLISH-002 — digital rain: mobile re-enabled, full-viewport height, performance verified

Mobile was deliberately disabled at launch for battery/performance reasons. Owner has since seen the live site on a real phone and wants it there too -- overrides that earlier constraint. Re-enabled (removed the `isMobile` gate from both CSS and JS, kept `prefers-reduced-motion` gating fully intact) and, per the same-message follow-up (`POLISH-002`), sized to fill the full visible viewport height on mobile (`100dvh`, with a `100vh` fallback for older browsers) instead of the fixed desktop band -- desktop keeps its existing 500px band unchanged. Positioned with `position: absolute`, not `fixed`, so it scrolls away normally with the page after the first screen rather than staying pinned or covering the full length of long pages.

**Performance verified with real numbers, not assumption**, as both tasks explicitly required: ran Lighthouse mobile (4x CPU throttling, simulated network) against the homepage twice -- once with the effect mounted, once with the mount temporarily replaced by `{false && <DigitalRain />}` to get a genuine apples-to-apples baseline, then restored.

| | Performance score | LCP | CLS | TBT | Main-thread work |
|---|---|---|---|---|---|
| Effect ON | 90 | 3.0s | 0.002 | 0ms | 0.9s |
| Effect OFF | 90 | 3.0s | 0.003 | 0ms | 0.4s |

**Score is identical (90 vs 90); every Core Web Vital is unchanged.** Main-thread work roughly doubles (0.4s → 0.9s, attributable to the canvas animation loop), but stays far short of anything that shows up in TBT (0ms in both runs) or the overall score. Given this measured result, no separate lightweight mobile variant (fewer columns, lower fps cap) was built -- the existing implementation already performs fine once un-gated, and adding complexity to solve a problem the data says doesn't exist would be the over-engineering the task explicitly warned against. Column density already scales down naturally on mobile too (column count is `floor(width / 42px)`, so a 390px-wide phone gets ~9 columns vs desktop's ~34 at 1440px) -- part of why this stayed cheap.

Verified visually on real mobile viewports (390×844) in both themes and both locales: canvas height matches the full viewport height exactly, correct color per theme, `prefers-reduced-motion` still fully disables it.

## BUGFIX-010(2) — full contrast audit of the live production domain: zero violations found

Ran an automated WCAG AA contrast scan (axe-core, the same tool used throughout this project) against **the live production domain** (`www.bigbrain-solutions.com`, not the `.pages.dev` preview) across all 14 pages, both locales, both light and dark theme (28 page/theme combinations total) -- **zero violations found.**

This doesn't mean nothing was worth checking manually, so here's what was specifically looked at beyond the automated pass, per the request to check button/link states, form fields, and icons, not just body text:
- **Hover/focus/visited link and button states** -- checked the actual CSS: focus uses the global `:focus-visible` outline (`2px solid var(--color-primary)`) established at the token level in `DESIGN-001`, applied uniformly with no per-component overrides that could regress it; hover states use border/color tokens already verified for contrast in `DESIGN-002`; no `:visited` styling exists (intentional -- the site has no content where visited-vs-unvisited state carries meaning, e.g. no blog/article index).
- **Form field borders and placeholder text** -- `ContactForm.astro`'s inputs use `border border-border` (the border token, not a contrast-dependent element) and rely on the browser's native placeholder styling rather than a custom low-contrast placeholder color, so there's no custom placeholder-contrast risk introduced.
- **Icons** -- the logo mark's own light/dark contrast was already resolved in `BRAND-001`/`BUGFIX-005`/`BUGFIX-007`; no other custom icons exist on the site (the mobile menu toggle uses a plain "☰" text character sized via `font-size`, not an SVG needing separate contrast treatment).

**Direct answer to "does it need any color anywhere?": no.** Nothing found reading as invisible or near-invisible against its background on the real production domain, in either theme, on any page.

## BUGFIX-010(3) — Contact page horizontal scroll on mobile: two real, distinct causes

Found via direct measurement (`document.documentElement.scrollWidth` vs `window.innerWidth`), not guessing at a CSS fix -- traced down through the DOM tree to isolate the actual overflowing element at each breakpoint rather than reaching for `overflow-x: hidden` on a parent, which the task correctly flagged as hiding the symptom rather than fixing the layout bug.

**Cause 1 (375px and up): classic CSS Grid `min-width: auto` overflow.** `.bb-contact-grid`'s two children (`.bb-contact-info`, `.bb-contact-form`) share a single `1fr` column track in the mobile single-column layout. Grid items default to `min-width: auto`, meaning a track won't shrink below its widest participant's *min-content* size -- and the service `<select>`'s longest option text ("Uklanjanje virusa i zlonamjernog softvera") was contributing a min-content width wider than the viewport, forcing the whole shared column (and everything in it, including short text like "Adresa") 15-70px past the edge. Fixed with `min-width: 0` on both grid items -- the standard, correct fix for this exact category of bug, not a workaround.

**Cause 2 (320px specifically, survived the fix above): Cloudflare's own Turnstile widget has a fixed ~300px minimum render width.** At the narrowest tested width, available space inside the form (206px) was well under Turnstile's default "normal" size, which doesn't shrink to fit. This is third-party embedded content, not something adjustable via CSS on our side -- fixed via Turnstile's own official `data-size="compact"` attribute (~150px), which comfortably fits down to 320px and is a legitimate, supported sizing option rather than a hack.

Verified 0px overflow at 320px, 375px, and 414px, on both `/kontakt/` and `/en/contact/`, with the Turnstile widget fully rendered (not just before it loaded). Screenshot at 375px confirms a clean fit with no horizontal scroll.

---

## CONTENT-004 — Website Design starting price lowered €800 → €500

Grepped for "800" across all content files first to find every echo of the old figure, not just the obvious one: found exactly 2 live references (`src/pages/usluge.astro` and `src/pages/en/services.astro`, both the "Izrada web stranica" / "Website Design & Development" entry) plus 2 documentation references (`docs/decisions.md`'s own pricing-figures list, `docs/content-review-checklist.md`) kept in sync for consistency. No homepage echo and no structured-data/Service-schema echo exist yet (`SEO-002`, the JSON-LD task, hasn't been built in this project yet — nothing to update there). Verified 0 remaining "€800"/"800 €" references in a full production build's output, and confirmed the new "od 500 €" / "from €500" renders correctly on both locales.

## LEGAL-001 — Impressum-style footer line (legal name + OIB) added, both locales

Added `BIG BRAIN SOLUTIONS, obrt za računalno programiranje, vl. Gordan Sentić · OIB: 71865731622` (hr) / same string with `OIB (Tax ID)` (en) as a new line directly under the existing `©2026, ...` copyright line in `Footer.astro`, styled identically (same `text-caption` size, same muted color, same font) via a dedicated `.bb-footer__legal` modifier that only adjusts the top margin so the two lines sit close together as one small block rather than each getting the full 2rem gap meant for separating the block above. Applied to all 14 pages (7 hr + 7 en) via the shared `Footer` component's `labels.legalLine` prop. Verified: legal line + correct OIB present on every page, zero horizontal overflow at 320px on any tested page (same class of bug as `BUGFIX-010(3)`, checked deliberately given that history), and visually confirmed via screenshot that it reads as small/muted, not competing with the CTA or contact info above it.

**On the "should this be a dedicated Impressum page instead" question, flagged rather than silently decided:** my assessment is that the footer-only approach satisfies Croatia's e-commerce disclosure requirement (Zakon o elektroničkoj trgovini, Art. 8) as written — the law's standard is that the required information (legal name, registered address, contact details, registration number) be "easily, directly, and permanently accessible," not that it live on a specifically labeled page. Since the same footer already carries the address, email, and phone on every page, combining that with this new legal-name-plus-OIB line means all the typically-required elements are present, sitewide, permanently visible — which is a well-established compliant pattern for small Croatian businesses, not a workaround. That said, this is my read of the requirement, not legal advice, and the actual compliance stakes are real — if the owner wants certainty rather than my best judgment, a quick check with an accountant or lawyer who handles obrt registrations would be worth the cost. I did not build a separate page on the assumption that my read is correct.
