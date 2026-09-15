import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Produccion-Control-y-Cuadre/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
})
