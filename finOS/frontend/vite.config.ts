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
          }
          next();
        });
      }
    }
  ],  
  server: {  
    proxy: {  
      '/api': 'http://backend:8000',  
    },  
  },  
});
