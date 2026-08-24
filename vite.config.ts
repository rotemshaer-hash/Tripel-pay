import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Stamped at build time so a screen can say which build it is. Without it, "the
// button isn't there" and "you are looking at yesterday's bundle" are the same
// report, and the only way to tell them apart is guesswork.
const buildId = (process.env.GITHUB_SHA || process.env.COMMIT_REF || "dev").slice(0, 7);

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId) },
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
