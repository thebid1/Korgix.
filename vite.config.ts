import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // The app is served under /app/; the marketing landing page owns the root.
  base: '/app/',

  build: {
    outDir: 'dist/app',
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Korgix',
        short_name: 'Korgix',
        description: 'Plan your day. Stay on track.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        scope: '/app/',
        start_url: '/app/',
        orientation: 'portrait',
        shortcuts: [
          {
            name: 'Add Task',
            short_name: 'Add',
            description: 'Quickly add a new task',
            url: '/app/?action=add',
            icons: [{ src: '/app/icons/Korgix.png', sizes: '192x192' }]
          }
        ],
        share_target: {
          action: '/app/?action=add',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        icons: [
          { src: '/app/icons/Korgix.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '152x152', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '167x167', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
          { src: '/app/icons/Korgix.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    })
  ],

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  server: {
    allowedHosts: ['.outray.app']
  }
})
