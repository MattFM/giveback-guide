// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from "astro-pagefind";
import remarkResponsiveImages from './src/utils/remark-responsive-images.mjs';

import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sitemap exclusions, matched against the URL pathname from the root.
 *
 * Prefix matching (rather than `includes`) keeps `/submit/` from also
 * sweeping up `/for-businesses/submit/`, which is a real marketing page and
 * should stay in the sitemap.
 */
const SITEMAP_EXCLUDED_PREFIXES = [
  '/docs/',
  '/design/',
  '/account/',
  '/search/',
  '/login/',
  '/verify/',
  '/claim/',
  '/submit/',
  '/feedback/',
  '/report/',
];

/**
 * Page 2+ of a country or locale hub. These pages carry `noindex, follow`
 * (T11.9), so they should not be submitted in the sitemap either. The
 * collection indexes (`/projects/2/`) are deliberately not matched: they keep
 * their generated titles and stay indexable.
 */
const PAGINATED_HUB = /^\/(projects|stays)\/(?:[^/]+\/)+\d+\/$/;

// https://astro.build/config
export default defineConfig({
  site: 'https://giveback.guide',
  trailingSlash: 'always',
  // Redirects live in `public/_redirects`, which Cloudflare Workers static
  // assets applies as real 301s. Astro's `redirects` option only emits a
  // 200 HTML page with a meta refresh on a static build, so it is not used.
  experimental: {
    incrementalBuild: true,
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkResponsiveImages],
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        if (SITEMAP_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
          return false;
        }
        return !PAGINATED_HUB.test(pathname);
      },
    }),
    pagefind()
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['pocketbase'],
    },
  },
});
