import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Plugin to handle loader.js.map 404s
    {
      name: 'resolve-loader-map',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/loader.js.map') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{}'); // Return an empty JSON object for the source map
          } else {
            next();
          }
        });
      },
    },
  ],
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

