# Deployment

## Cloudflare Pages project

**Project name:** `bigbrainsolutions-web`
**Production branch:** `main`
**Preview URL:** https://bigbrainsolutions-web.pages.dev
**Custom domains:** `bigbrain-solutions.com`, `www.bigbrain-solutions.com`

Created via `wrangler pages project create bigbrainsolutions-web --production-branch main`, first deploy via `wrangler pages deploy dist --project-name bigbrainsolutions-web --branch main`. Build command: `npm run build`, output directory: `dist/`.

## Deploys

The project is connected to GitHub, so pushing to `main` deploys to production.

The `contact-mailer` Worker (`workers/contact-mailer/`) is **not** deployed by that push. After changing it, run `npx wrangler deploy` from its folder.

## Secrets and bindings on the Pages project

- `TURNSTILE_SECRET_KEY` — set as a Pages secret (production environment) via `wrangler pages secret put`. Not in the repo.
- `MAILER` — service binding to the `contact-mailer` Worker, which sends form submissions. Declared in `wrangler.jsonc`.
- `CONTACT_RATE_KV` — KV namespace declared in `wrangler.jsonc`, backs the 3-per-IP-per-10-minutes limit in the function.
- `TURNSTILE_SECRET_KEY` is production-only and verification fails closed, so the form rejects every submission on preview deployments and local dev unless a secret is supplied there.
