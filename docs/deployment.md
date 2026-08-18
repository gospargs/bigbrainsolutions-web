# Deployment

## Cloudflare Pages project

**Project name:** `bigbrainsolutions-web`
**Production branch:** `main`
**Preview URL:** https://bigbrainsolutions-web.pages.dev
**Custom domain:** not attached — production DNS stays untouched until `DEPLOY-001`.

Created via `wrangler pages project create bigbrainsolutions-web --production-branch main`, first deploy via `wrangler pages deploy dist --project-name bigbrainsolutions-web --branch main`. Build command: `npm run build`, output directory: `dist/`.

## Manual step still required (cannot be automated from here)

Wrangler can create the Pages project and push manual deploys, but connecting it to this GitHub repo for **automatic deploy-on-push** requires authorizing Cloudflare's GitHub App against `gospargs/bigbrainsolutions-web` — that's an interactive OAuth consent step only the account owner can grant, done once in the Cloudflare dashboard:

1. Cloudflare dashboard → **Workers & Pages** → `bigbrainsolutions-web` → **Settings** → **Builds & deployments** → **Connect to Git**.
2. Authorize the Cloudflare Pages GitHub App for this repo (or confirm it already has access if "All repositories" was granted previously).
3. Select `main` as the production branch, build command `npm run build`, build output directory `dist`.

Until that's done, every commit needs a manual `npx wrangler pages deploy dist --project-name bigbrainsolutions-web --branch main` to update the preview — which is exactly what's happening for now so the preview URL stays current with each Task ID's commit.
