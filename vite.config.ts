/// <reference types="vitest" />
/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { manualChunks } from "./src/lib/vite-manual-chunks";

export { manualChunks };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    mode === "analyze"
      ? visualizer({
          emitFile: true,
          filename: "stats.html",
          open: false,
          gzipSize: true,
          brotliSize: true,
        })
      : null,
    process.env.NODE_ENV === "production"
      ? null
      : Inspect({
          build: false,
          open: false,
        }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "firebase-api",
            },
          },
        ],
        navigateFallback: "/",
      },
      manifest: {
        name: "PARSPEL â€” Soba Yonetim Sistemi",
        short_name: "PARSPEL",
        description: "Soba satis ve stok yonetim sistemi",
        theme_color: "#0a0e27",
        background_color: "#0a0e27",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          {
            src: "/vite.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
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
    host: "127.0.0.1",
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
      coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts",
        "src/test/**",
        "src/agents/**",
        "**/node_modules/**",
      ],
      thresholds: {
        lines: 20,
        functions: 15,
        branches: 15,
        statements: 20,
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
      "**/e2e/**",
      "**/gercekci-senaryolar.test.ts",
      "**/uygulama-gercek.test.ts",
      "vy/**",
      "qa-toolkit/**",
    ],
  },
}));