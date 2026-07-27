import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://kong-nexus-db-stage.k8s-p.cloud.gracenote.com',
        changeOrigin: true,
        secure: false,
        // Strips "/api" out before forwarding the string to the staging cluster
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Host', 'kong-nexus-db-stage.k8s-p.cloud.gracenote.com');
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
})