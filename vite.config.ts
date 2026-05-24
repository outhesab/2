/// <reference types="vitest" />
/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { manualChunks } from "./src/lib/vite-manual-chunks";

export { manualChunks };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    // VitePWA devre dışı — build sorunları nedeniyle
    // VitePWA({
    //   registerType: "autoUpdate",
    //   injectRegister: "auto",
    //   workbox: {
    //     globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}"],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "google-fonts-cache",
    //           expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //       {
    //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "gstatic-fonts-cache",
    //           expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
    //           cacheableResponse: { statuses: [0, 200] },
    //         },
    //       },
    //     ],
    //     navigateFallback: "/",
    //   },
    //   manifest: {
    //     name: "Soba Yönetim Sistemi",
    //     short_name: "Soba YS",
    //     description: "Soba satış ve stok yönetim sistemi",
    //     theme_color: "#1e40af",
    //     background_color: "#0f172a",
    //     display: "standalone",
    //     orientation: "any",
    //     start_url: "/",
    //     icons: [
    //       {
    //         src: "/favicon.svg",
    //         sizes: "any",
    //         type: "image/svg+xml",
    //         purpose: "any maskable",
    //       },
    //       { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
    //       { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    //     ],
    //   },
    //   devOptions: { enabled: false },
    // }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    dedupe: ["react", "react-dom"],
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks,
      },
      external: [],
    },
    minify: "esbuild",
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      ignore: ["exceljs"],
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    // Capacitor live reload için
    hmr: {
      port: 3001,
    },
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
  },
  optimizeDeps: {
    include: [
      "xlsx",
      "@capacitor/core",
      "@capacitor/app",
      "@capacitor/device",
      "framer-motion",
      "exceljs",
    ],
    esbuildOptions: {
      mainFields: ["main", "module"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "scripts/**",
      // Playwright e2e testleri — ayrı runner ile çalışır
      "**/e2e/**",
      // Boş test dosyaları
      "**/gercekci-senaryolar.test.ts",
      "**/uygulama-gercek.test.ts",
      // vy/ yedek klasörü — src/ ile aynı
      "vy/**",
      // QA toolkit — ayrı Playwright kurulumu gerektirir
      "qa-toolkit/**",
    ],
  },
});
