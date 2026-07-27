import { defineConfig } from 'vite';  
import react from '@vitejs/plugin-react';  
  
export default defineConfig({  
  plugins: [
    react(),
    {
      name: 'vanilla-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            req.url = '/vanilla.html';
          } else if (req.url === '/dashboard/claim-vault' || req.url === '/dashboard/claim-vault/') {
            req.url = '/claimvault.html';
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
