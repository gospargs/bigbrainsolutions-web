# Deployment

## Cloudflare Pages project

**Project name:** `bigbrainsolutions-web`
**Production branch:** `main`
**Preview URL:** https://bigbrainsolutions-web.pages.dev
**Custom domains:** `bigbrain-solutions.com`, `www.bigbrain-solutions.com`

Created via `wrangler pages project create bigbrainsolutions-web --production-branch main`, first deploy via `wrangler pages deploy dist --project-name bigbrainsolutions-web --branch main`. Build command: `npm run build`, output directory: `dist/`.

## Deploys

The project is connected to GitHub, so pushing to `main` deploys to production.

## Secrets and bindings on the Pages project

- `TURNSTILE_SECRET_KEY` — set as a Pages secret (production environment) via `wrangler pages secret put`. Not in the repo.
- `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` — **not yet set**. Setting these activates real email delivery from `functions/api/contact.ts`; intentionally left unset until the `bigbrain-solutions.com` domain is onboarded to Cloudflare Email Sending (a DNS change, deferred to `DEPLOY-001` — see `docs/decisions.md`).
- `EMAIL` (send_email binding) — not bound. Cloudflare's Pages Functions bindings docs don't list `send_email`, so delivery needs a decision first — see SECURITY-001 in `docs/decisions.md`. Until then the function answers real submissions with a 503 and the form shows its "call us" error.
- `CONTACT_RATE_KV` — KV namespace declared in `wrangler.jsonc`, backs the 3-per-IP-per-10-minutes limit in the function.
- `TURNSTILE_SECRET_KEY` is production-only and verification fails closed, so the form rejects every submission on preview deployments and local dev unless a secret is supplied there.
