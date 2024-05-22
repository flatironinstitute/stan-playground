import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    host: "127.0.0.1"
  },
  // see https://github.com/pyodide/pyodide/issues/4244#issuecomment-1816370425
  resolve: {
    alias: {
        'node-fetch': 'isomorphic-fetch',
    },
  }
})
