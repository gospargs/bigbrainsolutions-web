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

## Pricing placeholders (flagged in advance for PAGE-001)

The roadmap explicitly punts exact pricing figures to the owner (`{{PRICE_X}}` placeholder tokens). Decision: rather than shipping visible `{{PRICE_X}}` placeholder tokens to a preview URL stakeholders might see, PAGE-001 will use realistic, clearly-labeled **directional placeholder pricing** (e.g. "Computer repair — from €35", "Custom web application — from €1,500, custom quote") based on typical Croatian/Dubrovnik-market rates for the service tracks described in the audit, marked in `docs/content-review-checklist.md` as owner-confirm-required before `DEPLOY-001`. This keeps the preview looking finished ("top notch, no shortcuts") rather than visibly unfinished, while making unmistakably clear in the review checklist that every figure is a placeholder pending the owner's real pricing.
*Why this call:* the owner asked for premium-appropriate judgment calls rather than visible TODOs, and a page full of `{{PRICE_X}}` tokens reads as unfinished to anyone previewing the site before the owner has reviewed it.
*Revisit if:* the owner has firm pricing ready sooner — trivial find/replace against the checklist.
