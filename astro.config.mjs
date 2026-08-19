// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // DEPLOY-001: production apex domain, no www -- matches the live WordPress site's actual
  // canonical behavior (confirmed in DISCOVERY-001: www redirects to apex, not the reverse).
  site: 'https://bigbrain-solutions.com',

  i18n: {
    defaultLocale: 'hr',
    locales: ['hr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    sitemap({
      // Excludes internal QA/preview-only routes (both are meta name="robots" noindex,
      // nofollow already) from the production sitemap -- these have no business being
      // indexed or crawled as real pages.
      filter: (page) => !page.includes('/components/') && !page.includes('/design-tokens/'),
      // @astrojs/sitemap's built-in `i18n` option only pairs hr/en URLs automatically when
      // they share an identical path suffix (works for / <-> /en/ and /homestock/ <->
      // /en/homestock/, since those slugs happen to match). Every other page uses a
      // localized Croatian slug (see docs/decisions.md DISCOVERY-002c) that doesn't match
      // its English counterpart by path pattern, so hreflang pairing needs an explicit
      // lookup instead of relying on automatic detection.
      serialize(item) {
        const SITE = 'https://bigbrain-solutions.com';
        const pairs = [
          ['/', '/en/'],
          ['/usluge/', '/en/services/'],
          ['/o-nama/', '/en/about/'],
          ['/homestock/', '/en/homestock/'],
          ['/kontakt/', '/en/contact/'],
          ['/privatnost-homestock/', '/en/homestock-privacy-policy/'],
          ['/studije-slucaja/ubique-safety-consultants/', '/en/case-studies/ubique-safety-consultants/'],
        ];
        const path = item.url.replace(SITE, '');
        const pair = pairs.find(([hr, en]) => hr === path || en === path);
        if (pair) {
          const [hrPath, enPath] = pair;
          item.links = [
            { url: `${SITE}${hrPath}`, lang: 'hr' },
            { url: `${SITE}${enPath}`, lang: 'en' },
            { url: `${SITE}${hrPath}`, lang: 'x-default' },
          ];
        }
        return item;
      },
    }),
  ]
});