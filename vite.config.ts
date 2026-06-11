/// <reference types="vitest" />
/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import pkg from './package.json';
import Inspect from 'vite-plugin-inspect';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { manualChunks } from './src/lib/vite-manual-chunks';

export { manualChunks };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Production'da unsafe-eval ve ws:// bağlantısını kaldıran CSP dönüştürücü */
function cspPlugin(mode: string): Plugin {
  const isDev = mode === 'development' || mode === 'dev';

  if (isDev) {
    // Geliştirme ortamında mevcut CSP'yi koru
    return { name: 'csp-dev' };
  }

  const prodCsp =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.deepseek.com https://api.anthropic.com https://generativelanguage.googleapis.com https://*.react-grab.com;";

  return {
    name: 'csp-prod',
    transformIndexHtml(html) {
      return html.replace(
        /<meta\s+http-equiv="Content-Security-Policy"[^>]*\/?>/i,
        `<meta http-equiv="Content-Security-Policy" content="${prodCsp}" />`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development' || mode === 'dev';
  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      cspPlugin(mode),
      mode === 'analyze'
        ? visualizer({
            emitFile: true,
            filename: 'stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
          })
        : null,
      process.env.NODE_ENV === 'production' || isDev
        ? null
        : Inspect({
            build: false,
            open: false,
          }),
      // PWA plugin'ini dev build'de atla (hız kazancı)
      isDev
        ? null
        : VitePWA({
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-cache',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'gstatic-fonts-cache',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
                  handler: 'NetworkOnly',
                  options: {
                    cacheName: 'firebase-api',
                  },
                },
              ],
              navigateFallback: '/',
            },
            manifest: {
              name: 'PARSPEL — Soba Yönetim Sistemi',
              short_name: 'PARSPEL',
              description: 'PARSPEL Soba Yönetim Sistemi',
              theme_color: '#0a0e27',
              background_color: '#0a0e27',
              display: 'standalone',
              orientation: 'any',
              start_url: '/',
              icons: [
                {
                  src: '/vite.svg',
                  sizes: 'any',
                  type: 'image/svg+xml',
                  purpose: 'any maskable',
                },
              ],
            },
          }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
      dedupe: ['react', 'react-dom'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks,
        },
        external: [],
      },
      minify: isDev ? false : 'esbuild',
      chunkSizeWarningLimit: 500,
      sourcemap: isDev,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    server: {
      port: 3000,
      host: '127.0.0.1',
      hmr: {
        port: 3001,
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
    optimizeDeps: {
      include: ['xlsx', '@capacitor/core', '@capacitor/app', '@capacitor/device', 'framer-motion'],
      esbuildOptions: {
        mainFields: ['main', 'module'],
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/*.d.ts',
          'src/__tests__/**',
          'src/agents/**',
          '**/node_modules/**',
        ],
        thresholds: {
          lines: 20,
          functions: 15,
          branches: 15,
          statements: 20,
        },
      },
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/**', '**/e2e/**', 'vy/**', 'qa-toolkit/**'],
    },
  };
});
