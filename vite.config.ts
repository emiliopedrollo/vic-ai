import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({ 
      registerType: 'autoUpdate', 
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js, css, html, ico, png, svg}']
      },
      manifest: {
        name: 'Vic Cowmed',
        start_url: '/', 
        display: 'standalone',
        short_name: 'Vic Cowmed',
        description: "Chatbot da Vic Cowmed",
        theme_color: '#585654',
        background_color: '#585654',
        // screenshots: [
        //   {
        //     "src": "img/icons/android/android-chrome-512x512.png",
        //     "sizes": "512x512",
        //     "type": "image/png",
        //     "form_factor": "wide",
        //     "label": "Vic Cowmed"
        //   },
        //   {
        //     "src": "img/icons/android/android-chrome-512x512.png",
        //     "sizes": "512x512",
        //     "type": "image/png",
        //     "form_factor": "narrow",
        //     "label": "Vic Cowmed"
        //   }
        // ],
        icons: [
          {
            "src": "/img/icons/android/android-chrome-48x48.png",
            "sizes": "48x48",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android/android-chrome-72x72.png",
            "sizes": "72x72",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android/android-chrome-96x96.png",
            "sizes": "96x96",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android/android-chrome-144x144.png",
            "sizes": "144x144",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/img/icons/android/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            "src": "/apple-touch-icon-180x180.png",
            "sizes": "180x180",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
      }
    })
    // VueDevTools(),
  ],
  build: {
    rollupOptions: {
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 4173,
  }
})
