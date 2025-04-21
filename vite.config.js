import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@package': resolve(__dirname, 'package.json'),
      '@root': resolve(__dirname),
    },
  },
  optimizeDeps: {
    include: ['react-dom'],
  },
  appType: 'mpa', 
  server: {
    historyApiFallback: {
      verbose: true, // Log rewrite details
      rewrites: [
        { from: /^\/blog$/, to: '/blog/index.html' }, // Exact match for /blog
        { from: /^\/blog\/$/, to: '/blog/index.html' }, // Match /blog/
      ],
    },
  },
});