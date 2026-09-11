import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cloud: ["@supabase/supabase-js"],
          storage: ["dexie"],
          qr: ["qrcode"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "FeedSight AI",
        short_name: "FeedSight",
        description: "Offline feed intelligence",
        theme_color: "#174d36",
        background_color: "#f5f4ed",
        display: "standalone",
        start_url: "/",
        icons: [192, 512].map((s) => ({
          src: `/icon-${s}.png`,
          sizes: `${s}x${s}`,
          type: "image/png",
          purpose: "any",
        })),
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,json}"],
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});
