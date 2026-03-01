import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5000000,
      },
      manifest: {
        name: 'OrivaSmart - Gestão Agrícola',
        short_name: 'OrivaSmart',
        description: 'Plataforma de Smart Farming Oriva com controlo IoT e gestão pecuária.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FDFDF5',
        theme_color: '#3E6837',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/628/628283.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/628/628283.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // Garante caminhos absolutos para a Vercel
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('jspdf') || id.includes('lucide-react')) return 'vendor-utils';
            if (id.includes('maplibre') || id.includes('deck.gl')) return 'vendor-maps';
            if (id.includes('@tensorflow') || id.includes('onnx')) return 'vendor-ml';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('recharts')) return 'vendor-charts';
            return 'vendor';
          }
        }
      }
    }
  }
})