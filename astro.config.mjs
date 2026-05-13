// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sivanesh.tv',
  integrations: [mdx(), sitemap()],
  server: { port: 4322, host: '127.0.0.1' },
});