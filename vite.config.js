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
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['jspdf', 'jspdf-autotable', 'lucide-react'],
          'vendor-maps': ['leaflet', 'react-leaflet']
        }
      }
    }
  }
})