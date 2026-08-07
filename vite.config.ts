import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 200000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/index.js',
        inlineDynamicImports: true,
      },
    },
  },
})
