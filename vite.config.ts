import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'file-compatible-html',
      transformIndexHtml(html) {
        return html
          .replace(/type="module"\s+crossorigin/g, 'defer')
          .replace(/\s+crossorigin/g, '')
          .replace('</head>', `    <link rel="stylesheet" href="./styles.css?v=${Date.now()}" />\n  </head>`);
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
