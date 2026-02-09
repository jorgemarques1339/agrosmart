import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kb (para não chatear com avisos)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Esta função divide as bibliotecas em ficheiros separados
        // para que o carregamento do site seja mais rápido
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'charts'; // Separa os gráficos
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps'; // Separa o mapa
            }
            if (id.includes('lucide-react')) {
              return 'icons'; // Separa os ícones
            }
            return 'vendor'; // O resto fica num pacote genérico
          }
        }
      }
    }
  }
})