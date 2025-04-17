// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from "astro-pagefind";

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://giveback.guide',
  integrations: [mdx(), sitemap(), pagefind()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});