import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' define a raiz do projeto. '/' é essencial para deployments na Vercel
  // para evitar erros de MIME type e caminhos relativos quebrados.
  base: '/', 
  build: {
    // Define explicitamente a pasta de saída (deve coincidir com a config da Vercel)
    outDir: 'dist',
    // Aumenta o limite de aviso de tamanho para evitar alertas desnecessários na consola
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Divide as bibliotecas pesadas em ficheiros separados (chunks)
        // Isto faz com que o site carregue mais rápido no telemóvel
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'charts'; // Separa os gráficos
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