import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// maplibre-gl v6 loads its worker relative to its own module URL; Vite's dep pre-bundling breaks that.
export default defineConfig({ plugins: [react()], optimizeDeps: { exclude: ['maplibre-gl'] } })
