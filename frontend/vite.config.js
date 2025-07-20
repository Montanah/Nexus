import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Strips /api prefix
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth/, ''), // Strips /auth prefix
      },
    },
    host: '0.0.0.0', // Required for Render.com
    port: 5173,      // Your Vite port (default: 5173)
    allowedHosts: [
      'nexusdashboard.onrender.com', // Allow Render domain
      'localhost',                  // Allow localhost (optional)
    ],
  },
});