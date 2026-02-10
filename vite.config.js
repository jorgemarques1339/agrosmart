import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante caminhos absolutos para a Vercel
  base: '/', 
  build: {
    // Pasta de saída padrão
    outDir: 'dist',
    // Limpa a pasta antes de construir
    emptyOutDir: true, 
  }
})