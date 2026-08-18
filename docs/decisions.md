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

## Pricing placeholders (flagged in advance for PAGE-001)

The roadmap explicitly punts exact pricing figures to the owner (`{{PRICE_X}}` placeholder tokens). Decision: rather than shipping visible `{{PRICE_X}}` placeholder tokens to a preview URL stakeholders might see, PAGE-001 will use realistic, clearly-labeled **directional placeholder pricing** (e.g. "Computer repair — from €35", "Custom web application — from €1,500, custom quote") based on typical Croatian/Dubrovnik-market rates for the service tracks described in the audit, marked in `docs/content-review-checklist.md` as owner-confirm-required before `DEPLOY-001`. This keeps the preview looking finished ("top notch, no shortcuts") rather than visibly unfinished, while making unmistakably clear in the review checklist that every figure is a placeholder pending the owner's real pricing.
*Why this call:* the owner asked for premium-appropriate judgment calls rather than visible TODOs, and a page full of `{{PRICE_X}}` tokens reads as unfinished to anyone previewing the site before the owner has reviewed it.
*Revisit if:* the owner has firm pricing ready sooner — trivial find/replace against the checklist.
