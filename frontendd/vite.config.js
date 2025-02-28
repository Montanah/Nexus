import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your backend's local address
        changeOrigin: true,              // Ensures the host header matches the target
        secure: false,                   // For local dev (non-HTTPS)
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: Remove '/api' prefix if backend doesn’t expect it
      },
    },
  },
});