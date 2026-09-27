import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Keep the manifest in public/ so there is a single editable source.
      manifest: false,
      injectRegister: 'script',
      includeAssets: ['manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        // Activate updates after existing tabs close, preserving in-progress routes.
        skipWaiting: false,
        clientsClaim: true,
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});
