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

// https://astro.build/config
export default defineConfig({
  site: 'https://giveback.guide',
  trailingSlash: 'always',
  redirects: {
    '/blog/announcements/': '/blog/news-and-updates/',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkResponsiveImages],
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/docs/') && !page.includes('/design/'),
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
