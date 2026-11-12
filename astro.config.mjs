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
        return !SITEMAP_EXCLUDED_PREFIXES.some((prefix) =>
          pathname.startsWith(prefix)
        );
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
