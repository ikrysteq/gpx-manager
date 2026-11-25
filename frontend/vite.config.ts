import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // maplibre-gl v6 loads its worker relative to its own module URL; Vite's dep pre-bundling breaks that.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  // Dev mode: the backend runs on plain HTTP :8080 (see backend/src/main/resources/application.properties).
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
