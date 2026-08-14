import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "TaskMate – Student Portal",
        short_name: "TaskMate",
        description: "Manage notes, results, announcements and messages for your tuition class.",
        theme_color: "#10b981",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },

  preview: {
    host: "0.0.0.0",
    port: 3000,
  },

  build: {
    outDir: "dist",
  },
});
