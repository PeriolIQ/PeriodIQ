import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // exclude native oxide bindings so Vite doesn't try to bundle the .node binary
    exclude: [
      '@tailwindcss/oxide',
      '@tailwindcss/oxide-linux-x64-gnu'
    ]
  },
  define: {
    // Polyfill "global" cho amazon-cognito-identity-js
    global: 'window',
  },
})