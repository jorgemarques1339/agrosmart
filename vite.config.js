import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' define a raiz do projeto. '/' é essencial para deployments na Vercel
  // para evitar erros de MIME type e caminhos relativos quebrados.
  base: '/', 
  build: {
    // Aumenta o limite de aviso de tamanho do chunk para evitar warnings desnecessários
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Divide as bibliotecas principais em ficheiros separados para melhor cache e carregamento
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'charts'; // Separa os gráficos (pesado)
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps'; // Separa mapas (se usado futuramente)
            }
            if (id.includes('lucide-react')) {
              return 'icons'; // Separa ícones
            }
            // Todo o resto vai para um ficheiro genérico 'vendor'
            return 'vendor';
          }
        }
      }
    }
  }
})