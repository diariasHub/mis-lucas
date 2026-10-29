import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages publica el sitio en https://diariashub.github.io/mis-lucas/
const base = process.env.BASE_PATH ?? '/mis-lucas/'

export default defineConfig({
  base,
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mis Lucas',
        short_name: 'Mis Lucas',
        description: 'Control mensual de gastos, créditos y ahorro. Funciona sin internet.',
        lang: 'es-CL',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F3F5F2',
        theme_color: '#0E6B5E',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La app completa queda guardada en el dispositivo para abrir sin internet
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
        // Las tipografías de Google se guardan la primera vez que se cargan
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tipografias', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
