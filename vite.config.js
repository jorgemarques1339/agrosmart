import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante caminhos absolutos para a Vercel
  base: '/',
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
            if (id.includes('leaflet')) return 'vendor-maps';
            return 'vendor';
          }
        }
      }
    }
  }
})