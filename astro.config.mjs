// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    },
    ssr: {
      noExternal: ['monaco-editor'],
    },
  },

  output: 'server',

  adapter: node({
    mode: 'standalone'
  })
});