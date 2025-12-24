// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from "astro-pagefind";
import remarkResponsiveImages from './src/utils/remark-responsive-images.mjs';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://giveback.guide',
  trailingSlash: 'always',
  integrations: [
    mdx({
      remarkPlugins: [remarkResponsiveImages],
    }), 
    sitemap({
      filter: (page) => !page.includes('/docs/')
    }), 
    pagefind()
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});