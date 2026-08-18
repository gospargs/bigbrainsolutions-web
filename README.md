# Big Brain Solutions — website rebuild

Astro + Tailwind CSS rebuild of [bigbrain-solutions.com](https://www.bigbrain-solutions.com), replacing the current WordPress + Elementor site. Deployed as static output to Cloudflare Pages.

See [`docs/BigBrainSolutionsAuditandRedesignProposal.md`](docs/BigBrainSolutionsAuditandRedesignProposal.md) for the audit and design rationale, [`docs/BigBrainSolutionsClaudeCodeRoadmap.md`](docs/BigBrainSolutionsClaudeCodeRoadmap.md) for the phased implementation plan, and [`docs/decisions.md`](docs/decisions.md) for judgment calls made along the way.

## Stack

- **Astro** (static output) with built-in i18n routing — Croatian (`/`) default, English (`/en/`) secondary
- **Tailwind CSS v4** (CSS-first `@theme` config, no `tailwind.config.js`)
- Content lives as Markdown in Astro content collections (`src/content/pages/{hr,en}/`)
- **Cloudflare Pages** for hosting, Pages Functions for the contact form backend

## Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build static output to `./dist/` |
| `npm run preview` | Preview the production build locally |

## Project status

Tracking progress against `docs/BigBrainSolutionsClaudeCodeRoadmap.md`, one commit per Task ID. Current production site is untouched until `DEPLOY-001` — everything up to that point deploys only to a Cloudflare Pages preview URL.
