import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          // Keep PDF.js worker file with proper name
          if (assetInfo.name === 'pdf.worker.min.js') {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  worker: {
    format: 'es'
  },
  define: {
    // This helps with PDF.js compatibility
    global: 'globalThis'
  }
})
