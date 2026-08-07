import { defineConfig } from 'vite';  
import react from '@vitejs/plugin-react';  
  
export default defineConfig({  
  plugins: [
    react(),
    {
      name: 'vanilla-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const raw = req.url || '/';
          const path = raw.split('?')[0];
          const qs = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
          // Exact / OR /?payment=... must hit marketing form, not React SPA (/ → /login)
          if (path === '/' || path === '') {
            req.url = `/vanilla.html${qs}`;
          } else if (path === '/dashboard/claim-vault' || path === '/dashboard/claim-vault/') {
            req.url = `/claimvault.html${qs}`;
          }
          next();
        });
      }
    }
  ],  
  server: {  
    allowedHosts: true,
    proxy: {  
      '/api': 'http://finos-backend-1:8000',  
    },  
  },  
});
