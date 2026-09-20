// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://scientificresearchers.org',
  server: {
    host: true,
    port: 43147,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
