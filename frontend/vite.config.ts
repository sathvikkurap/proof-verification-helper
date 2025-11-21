import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const loaderMapPlugin = () => ({
  name: 'loader-map-fallback',
  configureServer(server: { middlewares: any }) {
    server.middlewares.use((req: any, res: any, next: () => void) => {
      if (req.url?.endsWith('/loader.js.map')) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('{}')
        return
      }
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), loaderMapPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Changed from 5000 to avoid AirPlay conflict
        changeOrigin: true,
      },
    },
  },
})

