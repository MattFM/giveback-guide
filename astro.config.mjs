// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from "astro-pagefind";
import remarkResponsiveImages from './src/utils/remark-responsive-images.mjs';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://giveback.guide',
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkResponsiveImages],
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/docs/'),
    }),
    pagefind()
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
  },
});